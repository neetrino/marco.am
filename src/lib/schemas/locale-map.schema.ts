import { z } from "zod";


export function buildLocalizedTextMapSchema(args: {
  max: number;
  min?: number;
  trim?: boolean;
}) {
  const min = args.min ?? 0;
  const base = args.trim ? z.string().trim() : z.string();
  const field = min > 0 ? base.min(min).max(args.max) : base.max(args.max);

  return z.object({
    hy: field,
    ru: field,
    en: field,
  });
}
