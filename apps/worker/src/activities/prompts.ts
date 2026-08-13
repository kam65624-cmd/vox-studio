export function scriptPrompt(state: { topic: string; language: string; durationTargetSec: number; speakerCount: number }): { system: string; prompt: string } {
  const langLabel = state.language === "ar" ? "Arabic" : "English";
  const langInstruction =
    state.language === "ar"
      ? "Write ALL dialogue and text in Arabic (Modern Standard Arabic, MSA)."
      : "Write ALL dialogue and text in English.";
  return {
    system:
      `You are the Script Doctor and Head Writer of VOX Studio, a premium AI editorial podcast production system. ` +
      `You produce a tight, cinematic, conversational podcast script. ` +
      `Respond with ONLY valid JSON matching this exact shape (no markdown, no prose): ` +
      `{"title": string, "hook": string, "summary": string, "lines": [{"speaker": string, "text": string}, ...]}. ` +
      langInstruction +
      ` Keep every line short and spoken-language natural.`,
    prompt:
      `Produce a ${langLabel} podcast script about this topic: "${state.topic}".\n` +
      `Duration target: ${state.durationTargetSec} seconds. Speaker count: ${state.speakerCount}.\n` +
      `Write between 4 and 7 dialogue lines in total, alternating between the speakers naturally. ` +
      `Each line must be self-contained (no stage directions). Use distinct speaker names (e.g. Host, Guest). ` +
      `The opening line must be a strong hook. End with a clear closing line. ` +
      `Return only the JSON object.`,
  };
}

export function planPrompt(state: { script: string; language: string; sceneCount: number; shotCount: number }): { system: string; prompt: string } {
  const langNote = state.language === "ar" ? "Visual prompts must be written in English." : "Visual prompts in English.";
  return {
    system:
      `You are the AI Director of VOX Studio. You turn a podcast script into a structured production plan. ` +
      `Respond with ONLY valid JSON matching exactly: ` +
      `{"scenes": [{"type": string, "narrativePurpose": string, "dialogueLineIndices": number[], "shots": [{"description": string, "visualPrompt": string, "durationSec": number, "camera": string, "transitionIn": string}], "visualIntent": string}], "continuityRules": string[]}. ` +
      langNote +
      ` Visual style is a premium cinematic paper/collage editorial podcast world: felt puppet host, warm dark study set, paper texture, halftone, controlled teal/mustard/red accents.`,
    prompt:
      `Given this podcast script, create a production plan.\n\nSCRIPT:\n${state.script}\n\n` +
      `Create ${state.sceneCount} scenes and distribute the dialogue line indices (0-based) across them. ` +
      `Each scene has ${Math.max(1, Math.round(state.shotCount / state.sceneCount))} shots. ` +
      `Each shot's durationSec must be between 4 and 10. ` +
      `Each visualPrompt must be a detailed English cinematic image-generation prompt. ` +
      `Return only the JSON object.`,
  };
}
