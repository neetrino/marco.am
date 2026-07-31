import type { MetadataRoute } from 'next';
import { SITE_BASE_URL } from '@/lib/constants/site-url';

const ROBOTS_DISALLOW_PATHS = [
  '/api/',
  '/login',
  '/register',
  '/profile',
  '/compare',
  '/wishlist',
  '/cart',
  '/checkout',
  '/supersudo',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
  };
}
