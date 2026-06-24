import { getDeploymentTier } from "@/lib/config/deployment-env";

const VERCEL_TOOLBAR_FRAME_HOSTS = [
  "https://www.google.com",
  "https://google.com",
  "https://maps.google.com",
  "https://www.openstreetmap.org",
  "https://openstreetmap.org",
  "https://www.youtube.com",
  "https://youtube.com",
  "https://www.youtube-nocookie.com",
  "https://youtube-nocookie.com",
];

type BuildCspOptions = {
  nonce: string;
};

/**
 * Per-request CSP with nonce for inline scripts. Production omits `unsafe-inline`
 * on script-src; development keeps it for Next.js HMR.
 */
export function buildContentSecurityPolicyHeader(options: BuildCspOptions): string {
  const tier = getDeploymentTier();
  const isDevelopment = tier === "development";
  const allowVercelToolbar = isDevelopment || process.env.VERCEL === "1";

  const scriptSources = ["'self'", `'nonce-${options.nonce}'`, "https://code.tidio.co"];
  if (isDevelopment) {
    scriptSources.push("'unsafe-inline'", "'unsafe-eval'");
  }
  if (allowVercelToolbar) {
    scriptSources.push("https://vercel.live");
  }

  const frameSources = ["'self'", ...VERCEL_TOOLBAR_FRAME_HOSTS];
  if (allowVercelToolbar) {
    frameSources.push("https://vercel.live");
  }

  const connectSources = ["'self'", "https:", "wss://socket.tidio.co"];
  const fontSources = [
    "'self'",
    "https://fonts.gstatic.com",
    "https://code.tidio.co",
    "data:",
  ];
  const styleSources = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
  if (allowVercelToolbar) {
    connectSources.push("https://vercel.live", "wss://ws-us3.pusher.com");
    fontSources.push("https://vercel.live", "https://assets.vercel.com");
    styleSources.push("https://vercel.live");
  }

  const mediaSources = ["'self'", "blob:", "https:"];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src ${styleSources.join(" ")}`,
    `font-src ${fontSources.join(" ")}`,
    "img-src 'self' data: https: blob:",
    `media-src ${mediaSources.join(" ")}`,
    `connect-src ${connectSources.join(" ")}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    `frame-src ${frameSources.join(" ")}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Header name forwarded from proxy to RSC for inline Script nonces. */
export const CSP_NONCE_REQUEST_HEADER = "x-nonce";
