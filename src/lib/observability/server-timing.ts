export type ServerTimingMetric = {
  name: string;
  durationMs: number;
  description?: string;
};

function sanitizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function formatServerTiming(metrics: readonly ServerTimingMetric[]): string {
  return metrics
    .filter((metric) => metric.durationMs >= 0)
    .map((metric) => {
      const name = sanitizeToken(metric.name);
      const duration = Math.max(0, Math.round(metric.durationMs * 10) / 10);
      const description = metric.description
        ? `;desc="${metric.description.replace(/"/g, '\\"')}"`
        : '';
      return `${name};dur=${duration}${description}`;
    })
    .join(', ');
}

