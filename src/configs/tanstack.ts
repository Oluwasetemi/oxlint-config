import type { OxlintConfigItem } from "../typegen.js";

// eslint plugin is required so oxlint resolves the rule namespace used by the tanstack router plugin
export const tanstack: OxlintConfigItem[] = [
  {
    plugins: ["eslint"],
    // string form resolves as an npm package specifier (not a file path)
    jsPlugins: ["@tanstack/eslint-plugin-router"],
    categories: {
      correctness: "error",
    },
  },
];
