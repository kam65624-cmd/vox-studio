import type { Capability } from "@vox/contracts";
import { nvidiaGlamProvider, nvidiaMuseProvider } from "./llm/nvidia.js";
import { elevenLabsVoiceProvider } from "./voice/elevenlabs.js";
import { edgeTtsVoiceProvider } from "./voice/edge.js";
import { pollinationsImageProvider } from "./image/pollinations.js";
import { nvidiaImageProvider } from "./image/nvidia.js";
import { replicateImageProvider } from "./image/replicate.js";
import { replicateVideoProvider } from "./video/replicate.js";
import { nvidiaVideoProvider } from "./video/nvidia.js";
import { mockTextProvider, mockVoiceProvider, mockImageProvider, mockVideoProvider } from "./mock.js";
import type { ImageProvider, Provider, ProviderRegistry, TextProvider, VideoProvider, VoiceProvider } from "./types.js";

export class ModelRegistry implements ProviderRegistry {
  private texts: TextProvider[] = [];
  private voices: VoiceProvider[] = [];
  private images: ImageProvider[] = [];
  private videos: VideoProvider[] = [];

  register(p: Provider): void {
    switch (p.capability) {
      case "TEXT":
        this.texts.push(p as TextProvider);
        break;
      case "VOICE":
        this.voices.push(p as VoiceProvider);
        break;
      case "IMAGE":
        this.images.push(p as ImageProvider);
        break;
      case "VIDEO":
        this.videos.push(p as VideoProvider);
        break;
    }
  }

  text(): TextProvider[] {
    return [...this.texts];
  }
  voice(): VoiceProvider[] {
    return [...this.voices];
  }
  image(): ImageProvider[] {
    return [...this.images];
  }
  video(): VideoProvider[] {
    return [...this.videos];
  }

  byCapability(cap: Capability): Provider[] {
    switch (cap) {
      case "TEXT":
        return this.text();
      case "VOICE":
        return this.voice();
      case "IMAGE":
        return this.image();
      case "VIDEO":
        return this.video();
      default:
        return [];
    }
  }
}

function buildRealRegistry(): ModelRegistry {
  const reg = new ModelRegistry();
  reg.register(nvidiaGlamProvider);
  reg.register(nvidiaMuseProvider);
  reg.register(elevenLabsVoiceProvider);
  reg.register(edgeTtsVoiceProvider);
  reg.register(nvidiaImageProvider);
  reg.register(pollinationsImageProvider);
  reg.register(replicateImageProvider);
  reg.register(replicateVideoProvider);
  reg.register(nvidiaVideoProvider);
  return reg;
}

function buildMockRegistry(): ModelRegistry {
  const reg = new ModelRegistry();
  reg.register(mockTextProvider);
  reg.register(mockVoiceProvider);
  reg.register(mockImageProvider);
  reg.register(mockVideoProvider);
  return reg;
}

let realRegistry: ModelRegistry | undefined;
let mockRegistry: ModelRegistry | undefined;

export function getRegistry(mode: "real" | "mock" = "real"): ModelRegistry {
  if (mode === "mock") {
    mockRegistry ??= buildMockRegistry();
    return mockRegistry;
  }
  realRegistry ??= buildRealRegistry();
  return realRegistry;
}

export function textProviders(mode: "real" | "mock" = "real"): TextProvider[] {
  return getRegistry(mode).text();
}
export function voiceProviders(mode: "real" | "mock" = "real"): VoiceProvider[] {
  return getRegistry(mode).voice();
}
export function imageProviders(mode: "real" | "mock" = "real"): ImageProvider[] {
  return getRegistry(mode).image();
}
export function videoProviders(mode: "real" | "mock" = "real"): VideoProvider[] {
  return getRegistry(mode).video();
}
