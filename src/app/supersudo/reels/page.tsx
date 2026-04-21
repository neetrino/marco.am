'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { ReelsManagementStorage } from '@/lib/schemas/reels-management.schema';
import { AdminSidebar } from '../components/AdminSidebar';

type ReelsLikesResponse = {
  likesByReelId: Record<string, number>;
};

type UploadVideoResponse = {
  url: string;
};

type ReelFormState = {
  titleHy: string;
  titleRu: string;
  titleEn: string;
  videoUrl: string;
  posterUrl: string;
  sourceType: 'admin_upload' | 'external_url';
};

const EMPTY_FORM: ReelFormState = {
  titleHy: '',
  titleRu: '',
  titleEn: '',
  videoUrl: '',
  posterUrl: '',
  sourceType: 'external_url',
};

function buildId(seed: string): string {
  const compact = seed.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${compact || 'reel'}-${randomPart}`;
}

export default function ReelsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/reels';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storage, setStorage] = useState<ReelsManagementStorage | null>(null);
  const [likesByReelId, setLikesByReelId] = useState<Record<string, number>>({});
  const [form, setForm] = useState<ReelFormState>(EMPTY_FORM);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [reelsStorage, likes] = await Promise.all([
        apiClient.get<ReelsManagementStorage>('/api/v1/supersudo/reels'),
        apiClient.get<ReelsLikesResponse>('/api/v1/supersudo/reels/likes'),
      ]);
      setStorage(reelsStorage);
      setLikesByReelId(likes.likesByReelId);
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
    return (
      form.titleHy.trim().length > 0 &&
      form.titleRu.trim().length > 0 &&
      form.titleEn.trim().length > 0 &&
      form.videoUrl.trim().length > 0
    );
  }, [form]);

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
          id: buildId(form.titleEn || form.titleHy),
          title: {
            hy: form.titleHy.trim(),
            ru: form.titleRu.trim(),
            en: form.titleEn.trim(),
          },
          sourceType: form.sourceType,
          videoUrl: form.videoUrl.trim(),
          posterUrl: form.posterUrl.trim().length > 0 ? form.posterUrl.trim() : null,
          active: true,
          sortOrder: maxSortOrder + 1,
          moderation: {
            status: 'pending',
            note: null,
            moderatedAt: null,
            moderatedBy: null,
          },
        },
      ],
    };

    await persistStorage(nextStorage);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (reelId: string) => {
    if (!storage || saving) {
      return;
    }
    if (!confirm(t('admin.reels.deleteConfirm'))) {
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

  if (isLoading || (!isLoggedIn || !isAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 lg:ml-64">
          <button onClick={() => router.push('/supersudo')} className="mb-4 flex items-center text-gray-600 hover:text-gray-900">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.reels.backToAdmin')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.reels.title')}</h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <AdminSidebar currentPath={currentPath} router={router} t={t} />

          <div className="min-w-0 flex-1 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('admin.reels.addNew')}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.titleHy} onChange={(e) => setForm((prev) => ({ ...prev, titleHy: e.target.value }))} placeholder={t('admin.reels.titleHy')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={form.titleRu} onChange={(e) => setForm((prev) => ({ ...prev, titleRu: e.target.value }))} placeholder={t('admin.reels.titleRu')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={form.titleEn} onChange={(e) => setForm((prev) => ({ ...prev, titleEn: e.target.value }))} placeholder={t('admin.reels.titleEn')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <select value={form.sourceType} onChange={(e) => setForm((prev) => ({ ...prev, sourceType: e.target.value as ReelFormState['sourceType'] }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="external_url">{t('admin.reels.externalSource')}</option>
                  <option value="admin_upload">{t('admin.reels.adminUpload')}</option>
                </select>
                <input value={form.videoUrl} onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))} placeholder={t('admin.reels.videoUrl')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2" />
                <div className="md:col-span-2">
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
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingVideo ? t('admin.reels.uploadingVideo') : t('admin.reels.uploadVideo')}
                  </button>
                </div>
                <input value={form.posterUrl} onChange={(e) => setForm((prev) => ({ ...prev, posterUrl: e.target.value }))} placeholder={t('admin.reels.posterUrl')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2" />
              </div>
              <button onClick={handleAdd} disabled={!canAdd || saving} className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? t('admin.reels.saving') : t('admin.reels.add')}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.reels.list')}</h2>
                <button onClick={() => void reload()} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t('admin.reels.refreshLikes')}
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">{t('admin.reels.loading')}</p>
              ) : (storage?.items.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500">{t('admin.reels.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {storage?.items
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
                    .map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{item.title.hy}</p>
                            <p className="text-xs text-gray-500">ID: {item.id}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.sourceType} · {item.moderation.status} · {item.active ? 'active' : 'inactive'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">
                              {t('admin.reels.likes')}: {likesByReelId[item.id] ?? 0}
                            </p>
                            <button
                              onClick={() => void handleDelete(item.id)}
                              disabled={saving}
                              className="mt-2 rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {t('admin.reels.delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
