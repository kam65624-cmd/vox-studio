import { describe, it, expect } from "vitest";
import {
  MockTextModelProvider,
  MockImageModelProvider,
  MockVideoModelProvider,
  MockVoiceModelProvider,
} from "./index";

describe("Mock AI Providers", () => {
  it("MockTextModelProvider returns valid response", async () => {
    const provider = new MockTextModelProvider();
    const res = await provider.generateText({ prompt: "Hello world" });
    expect(res.text).toContain("Hello world");
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it("MockImageModelProvider returns valid media key", async () => {
    const provider = new MockImageModelProvider();
    const res = await provider.generateImage({ prompt: "Prof. Tradeo", width: 1024, height: 1024 });
    expect(res.mediaKey).toBeDefined();
    expect(res.imageUrl).toContain("http");
  });

  it("MockVideoModelProvider returns requested duration", async () => {
    const provider = new MockVideoModelProvider();
    const res = await provider.generateVideo({ prompt: "VOX Explainer", durationSeconds: 10, aspectRatio: "16:9" });
    expect(res.durationSeconds).toBe(10);
  });

  it("MockVoiceModelProvider generates estimated duration", async () => {
    const provider = new MockVoiceModelProvider();
    const res = await provider.generateVoice({ text: "هذا هو التقرير الاقتصادي الخاص بأسواق المال اليوم.", voiceId: "tradeo-ar", language: "ar" });
    expect(res.durationSeconds).toBeGreaterThan(0);
  });
});
