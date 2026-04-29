import type { Oxfmtrc } from "oxfmt";

export interface OxfmtOptions {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: "all" | "es5" | "none";
  insertFinalNewline?: boolean;
  sortImports?: boolean;
  sortPackageJson?: boolean;
}

const defaults: Required<OxfmtOptions> = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  trailingComma: "all",
  insertFinalNewline: true,
  sortImports: false,
  sortPackageJson: true,
};

export function oxfmt(options: OxfmtOptions = {}): Oxfmtrc {
  return { ...defaults, ...options };
}
