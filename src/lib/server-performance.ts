import "server-only";

import { performance } from "node:perf_hooks";

export async function measureServerOperation<T>(operation: string, work: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  try {
    return await work();
  } finally {
    if (process.env.SERVER_PERFORMANCE_LOGGING === "true") {
      console.info(JSON.stringify({
        event: "server_performance",
        operation,
        duration_ms: Math.round(performance.now() - startedAt),
      }));
    }
  }
}
