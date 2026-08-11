import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@vox/contracts": path.resolve(__dirname, "../../packages/contracts/src/index.ts"),
      "@vox/domain": path.resolve(__dirname, "../../packages/domain/src/index.ts"),
      "@vox/ai": path.resolve(__dirname, "../../packages/ai/src/index.ts"),
      "@vox/media": path.resolve(__dirname, "../../packages/media/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    css: {
      postcss: false,
    },
  },
});
