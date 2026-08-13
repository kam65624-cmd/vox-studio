import { describe, expect, it } from "vitest";
import { extractJson, safeJson } from "./json.js";

describe("extractJson", () => {
  it("parses a plain JSON object", () => {
    const out = extractJson('{"a":1}') as Record<string, number>;
    expect(out.a).toBe(1);
  });

  it("parses JSON inside a markdown code fence", () => {
    const out = extractJson('```json\n{"lines":[{"speaker":"Host"}]}\n```') as { lines: { speaker: string }[] };
    expect(out.lines[0].speaker).toBe("Host");
  });

  it("extracts the first balanced object from surrounding prose", () => {
    const out = extractJson('Here is the result: {"episodeId":"ep_1","done":true} thanks!') as { episodeId: string };
    expect(out.episodeId).toBe("ep_1");
  });

  it("handles nested braces and strings with braces", () => {
    const out = extractJson('{"a":{"b":[1,2,{"c":"}"}]}}') as { a: { b: unknown[] } };
    expect(out.a.b.length).toBe(3);
  });

  it("returns null for garbage", () => {
    expect(extractJson("this is not json at all")).toBeNull();
  });
});

describe("safeJson", () => {
  it("round-trips plain values", () => {
    expect(safeJson({ x: [1, 2] })).toEqual({ x: [1, 2] });
  });

  it("returns null for circular references", () => {
    const c: Record<string, unknown> = {};
    c.self = c;
    expect(safeJson(c)).toBeNull();
  });
});
