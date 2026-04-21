'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { apiClient } from '../../lib/api-client';
import type { PublicReelItem } from '../../lib/schemas/reels-management.schema';

export type ReelInteractionState = PublicReelItem & {
  likesCount: number;
  likedByCurrentUser: boolean;
};

type ReelLikeMutationPayload = {
  likesCount: number;
  likedByCurrentUser: boolean;
};

type PublicReelsApiResponse = {
  items: Array<{
    id: string;
    likesCount: number;
    likedByCurrentUser: boolean;
  }>;
};

function toInteractionItems(items: PublicReelItem[]): ReelInteractionState[] {
  return items.map((item) => ({
    ...item,
    likesCount: item.likesCount,
    likedByCurrentUser: item.likedByCurrentUser,
  }));
}

function mergeServerLikeState(
  currentItems: ReelInteractionState[],
  apiItems: PublicReelsApiResponse['items'],
): ReelInteractionState[] {
  const likesById = new Map(apiItems.map((item) => [item.id, item]));
  return currentItems.map((item) => {
    const serverLike = likesById.get(item.id);
    if (!serverLike) {
      return item;
    }
    return {
      ...item,
      likesCount: serverLike.likesCount,
      likedByCurrentUser: serverLike.likedByCurrentUser,
    };
  });
}

export type UseReelsFeedDataResult = {
  reelItems: ReelInteractionState[];
  pendingLikeById: Record<string, boolean>;
  doubleTapBurstById: Record<string, number>;
  toggleLike: (args: {
    reelId: string;
    forceLiked?: boolean;
    registerBurst?: boolean;
  }) => void;
};

export function useReelsFeedData(items: PublicReelItem[]): UseReelsFeedDataResult {
  const requestTokenRef = useRef(0);
  const pendingLikeTokenRef = useRef<Record<string, number>>({});
  const reelsRef = useRef<ReelInteractionState[]>(toInteractionItems(items));
  const [pendingLikeById, setPendingLikeById] = useState<Record<string, boolean>>({});
  const [doubleTapBurstById, setDoubleTapBurstById] = useState<Record<string, number>>({});
  const [reelItems, setReelItems] = useState<ReelInteractionState[]>(() =>
    toInteractionItems(items),
  );

  useEffect(() => {
    reelsRef.current = reelItems;
  }, [reelItems]);

  useEffect(() => {
    setReelItems((prev) => {
      const next = toInteractionItems(items);
      if (prev.length === 0) {
        return next;
      }
      const prevById = new Map(prev.map((item) => [item.id, item]));
      return next.map((item) => {
        const persisted = prevById.get(item.id);
        if (!persisted) {
          return item;
        }
        return {
          ...item,
          likesCount: persisted.likesCount,
          likedByCurrentUser: persisted.likedByCurrentUser,
        };
      });
    });
  }, [items]);

  useEffect(() => {
    const controller = new AbortController();
    const syncFeedLikes = async () => {
      try {
        const payload = await apiClient.get<PublicReelsApiResponse>('/api/v1/reels', {
          signal: controller.signal,
        });
        setReelItems((prev) => mergeServerLikeState(prev, payload.items));
      } catch {
        // Keep SSR state on failure.
      }
    };
    void syncFeedLikes();
    return () => {
      controller.abort();
    };
  }, []);

  const setReelLikeState = useCallback((reelId: string, next: ReelLikeMutationPayload) => {
    setReelItems((prev) =>
      prev.map((item) => {
        if (item.id !== reelId) {
          return item;
        }
        return {
          ...item,
          likesCount: next.likesCount,
          likedByCurrentUser: next.likedByCurrentUser,
        };
      }),
    );
  }, []);

  const requestLikeMutation = useCallback(
    async (reelId: string, shouldLike: boolean, rollback: ReelLikeMutationPayload) => {
      const method = shouldLike ? 'POST' : 'DELETE';
      const token = ++requestTokenRef.current;
      pendingLikeTokenRef.current[reelId] = token;
      setPendingLikeById((prev) => ({ ...prev, [reelId]: true }));

      try {
        const payload =
          method === 'POST'
            ? await apiClient.post<ReelLikeMutationPayload>(`/api/v1/reels/${reelId}/like`)
            : await apiClient.delete<ReelLikeMutationPayload>(`/api/v1/reels/${reelId}/like`);
        if (pendingLikeTokenRef.current[reelId] === token) {
          setReelLikeState(reelId, payload);
        }
      } catch {
        if (pendingLikeTokenRef.current[reelId] === token) {
          setReelLikeState(reelId, rollback);
        }
      } finally {
        if (pendingLikeTokenRef.current[reelId] !== token) {
          return;
        }
        setPendingLikeById((prev) => ({ ...prev, [reelId]: false }));
      }
    },
    [setReelLikeState],
  );

  const toggleLike = useCallback(
    (args: { reelId: string; forceLiked?: boolean; registerBurst?: boolean }) => {
      const current = reelsRef.current.find((item) => item.id === args.reelId);
      if (!current || pendingLikeById[args.reelId]) {
        return;
      }
      const nextLiked = args.forceLiked ?? !current.likedByCurrentUser;
      if (nextLiked === current.likedByCurrentUser) {
        if (args.registerBurst) {
          setDoubleTapBurstById((prev) => ({
            ...prev,
            [args.reelId]: (prev[args.reelId] ?? 0) + 1,
          }));
        }
        return;
      }
      const rollback = {
        likesCount: current.likesCount,
        likedByCurrentUser: current.likedByCurrentUser,
      };
      setReelLikeState(args.reelId, {
        likesCount: Math.max(0, current.likesCount + (nextLiked ? 1 : -1)),
        likedByCurrentUser: nextLiked,
      });
      if (args.registerBurst) {
        setDoubleTapBurstById((prev) => ({
          ...prev,
          [args.reelId]: (prev[args.reelId] ?? 0) + 1,
        }));
      }
      void requestLikeMutation(args.reelId, nextLiked, rollback);
    },
    [pendingLikeById, requestLikeMutation, setReelLikeState],
  );

  return {
    reelItems,
    pendingLikeById,
    doubleTapBurstById,
    toggleLike,
  };
}
