import { logger } from "@/lib/utils/logger";

type MetricsContext = {
  route: string;
  method: string;
  status: number;
  durationMs: number;
};

function shouldEmitApiMetrics(): boolean {
  const raw = process.env.PERF_TELEMETRY_ENABLED?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") {
    return true;
  }
  if (raw === "0" || raw === "false" || raw === "no") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

export async function withApiRouteMetrics<T>(
  route: string,
  method: string,
  run: () => Promise<T>,
  resolveStatus: (value: T) => number,
): Promise<T> {
  const startedAt = Date.now();
  try {
    const value = await run();
    if (shouldEmitApiMetrics()) {
      const context: MetricsContext = {
        route,
        method,
        status: resolveStatus(value),
        durationMs: Date.now() - startedAt,
      };
      logger.alwaysInfo("api_route_metrics", context);
    }
    return value;
  } catch (error) {
    if (shouldEmitApiMetrics()) {
      const context: MetricsContext = {
        route,
        method,
        status: 500,
        durationMs: Date.now() - startedAt,
      };
      logger.alwaysInfo("api_route_metrics", context);
    }
    throw error;
  }
}
