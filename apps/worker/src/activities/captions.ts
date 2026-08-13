import { writeFileSync } from "node:fs";
import { loadState, saveState, advance, writeArtifactJson, syncDb, episodeDir } from "../state.js";
import { heartbeat } from "../util/heartbeat.js";
import { join } from "node:path";

export async function act06GenerateCaptions(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.script || !state.plan) throw new Error("captions require script and plan");
  advance(state, "captions", "Generating captions");
  await syncDb(state);

  // Compute line start times using the same deterministic layout as the timeline audio
  const lineStarts: Record<string, number> = {};
  const lineDurs: Record<string, number> = {};
  let cursor = 0;
  for (const scene of state.plan.scenes) {
    for (const lineIdx of scene.dialogueLineIndices) {
      lineStarts[`line_${lineIdx}`] = cursor;
      const d = state.lineDurations[`line_${lineIdx}`] ?? 2;
      lineDurs[`line_${lineIdx}`] = d;
      cursor += d + 0.4;
    }
  }

  const entries: { index: number; start: number; end: number; text: string }[] = [];
  for (let i = 0; i < state.script.lines.length; i++) {
    const line = state.script.lines[i];
    const start = lineStarts[`line_${i}`] ?? 0;
    const d = lineDurs[`line_${i}`] ?? 2;
    entries.push({ index: i + 1, start, end: start + d, text: line.text });
  }

  const srt = buildSrt(entries);
  const vtt = buildVtt(entries);

  const dir = episodeDir(episodeId);
  const srtPath = join(dir, "captions.srt");
  const vttPath = join(dir, "captions.vtt");
  writeFileSync(srtPath, srt, "utf8");
  writeFileSync(vttPath, vtt, "utf8");

  state.captions = { srt, vtt, path: srtPath };
  writeArtifactJson(episodeId, "captions.json", { entries, srt, vtt });
  saveState(state);
  await syncDb(state);
  heartbeat({ step: "captions-done", count: entries.length });
  return episodeId;
}

function fmtT(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}
function fmtTvtt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${String(ms).padStart(3, "0")}`;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildSrt(entries: { index: number; start: number; end: number; text: string }[]): string {
  return entries
    .map((e) => `${e.index}\n${fmtT(e.start)} --> ${fmtT(e.end)}\n${e.text}\n`)
    .join("\n");
}

function buildVtt(entries: { index: number; start: number; end: number; text: string }[]): string {
  const body = entries.map((e) => `${fmtTvtt(e.start)} --> ${fmtTvtt(e.end)}\n${e.text}`).join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}
