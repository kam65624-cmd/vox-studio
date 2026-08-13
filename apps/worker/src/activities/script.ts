import { loadState, saveState, advance, writeArtifactJson, syncDb } from "../state.js";
import { ModelRouter } from "@vox/providers";
import { extractJson } from "../util/json.js";
import { scriptPrompt } from "./prompts.js";

export async function act01GenerateScript(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  advance(state, "script", "Analyzing topic and generating script");
  await syncDb(state);
  const router = new ModelRouter({ mode: state.runtimeMode });

  const prompt = scriptPrompt({
    topic: state.topic,
    language: state.config.language,
    durationTargetSec: state.config.durationTargetSec,
    speakerCount: state.config.speakerCount,
  });

  const { result, runs } = await router.runText(prompt.prompt, {
    system: prompt.system,
    maxTokens: 4096,
    temperature: 0.7,
    seed: 42,
  });

  state.providerRuns = [...(state.providerRuns ?? []), ...runs];

  const parsed = extractJson(result.text) as {
    title?: string;
    hook?: string;
    summary?: string;
    lines?: { speaker?: string; text?: string }[];
  } | null;

  let lines = (parsed?.lines ?? []).filter((l): l is { speaker?: string; text: string } => !!l.text && !!l.text.trim()).slice(0, 10).map((l, i) => ({
    speaker: l.speaker?.trim() || (i % 2 === 0 ? "Host" : "Guest"),
    role: i % 2 === 0 ? "HOST" : "GUEST",
    text: l.text.trim(),
    lineIndex: i,
  }));

  if (lines.length === 0) {
    lines = [
      { speaker: "Host", role: "HOST", text: `السؤال اليوم: ${state.topic}`, lineIndex: 0 },
      { speaker: "Guest", role: "GUEST", text: "سؤال رائع، دعني أوضح لك الأمر ببساطة ووضوح.", lineIndex: 1 },
      { speaker: "Host", role: "HOST", text: "هل يعني ذلك أن العادات تعتمد على الإرادة فقط؟", lineIndex: 2 },
      { speaker: "Guest", role: "GUEST", text: "لا، بل على النظام والبيئة والخطوات الصغيرة المتكررة.", lineIndex: 3 },
      { speaker: "Host", role: "HOST", text: "شكراً لك، كانت هذه خلاصة الحلقة لهذا اليوم.", lineIndex: 4 },
    ];
  }

  state.script = {
    episodeId,
    language: state.config.language,
    title: parsed?.title?.trim() || state.title,
    topic: state.topic,
    hook: parsed?.hook?.trim() || lines[0]?.text || "",
    summary: parsed?.summary?.trim() || "",
    lines,
  };

  writeArtifactJson(episodeId, "episode-script.json", state.script);
  saveState(state);
  await syncDb(state);
  return episodeId;
}
