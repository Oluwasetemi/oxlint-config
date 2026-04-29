import type { OxlintConfigItem } from "../typegen.js";

export const next: OxlintConfigItem[] = [
  {
    plugins: ["nextjs"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
  },
];
