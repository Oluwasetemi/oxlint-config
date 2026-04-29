import type { OxlintConfigItem } from "../typegen.js";

export const node: OxlintConfigItem[] = [
  {
    plugins: ["node"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
  },
];
