import { Context } from "@temporalio/activity";

/**
 * Emits a Temporal activity heartbeat when running inside a Temporal activity.
 * No-op when invoked directly (scripts/tests).
 */
export function heartbeat(details?: unknown): void {
  try {
    Context.current().heartbeat(details);
  } catch {
    // not inside an activity context
  }
}
