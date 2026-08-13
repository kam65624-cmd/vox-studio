import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities/index.js";
import { episodeProductionWorkflow } from "./workflows/episodeProduction.js";
import { env, providerSummary } from "@vox/config";

export async function runWorker(): Promise<void> {
  const connection = await NativeConnection.connect({ address: env.TEMPORAL_ADDRESS });
  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: "vox-production",
    workflowsPath: new URL("./workflows/episodeProduction.ts", import.meta.url).pathname,
    activities,
    maxConcurrentActivityTaskExecutions: 2,
  });

  console.log("[worker] connected to Temporal", env.TEMPORAL_ADDRESS, "queue=vox-production");
  console.log("[worker] provider summary:", JSON.stringify(providerSummary(), null, 2));
  await worker.run();
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  runWorker().catch((e) => {
    console.error("[worker] fatal", e);
    process.exit(1);
  });
}
