import { isPackageExists } from "local-pkg";
import { base } from "./configs/base.js";
import { typescript } from "./configs/typescript.js";
import { react } from "./configs/react.js";
import { node } from "./configs/node.js";
import { testing } from "./configs/testing.js";
import { next } from "./configs/next.js";
import { tanstack } from "./configs/tanstack.js";
import type { OxlintConfigItem } from "./typegen.js";

// TanStack router packages signal a React project — react rules apply to these apps.
// tanstackRouter option remains opt-in because it requires the optional peer dep @tanstack/eslint-plugin-router.
const ReactPackages = ["react", "react-dom", "@tanstack/react-router", "@tanstack/start"] as const;

export interface SetemiOjoOptions {
  typescript?: boolean;
  react?: boolean;
  tanstackRouter?: boolean;
  next?: boolean;
  node?: boolean;
  testing?: boolean;
}

export function setemiojo(options: SetemiOjoOptions = {}): OxlintConfigItem {
  const {
    typescript: enableTypescript = isPackageExists("typescript"),
    react: enableReact = ReactPackages.some((pkg) => isPackageExists(pkg)),
    tanstackRouter = false,
    next: enableNext = false,
    node: enableNode = false,
    testing: enableTesting = false,
  } = options;

  const configs: OxlintConfigItem[] = [...base];

  if (enableTypescript) configs.push(...typescript);
  if (enableReact) configs.push(...react);
  if (enableNode) configs.push(...node);
  if (enableTesting) configs.push(...testing);
  if (enableNext) configs.push(...next);
  if (tanstackRouter) configs.push(...tanstack);

  return { extends: configs };
}
