import fs from "fs";
import path from "path";

// Load root .env BEFORE importing any modules
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

// Set runtime mode to real for this gate test
process.env["VOX_RUNTIME_MODE"] = "real";

async function runRealGate() {
  console.log("🚀 Starting P0-L.2 Real 3-Model Connectivity Gate...\n");
  console.log("Environment check:");
  console.log("  VOX_RUNTIME_MODE:", process.env["VOX_RUNTIME_MODE"]);
  console.log("  NVIDIA_MUSE_API_KEY set:", Boolean(process.env["NVIDIA_MUSE_API_KEY"]));
  console.log("  NVIDIA_GLM_API_KEY set:", Boolean(process.env["NVIDIA_GLM_API_KEY"]));
  console.log("  NVIDIA_QWEN_API_KEY set:", Boolean(process.env["NVIDIA_QWEN_API_KEY"]));
  console.log("");

  // Dynamically import @vox/ai AFTER env vars are in place
  const {
    NVIDIAAdapter,
    ProviderExecutionEngine,
  } = await import("../packages/ai/src/index");

  const engine = new ProviderExecutionEngine();

  // ─── Test 1: meta/muse-glimmer-30b (Text Generation) ──────────────────────
  console.log("--- 1. Testing meta/muse-glimmer-30b (Text Generation) ---");
  try {
    const res = await engine.executeJob({
      capability: "TEXT_GENERATION",
      prompt: "State the law of gravity in 1 concise sentence.",
      episodeId: "gate-ep-1",
      maxRetries: 1,
    });
    console.log("Success:", res.success);
    console.log("Selected Model:", res.selectedModelId);
    console.log("Provider:", res.selectedProviderId);
    console.log("Response text:", JSON.stringify(res.result?.text));
    console.log("Provenance ID:", res.provenance?.id);
    if (!res.success) {
      console.error("Error details:", res.error);
    }
  } catch (err: any) {
    console.error("Muse 30B Exception:", err.message);
  }

  // ─── Test 2: z-ai/glm-5.2 (Vision / Text Generation) ───────────────────────
  console.log("\n--- 2. Testing z-ai/glm-5.2 (Vision / Text Generation) ---");
  try {
    const adapter = new NVIDIAAdapter();
    const res = await adapter.generateText({
      prompt: "Say hello in 3 languages.",
      modelId: "z-ai/glm-5.2",
    });
    console.log("GLM-5.2 Success! Model:", res.model);
    console.log("Response text:", JSON.stringify(res.text));
    console.log("Tokens used:", res.tokensUsed);
  } catch (err: any) {
    console.error("GLM-5.2 Exception:", err.message);
  }

  // ─── Test 3: qwen/qwen-image-edit (Image Editing) ──────────────────────────
  console.log("\n--- 3. Testing qwen/qwen-image-edit (Image Editing) ---");
  try {
    const adapter = new NVIDIAAdapter();
    const res = await adapter.generateImage({
      prompt: "A high-tech control room interface, vibrant glowing futuristic HUD display",
      width: 1024,
      height: 1024,
      modelId: "qwen/qwen-image-edit",
    } as any);
    console.log("Qwen Image Edit Success!");
    console.log("Image URL:", res.imageUrl);
    console.log("Media Key:", res.mediaKey);
  } catch (err: any) {
    console.error("Qwen Image Edit Exception:", err.message);
  }
}

runRealGate();
