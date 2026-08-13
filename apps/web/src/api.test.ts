import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { api } from "./api.js";

describe("web api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an episode with the expected request shape", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "ep_1", title: "Habits" }), { status: 201, headers: { "Content-Type": "application/json" } }),
    );

    await api.createEpisode("prj_1", {
      title: "Habits",
      config: {
        topic: "habits",
        language: "ar",
        durationTargetSec: 45,
        speakerCount: 2,
        sceneCount: 2,
        shotCount: 4,
        style: "premium-cinematic",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(url).toBe("/api/projects/prj_1/episodes");
    expect(init?.method).toBe("POST");
    expect(body.config.language).toBe("ar");
    expect(body.config.durationTargetSec).toBe(45);
  });

  it("starts production in real mode", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "p_1", status: "PRODUCING", runtimeMode: "real" }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    await api.startProduction("ep_1", "real");
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ runtimeMode: "real" });
  });

  it("propagates API errors with status text", async () => {
    fetchMock.mockResolvedValue(new Response("video not ready", { status: 404 }));
    await expect(api.episodeState("ep_missing")).rejects.toThrow("404");
  });
});
