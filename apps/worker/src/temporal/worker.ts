/**
 * VOX Temporal Worker — Production Entry Point (P0-M Track M1)
 *
 * Starts a Temporal Worker that:
 *  - Connects to Temporal server (TEMPORAL_ADDRESS)
 *  - Registers all 18 production activities
 *  - Processes jobs from the vox-production task queue
 *  - Shuts down gracefully on SIGTERM/SIGINT
 *
 * Run with: pnpm --filter @vox/worker temporal:worker
 * Start Temporal: pnpm --filter @vox/worker temporal:up
 */

import { Worker, NativeConnection } from "@temporalio/worker";
import { activities } from "./activities";

const TEMPORAL_ADDRESS  = process.env["TEMPORAL_ADDRESS"]   ?? "localhost:7233";
const TEMPORAL_NS       = process.env["TEMPORAL_NAMESPACE"]  ?? "default";
const TASK_QUEUE        = process.env["TEMPORAL_TASK_QUEUE"] ?? "vox-production";
const MAX_CONCURRENT    = parseInt(process.env["TEMPORAL_MAX_CONCURRENT"] ?? "5", 10);

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║        VOX Studio — Temporal Worker          ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Temporal:   ${TEMPORAL_ADDRESS}`);
  console.log(`  Namespace:  ${TEMPORAL_NS}`);
  console.log(`  Task Queue: ${TASK_QUEUE}`);
  console.log(`  Concurrent: ${MAX_CONCURRENT}`);
  console.log(`  Activities: ${Object.keys(activities).length} registered`);
  console.log("");

  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace:    TEMPORAL_NS,
    taskQueue:    TASK_QUEUE,
    activities,
    // Workflow definitions are loaded from workflow-def.ts if needed
    // workflowsPath: require.resolve('./workflow-def'),
    maxConcurrentActivityTaskExecutions: MAX_CONCURRENT,
  });

  // Graceful shutdown
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nReceived ${signal}. Shutting down Temporal Worker...`);
    try {
      worker.shutdown();
      await connection.close();
      console.log("VOX Temporal Worker shut down cleanly.");
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { void shutdown("SIGINT"); });

  console.log("VOX Temporal Worker running. Press Ctrl+C to stop.\n");
  await worker.run();
}

main().catch((err: unknown) => {
  console.error("Fatal error starting Temporal Worker:", err);
  process.exit(1);
});
