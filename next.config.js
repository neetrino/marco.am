/** @type {import('next').NextConfig} */
const path = require('path');
const {
  getPreferredLanIPv4Addresses,
} = require('./scripts/lib/lan-ip.cjs');

function getPublicR2Origin() {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function getHostnameFromUrl(raw) {
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function getAllowedDevOrigins() {
  const hosts = new Set(['localhost', '127.0.0.1']);
  const envHosts = [
    getHostnameFromUrl(process.env.NEXT_PUBLIC_APP_URL),
    getHostnameFromUrl(process.env.APP_URL),
    getHostnameFromUrl(process.env.NEXT_PUBLIC_API_URL),
  ].filter(Boolean);

  for (const host of envHosts) {
    hosts.add(host);
  }

  for (const address of getPreferredLanIPv4Addresses()) {
    hosts.add(address);
  }

  return Array.from(hosts);
}

const r2Origin = getPublicR2Origin();
const r2PublicBase = process.env.R2_PUBLIC_URL
  ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
  : null;
const mediaSources = ["'self'", 'blob:', 'https:'];
if (r2Origin) {
  mediaSources.push(r2Origin);
}

const VERCEL_TOOLBAR_FRAME_HOSTS = [
  'https://www.google.com',
  'https://google.com',
  'https://maps.google.com',
  'https://www.openstreetmap.org',
  'https://openstreetmap.org',
  'https://www.youtube.com',
  'https://youtube.com',
  'https://www.youtube-nocookie.com',
  'https://youtube-nocookie.com',
];

/**
 * CSP is baked at build time — read env here (inside headers()), not at module load.
 * Vercel toolbar injects feedback.js on hosted deployments (preview + prod for team);
 * `VERCEL_ENV=preview` alone is unreliable during `next build`.
 */
function buildContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowVercelToolbar =
    isDevelopment || process.env.VERCEL === '1';

  const scriptSources = ["'self'", "'unsafe-inline'", 'https://code.tidio.co'];
  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
  }
  if (allowVercelToolbar) {
    scriptSources.push('https://vercel.live');
  }

  const frameSources = ["'self'", ...VERCEL_TOOLBAR_FRAME_HOSTS];
  if (allowVercelToolbar) {
    frameSources.push('https://vercel.live');
  }

  const connectSources = ["'self'", 'https:', 'wss://socket.tidio.co'];
  const fontSources = [
    "'self'",
    'https://fonts.gstatic.com',
    'https://code.tidio.co',
    'data:',
  ];
  const styleSources = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'];
  if (allowVercelToolbar) {
    connectSources.push('https://vercel.live', 'wss://ws-us3.pusher.com');
    fontSources.push('https://vercel.live', 'https://assets.vercel.com');
    styleSources.push('https://vercel.live');
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    `font-src ${fontSources.join(' ')}`,
    "img-src 'self' data: https: blob:",
    `media-src ${mediaSources.join(' ')}`,
    `connect-src ${connectSources.join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Map embeds (Google Maps / OSM) + About page YouTube hero; default-src alone blocks embeds
    `frame-src ${frameSources.join(' ')}`,
    "frame-ancestors 'none'",
  ].join('; ');
}

/** Default storefront media host(s) — also set NEXT_IMAGE_REMOTE_HOSTS for extra CDNs. */
const DEFAULT_STOREFRONT_IMAGE_HOSTS = ['marco.am', 'www.marco.am'];

/** Next/Image `remotePatterns` — R2 URLs must be listed or optimization returns 400. */
function buildImageRemotePatterns() {
  const patterns = [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'source.unsplash.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'unsplash.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'via.placeholder.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'images.pexels.com',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: '127.0.0.1',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'cdn-icons-png.flaticon.com',
      pathname: '/**',
    },
  ];

  const r2Host = getHostnameFromUrl(process.env.R2_PUBLIC_URL);
  if (r2Host) {
    patterns.push({
      protocol: 'https',
      hostname: r2Host,
      pathname: '/**',
    });
  }

  // Public bucket URLs (`pub-*.r2.dev`) when DB stores full URL; build may omit R2_PUBLIC_URL.
  patterns.push({
    protocol: 'https',
    hostname: '*.r2.dev',
    pathname: '/**',
  });

  const extraImageHosts = [
    ...DEFAULT_STOREFRONT_IMAGE_HOSTS,
    ...(process.env.NEXT_IMAGE_REMOTE_HOSTS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ];
  const uniqueImageHosts = [...new Set(extraImageHosts)];
  for (const hostname of uniqueImageHosts) {
    patterns.push({
      protocol: 'https',
      hostname,
      pathname: '/**',
    });
  }

  return patterns;
}

// Custom-output Prisma client: trace engines; keep schema.prisma beside generated client (db:generate) so dirname stays correct.
// Root `generated/prisma-client` is a mirror (sync-prisma-cwd-fallback.cjs) for Prisma's cwd fallback when traced __dirname lacks schema.
const prismaGeneratedTraceGlob = './shared/db/generated/prisma-client/**/*';
const prismaCwdFallbackTraceGlob = './generated/prisma-client/**/*';
const prismaTraceGlobs = [prismaGeneratedTraceGlob, prismaCwdFallbackTraceGlob];

const nextConfig = {
  reactStrictMode: true,
  // Keep workspace DB + generated Prisma client as Node externals so query engine `.node` paths resolve at runtime (bundling breaks `__dirname` for native engines).
  serverExternalPackages: ['@white-shop/db', '@prisma/client', 'sharp', 'ioredis'],
  outputFileTracingIncludes: {
    // Picomatch: `/*` matches one segment only; `/` is the App Router root; deep routes need `/**/*` and `/api/**/*`.
    '/': prismaTraceGlobs,
    '/*': prismaTraceGlobs,
    '/**/*': prismaTraceGlobs,
    '/api/**/*': prismaTraceGlobs,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Fewer full-route loading states on client navigation; revalidate in background.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  allowedDevOrigins: getAllowedDevOrigins(),
  // Скрыть индикатор "Compiling..." в углу в dev — не мешает на экране
  devIndicators: false,
  transpilePackages: ['@shop/ui', '@shop/design-tokens'],
  // Standalone for Linux/macOS CI and Docker; omitted on Windows — Turbopack trace copy
  // fails (EINVAL) when chunk paths contain `:` (e.g. node:crypto externals).
  ...(process.platform !== 'win32' ? { output: 'standalone' } : {}),
  // Security headers (P1-SEC-07)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: buildContentSecurityPolicy(),
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (!r2PublicBase) {
      return [];
    }
    return [
      {
        source: '/favicon.ico',
        destination: `${r2PublicBase}/static-site/logo.webp`,
      },
      {
        source: '/logo.webp',
        destination: `${r2PublicBase}/static-site/logo.webp`,
      },
      {
        source: '/assets/:path*',
        destination: `${r2PublicBase}/static-site/assets/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${r2PublicBase}/static-site/images/:path*`,
      },
      {
        source: '/icons/:path*',
        destination: `${r2PublicBase}/static-site/icons/:path*`,
      },
    ];
  },
  // typescript.ignoreBuildErrors removed - build will fail on TypeScript errors
  // This ensures type safety in production builds
  images: {
    remotePatterns: buildImageRemotePatterns(),
    // Explicitly allow both default quality and header logo quality.
    qualities: [100, 75],
    // Allow unoptimized images for development (images will use unoptimized prop)
    // Ensure image optimization is enabled for production
    formats: ['image/avif', 'image/webp'],
    // Set NEXT_IMAGE_UNOPTIMIZED=true only when local-only images break in dev.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
  },
  // Fix for HMR issues in Next.js 15
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Resolve workspace packages and path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@shop/ui': path.resolve(__dirname, 'shared/ui'),
      '@shop/design-tokens': path.resolve(__dirname, 'shared/design-tokens'),
    };
    
    return config;
  },
  // Turbopack configuration for monorepo
  // Required when webpack config is present - Next.js 16 requires explicit turbopack config
  // Set root to project root where Next.js is installed in node_modules (monorepo workspace)
  turbopack: {
    root: path.resolve(__dirname, '.'),
  },
};

module.exports = nextConfig;

