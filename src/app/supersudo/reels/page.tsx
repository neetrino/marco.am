'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import { showPopupConfirm } from '@/components/popup-service';
import type { ReelsManagementStorage } from '@/lib/schemas/reels-management.schema';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { ReelPreviewDialog } from './components/ReelPreviewDialog';

type ReelsLikesResponse = {
  likesByReelId: Record<string, number>;
};

type ReelsViewsResponse = {
  viewsByReelId: Record<string, number>;
};

type UploadVideoResponse = {
  url: string;
};

type ReelFormState = {
  titleHy: string;
  videoUrl: string;
  posterUrl: string;
  sourceType: 'admin_upload' | 'external_url';
};

type PreviewReelState = {
  title: string;
  videoUrl: string;
  posterUrl: string | null;
};

const EMPTY_FORM: ReelFormState = {
  titleHy: '',
  videoUrl: '',
  posterUrl: '',
  sourceType: 'external_url',
};
const REELS_LIKES_LABEL = 'likes';
const REELS_VIEWS_LABEL = 'views';

function buildId(seed: string): string {
  const compact = seed.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${compact || 'reel'}-${randomPart}`;
}

function getModerationTone(status: string): string {
  if (status === 'approved') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
  }
  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100';
  }
  return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100';
}

export default function ReelsPage() {
  const { t } = useTranslation();
  const { user, isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/reels';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storage, setStorage] = useState<ReelsManagementStorage | null>(null);
  const [likesByReelId, setLikesByReelId] = useState<Record<string, number>>({});
  const [viewsByReelId, setViewsByReelId] = useState<Record<string, number>>({});
  const [form, setForm] = useState<ReelFormState>(EMPTY_FORM);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [previewReel, setPreviewReel] = useState<PreviewReelState | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [reelsStorage, likes, views] = await Promise.all([
        apiClient.get<ReelsManagementStorage>('/api/v1/supersudo/reels'),
        apiClient.get<ReelsLikesResponse>('/api/v1/supersudo/reels/likes'),
        apiClient.get<ReelsViewsResponse>('/api/v1/supersudo/reels/views'),
      ]);
      setStorage(reelsStorage);
      setLikesByReelId(likes.likesByReelId);
      setViewsByReelId(views.viewsByReelId);
    } catch (error: unknown) {
      alert(getApiOrErrorMessage(error, t('admin.reels.failedToLoad')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void reload();
    }
  }, [isAdmin, isLoggedIn, reload]);

  const canAdd = useMemo(() => {
    return form.titleHy.trim().length > 0 && form.videoUrl.trim().length > 0;
  }, [form]);

  const sortedItems = useMemo(() => {
    return (
      storage?.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)) ?? []
    );
  }, [storage?.items]);

  const activeReelsCount = useMemo(() => {
    return sortedItems.filter((item) => item.active).length;
  }, [sortedItems]);

  const totalLikes = useMemo(() => {
    return sortedItems.reduce((sum, item) => sum + (likesByReelId[item.id] ?? 0), 0);
  }, [sortedItems, likesByReelId]);

  const totalViews = useMemo(() => {
    return sortedItems.reduce((sum, item) => sum + (viewsByReelId[item.id] ?? 0), 0);
  }, [sortedItems, viewsByReelId]);

  const persistStorage = useCallback(
    async (nextStorage: ReelsManagementStorage) => {
      setSaving(true);
      try {
        const saved = await apiClient.put<ReelsManagementStorage>('/api/v1/supersudo/reels', nextStorage);
        setStorage(saved);
      } catch (error: unknown) {
        alert(getApiOrErrorMessage(error, t('admin.reels.failedToSave')));
      } finally {
        setSaving(false);
      }
    },
    [t],
  );

  const handleAdd = async () => {
    if (!storage || !canAdd || saving) {
      return;
    }

    const maxSortOrder = storage.items.reduce((max, item) => Math.max(max, item.sortOrder), -1);
    const nextStorage: ReelsManagementStorage = {
      ...storage,
      items: [
        ...storage.items,
        {
          id: buildId(form.titleHy),
          title: {
            hy: form.titleHy.trim(),
            ru: form.titleHy.trim(),
            en: form.titleHy.trim(),
          },
          sourceType: form.sourceType,
          videoUrl: form.videoUrl.trim(),
          posterUrl: form.posterUrl.trim().length > 0 ? form.posterUrl.trim() : null,
          active: true,
          sortOrder: maxSortOrder + 1,
          moderation: {
            status: 'approved',
            note: null,
            moderatedAt: new Date().toISOString(),
            moderatedBy: user?.id ?? 'admin',
          },
        },
      ],
    };

    await persistStorage(nextStorage);
    setForm(EMPTY_FORM);
    setIsAddFormOpen(false);
  };

  const handlePublishNow = async (reelId: string) => {
    if (!storage || saving) {
      return;
    }
    const nextStorage: ReelsManagementStorage = {
      ...storage,
      items: storage.items.map((item) =>
        item.id === reelId
          ? {
              ...item,
              moderation: {
                ...item.moderation,
                status: 'approved',
                moderatedAt: new Date().toISOString(),
                moderatedBy: user?.id ?? 'admin',
              },
            }
          : item,
      ),
    };
    await persistStorage(nextStorage);
  };

  const handleDelete = async (reelId: string) => {
    if (!storage || saving) {
      return;
    }
    if (!(await showPopupConfirm(t('admin.reels.deleteConfirm')))) {
      return;
    }
    const nextStorage: ReelsManagementStorage = {
      ...storage,
      items: storage.items.filter((item) => item.id !== reelId),
    };
    await persistStorage(nextStorage);
  };

  const handleVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploadingVideo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const payload = new FormData();
      payload.append('file', file);

      const response = await fetch('/api/v1/supersudo/reels/upload-video', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });

      const responseBody = (await response.json().catch(() => null)) as UploadVideoResponse | { detail?: string } | null;
      if (!response.ok || !responseBody || !('url' in responseBody)) {
        const detail = responseBody && 'detail' in responseBody ? responseBody.detail : null;
        throw new Error(detail || t('admin.reels.uploadFailed'));
      }

      setForm((prev) => ({
        ...prev,
        sourceType: 'admin_upload',
        videoUrl: responseBody.url,
      }));
    } catch (error: unknown) {
      alert(getApiOrErrorMessage(error, t('admin.reels.uploadFailed')));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePosterUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploadingPoster(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const payload = new FormData();
      payload.append('file', file);

      const response = await fetch('/api/v1/supersudo/reels/upload-poster', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });

      const responseBody = (await response.json().catch(() => null)) as UploadVideoResponse | { detail?: string } | null;
      if (!response.ok || !responseBody || !('url' in responseBody)) {
        const detail = responseBody && 'detail' in responseBody ? responseBody.detail : null;
        throw new Error(detail || t('admin.reels.posterUploadFailed'));
      }

      setForm((prev) => ({
        ...prev,
        posterUrl: responseBody.url,
      }));
    } catch (error: unknown) {
      alert(getApiOrErrorMessage(error, t('admin.reels.posterUploadFailed')));
    } finally {
      setUploadingPoster(false);
    }
  };

  if (isLoading || (!isLoggedIn || !isAdmin)) {
    return null;
  }

  const addReelHeaderAction = (
    <button
      type="button"
      onClick={() => setIsAddFormOpen((prev) => !prev)}
      className="inline-flex h-10 items-center rounded-lg bg-marco-yellow px-4 text-sm font-semibold text-marco-black transition hover:brightness-95"
    >
      {isAddFormOpen ? t('admin.common.close') : t('admin.reels.add')}
    </button>
  );

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.reels.title')}
      backLabel={t('admin.reels.backToAdmin')}
      onBack={() => router.push('/supersudo')}
      headerActions={addReelHeaderAction}
    >
      <div className="min-w-0 flex-1 space-y-4">
        <section className="overflow-hidden rounded-xl border border-marco-border bg-gradient-to-r from-white via-marco-gray/70 to-white p-4 text-marco-black shadow-[0_12px_28px_rgba(16,16,16,0.08)] sm:p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-marco-border bg-white/85 p-3">
              <p className="text-xs text-marco-text/70">{t('admin.reels.list')}</p>
              <p className="mt-1 text-2xl font-semibold">{sortedItems.length}</p>
            </div>
            <div className="rounded-xl border border-marco-border bg-white/85 p-3">
              <p className="text-xs text-marco-text/70">{t('admin.reels.statActive')}</p>
              <p className="mt-1 text-2xl font-semibold">{activeReelsCount}</p>
            </div>
            <div className="rounded-xl border border-marco-border bg-white/85 p-3">
              <p className="text-xs text-marco-text/70">{REELS_LIKES_LABEL}</p>
              <p className="mt-1 text-2xl font-semibold">{totalLikes}</p>
            </div>
            <div className="rounded-xl border border-marco-border bg-white/85 p-3">
              <p className="text-xs text-marco-text/70">{REELS_VIEWS_LABEL}</p>
              <p className="mt-1 text-2xl font-semibold">{totalViews}</p>
            </div>
          </div>
        </section>

        {isAddFormOpen ? (
          <section className="rounded-xl border border-marco-border bg-gradient-to-b from-marco-yellow/10 to-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-gray-600">{t('admin.reels.titleHy')}</span>
                <input
                  value={form.titleHy}
                  onChange={(e) => setForm((prev) => ({ ...prev, titleHy: e.target.value }))}
                  placeholder={t('admin.reels.titleHy')}
                  className="admin-field"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-gray-600">{t('admin.reels.externalSource')}</span>
                <select
                  value={form.sourceType}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourceType: e.target.value as ReelFormState['sourceType'] }))}
                  className="admin-field"
                >
                  <option value="external_url">{t('admin.reels.externalSource')}</option>
                  <option value="admin_upload">{t('admin.reels.adminUpload')}</option>
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-gray-600">{t('admin.reels.videoUrl')}</span>
                <input
                  value={form.videoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder={t('admin.reels.videoUrl')}
                  className="admin-field"
                />
              </label>
              <div className="rounded-xl border border-dashed border-marco-border bg-white/80 p-3 md:col-span-2">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/ogg"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="inline-flex h-9 items-center rounded-lg border border-marco-yellow/60 bg-marco-yellow/25 px-3.5 text-sm font-medium text-marco-black transition hover:bg-marco-yellow/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingVideo ? t('admin.reels.uploadingVideo') : t('admin.reels.uploadVideo')}
                </button>
              </div>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-gray-600">{t('admin.reels.posterUrl')}</span>
                <input
                  value={form.posterUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, posterUrl: e.target.value }))}
                  placeholder={t('admin.reels.posterUrl')}
                  className="admin-field"
                />
              </label>
              <div className="rounded-xl border border-dashed border-marco-border bg-white/80 p-3 md:col-span-2">
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handlePosterUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  disabled={uploadingPoster}
                  className="inline-flex h-9 items-center rounded-lg border border-marco-yellow/60 bg-marco-yellow/25 px-3.5 text-sm font-medium text-marco-black transition hover:bg-marco-yellow/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPoster ? t('admin.reels.uploadingPoster') : t('admin.reels.uploadPoster')}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 md:col-span-2">
                <button
                  onClick={handleAdd}
                  disabled={!canAdd || saving}
                  className="inline-flex h-10 items-center rounded-lg bg-marco-yellow px-4 text-sm font-semibold text-marco-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? t('admin.reels.saving') : t('admin.reels.add')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="inline-flex h-10 items-center rounded-lg border border-marco-border bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  {t('admin.common.cancel')}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="admin-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.reels.list')}</h2>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {t('admin.reels.listCountBadge').replace('{count}', String(sortedItems.length))}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">{t('admin.reels.loading')}</p>
          ) : sortedItems.length === 0 ? (
            <p className="text-sm text-gray-500">{t('admin.reels.empty')}</p>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => {
                const safePosterUrl = toSafeImgAttributeSrc(item.posterUrl ?? '');
                return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      {safePosterUrl ? (
                        <img
                          src={toDomSafeImgSrcString(safePosterUrl)}
                          alt=""
                          className="h-28 w-20 rounded-xl border border-gray-200 bg-slate-100 object-cover shadow-inner"
                        />
                      ) : (
                        <div
                          className="flex h-28 w-20 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-gray-400"
                          aria-hidden
                        >
                          —
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{item.title.hy}</p>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 ring-1 ring-indigo-100">
                          {item.sourceType}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 ${getModerationTone(item.moderation.status)}`}>
                          {item.moderation.status}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 ring-1 ${
                            item.active
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                              : 'bg-gray-100 text-gray-600 ring-gray-200'
                          }`}
                        >
                          {item.active ? 'active' : 'inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {REELS_LIKES_LABEL}: {likesByReelId[item.id] ?? 0}
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {REELS_VIEWS_LABEL}: {viewsByReelId[item.id] ?? 0}
                      </p>
                      {item.moderation.status !== 'approved' ? (
                        <button
                          onClick={() => void handlePublishNow(item.id)}
                          disabled={saving}
                          className="mt-2 block w-full rounded-lg border border-marco-yellow/60 bg-marco-yellow/20 px-3 py-1.5 text-xs font-semibold text-marco-black transition hover:bg-marco-yellow/35 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Publish now
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewReel({
                            title: item.title.hy,
                            videoUrl: item.videoUrl,
                            posterUrl: item.posterUrl,
                          })
                        }
                        className="mt-2 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                      >
                        {t('admin.reels.preview')}
                      </button>
                      <button
                        onClick={() => void handleDelete(item.id)}
                        disabled={saving}
                        className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t('admin.reels.delete')}
                      </button>
                    </div>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <ReelPreviewDialog
        isOpen={previewReel !== null}
        title={previewReel?.title ?? ''}
        videoUrl={previewReel?.videoUrl ?? ''}
        posterUrl={previewReel?.posterUrl ?? null}
        closeLabel={t('admin.common.close')}
        onClose={() => setPreviewReel(null)}
      />
    </AdminPageLayout>
  );
}
