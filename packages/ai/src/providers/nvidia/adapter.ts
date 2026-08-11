import { OpenAICompatibleAdapter } from "../openai-compatible/adapter";
import { getNVIDIAConfig } from "./config";
import { OpenAICompatibleConfig } from "../openai-compatible/types";

export class NVIDIAAdapter extends OpenAICompatibleAdapter {
  constructor(customConfig?: Partial<OpenAICompatibleConfig>) {
    const baseConfig = getNVIDIAConfig();
    super({
      ...baseConfig,
      ...customConfig,
    });
  }
}
