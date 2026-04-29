import { defineConfig } from "tsdown";
import ApiSnapshot from "tsnapi/rolldown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    oxfmt: "src/presets/oxfmt.ts",
    cli: "src/cli.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  hash: false,
  plugins: [
    ApiSnapshot({
      outputDir: "test/__snapshots__/api",
    }),
  ],
});
