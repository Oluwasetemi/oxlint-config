import type { OxlintConfigItem } from "../typegen.js";

export const typescript: OxlintConfigItem[] = [
  {
    plugins: ["typescript", "unicorn"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
  },
];
