import "server-only";

import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

export function createAuthPerformance(operation: string) {
  const requestId = randomUUID();
  const startedAt = performance.now();
  const stages: Record<string, number> = {};

  return {
    requestId,
    async measure<T>(stage: string, work: () => Promise<T>) {
      const stageStartedAt = performance.now();
      try { return await work(); }
      finally { stages[stage] = Math.round(performance.now() - stageStartedAt); }
    },
    finish(outcome: string) {
      console.info(JSON.stringify({
        event: "auth_performance",
        operation,
        request_id: requestId,
        outcome,
        duration_ms: Math.round(performance.now() - startedAt),
        stages_ms: stages,
      }));
    },
  };
}
