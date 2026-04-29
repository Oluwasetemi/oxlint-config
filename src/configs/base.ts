import type { OxlintConfigItem } from "../typegen.js";

export const base: OxlintConfigItem[] = [
  {
    plugins: ["eslint", "oxc"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
  },
];
