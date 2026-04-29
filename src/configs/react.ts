import type { OxlintConfigItem } from "../typegen.js";

export const react: OxlintConfigItem[] = [
  {
    plugins: ["react", "react-perf", "jsx-a11y"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
  },
];
