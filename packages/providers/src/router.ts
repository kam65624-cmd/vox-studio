import type { Capability, ProviderRun, RuntimeMode } from "@vox/contracts";
import { env } from "@vox/config";
import { getRegistry } from "./registry.js";
import type { ImageProvider, Provider, TextProvider, VideoProvider, VoiceProvider } from "./types.js";

export interface RouterOptions {
  mode?: RuntimeMode;
  providerOrder?: Partial<Record<Capability, string[]>>;
}

export class ModelRouter {
  readonly mode: RuntimeMode;
  private preferred: Partial<Record<Capability, string[]>>;

  constructor(opts: RouterOptions = {}) {
    this.mode = opts.mode ?? env.VOX_RUNTIME_MODE;
    this.preferred = opts.providerOrder ?? {
      TEXT: ["nvidia-nim"],
      VOICE: ["elevenlabs", "edge-tts"],
      IMAGE: ["nvidia-nim-image", "pollinations", "replicate"],
      VIDEO: ["replicate-video", "nvidia-nim-video"],
    };
  }

  private realOrThrow(): boolean {
    if (this.mode === "mock") return false;
    if (this.mode === "real") return true;
    // auto: real if at least one real provider configured for the capability, else mock
    return true;
  }

  isRealMode(): boolean {
    return this.mode !== "mock";
  }

  select(cap: Capability): Provider[] {
    if (this.mode === "mock") {
      return getRegistry("mock").byCapability(cap);
    }
    const reg = getRegistry("real");
    const order = this.preferred[cap] ?? [];
    const all = reg.byCapability(cap).filter((p) => !p.isMock);
    const byName = new Map(all.map((p) => [p.name, p]));
    const ordered: Provider[] = [];
    for (const name of order) {
      const p = byName.get(name);
      if (p && !ordered.includes(p)) ordered.push(p);
    }
    for (const p of all) if (!ordered.includes(p)) ordered.push(p);
    return ordered;
  }

  async runText(
    prompt: string,
    opts: { system?: string; maxTokens?: number; temperature?: number; seed?: number } = {},
  ): Promise<{ result: { text: string; requestId: string; provider: string; model: string }; runs: ProviderRun[] }> {
    const providers = this.select("TEXT") as TextProvider[];
    const runs: ProviderRun[] = [];
    let lastErr: Error | undefined;
    for (const p of providers) {
      const run = newRun("TEXT", p);
      runs.push(run);
      if (!p.isConfigured()) {
        run.status = "blocked";
        run.error = p.configurationError();
        lastErr = new Error(run.error);
        continue;
      }
      try {
        const res = await p.generate({
          prompt,
          system: opts.system,
          maxTokens: opts.maxTokens,
          temperature: opts.temperature,
          seed: opts.seed,
        });
        run.status = "succeeded";
        run.requestId = res.requestId;
        run.responseSummary = { chars: res.text.length, usage: res.usage };
        return { result: { text: res.text, requestId: res.requestId, provider: p.name, model: res.model }, runs };
      } catch (e) {
        run.status = "failed";
        run.error = (e as Error).message;
        lastErr = e as Error;
      }
    }
    throw new RouterGateError(`TEXT generation blocked: no real provider available. ${lastErr?.message ?? ""}`, runs);
  }

  async runVoice(
    text: string,
    language: string,
    voiceName?: string,
  ): Promise<{ result: { binary: Buffer; mimeType: string; requestId: string; provider: string; model: string; sizeBytes: number }; runs: ProviderRun[] }> {
    const providers = this.select("VOICE") as VoiceProvider[];
    const runs: ProviderRun[] = [];
    let lastErr: Error | undefined;
    for (const p of providers) {
      const run = newRun("VOICE", p);
      runs.push(run);
      if (!p.isConfigured()) {
        run.status = "blocked";
        run.error = p.configurationError();
        lastErr = new Error(run.error);
        continue;
      }
      try {
        const res = await p.synthesize({ text, language, voiceName });
        run.status = "succeeded";
        run.requestId = res.requestId;
        run.sizeBytes = res.sizeBytes;
        return {
          result: { binary: res.binary, mimeType: res.mimeType, requestId: res.requestId, provider: p.name, model: res.model, sizeBytes: res.sizeBytes },
          runs,
        };
      } catch (e) {
        run.status = "failed";
        run.error = (e as Error).message;
        lastErr = e as Error;
      }
    }
    throw new RouterGateError(`VOICE generation blocked: no real provider available. ${lastErr?.message ?? ""}`, runs);
  }

  async runImage(
    prompt: string,
    opts: { width?: number; height?: number; seed?: number } = {},
  ): Promise<{ result: { binary: Buffer; mimeType: string; requestId: string; provider: string; model: string; sizeBytes: number }; runs: ProviderRun[] }> {
    const providers = this.select("IMAGE") as ImageProvider[];
    const runs: ProviderRun[] = [];
    let lastErr: Error | undefined;
    for (const p of providers) {
      const run = newRun("IMAGE", p);
      runs.push(run);
      if (!p.isConfigured()) {
        run.status = "blocked";
        run.error = p.configurationError();
        lastErr = new Error(run.error);
        continue;
      }
      try {
        const res = await p.generate({ prompt, width: opts.width, height: opts.height, seed: opts.seed });
        run.status = "succeeded";
        run.requestId = res.requestId;
        run.sizeBytes = res.sizeBytes;
        return {
          result: { binary: res.binary, mimeType: res.mimeType, requestId: res.requestId, provider: p.name, model: res.model, sizeBytes: res.sizeBytes },
          runs,
        };
      } catch (e) {
        run.status = "failed";
        run.error = (e as Error).message;
        lastErr = e as Error;
      }
    }
    throw new RouterGateError(`IMAGE generation blocked: no real provider available. ${lastErr?.message ?? ""}`, runs);
  }

  async runVideo(
    prompt: string,
  ): Promise<{ result: { binary: Buffer; mimeType: string; requestId: string; provider: string; model: string; sizeBytes: number }; runs: ProviderRun[] }> {
    const providers = this.select("VIDEO") as VideoProvider[];
    const runs: ProviderRun[] = [];
    let lastErr: Error | undefined;
    for (const p of providers) {
      const run = newRun("VIDEO", p);
      runs.push(run);
      if (!p.isConfigured()) {
        run.status = "blocked";
        run.error = p.configurationError();
        lastErr = new Error(run.error);
        continue;
      }
      try {
        const res = await p.generate({ prompt });
        run.status = "succeeded";
        run.requestId = res.requestId;
        run.sizeBytes = res.sizeBytes;
        return {
          result: { binary: res.binary, mimeType: res.mimeType, requestId: res.requestId, provider: p.name, model: res.model, sizeBytes: res.sizeBytes },
          runs,
        };
      } catch (e) {
        run.status = "failed";
        run.error = (e as Error).message;
        lastErr = e as Error;
      }
    }
    throw new RouterGateError(`VIDEO generation blocked: no real provider available. ${lastErr?.message ?? ""}`, runs);
  }

  realProviderSummary(): Record<string, string[]> {
    const caps: Capability[] = ["TEXT", "VOICE", "IMAGE", "VIDEO"];
    const out: Record<string, string[]> = {};
    for (const c of caps) {
      out[c] = this.select(c).map((p) => {
        const conf = p.isConfigured() ? "configured" : "blocked";
        return `${p.name}:${p.model}:${conf}`;
      });
    }
    return out;
  }
}

export class RouterGateError extends Error {
  readonly runs: ProviderRun[];
  constructor(message: string, runs: ProviderRun[]) {
    super(message);
    this.runs = runs;
  }
}

function newRun(capability: Capability, provider: Provider): ProviderRun {
  return {
    id: `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    capability,
    provider: provider.name,
    model: provider.model,
    status: "running",
    startedAt: new Date().toISOString(),
  };
}

export const router = new ModelRouter();
