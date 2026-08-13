export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // try to find the first balanced JSON object
    const start = candidate.indexOf("{");
    if (start >= 0) {
      let depth = 0;
      let inString = false;
      let esc = false;
      for (let i = start; i < candidate.length; i++) {
        const ch = candidate[i];
        if (inString) {
          if (esc) esc = false;
          else if (ch === "\\") esc = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') inString = true;
        else if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            const slice = candidate.slice(start, i + 1);
            try {
              return JSON.parse(slice);
            } catch {
              return null;
            }
          }
        }
      }
    }
  }
  return null;
}

export function safeJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
