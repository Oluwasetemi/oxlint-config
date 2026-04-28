# @setemiojo/oxc-config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `@setemiojo/oxc-config` — a composable oxlint/oxfmt config package with auto-detecting factory, typed presets, and a `@clack/prompts` init CLI.

**Architecture:** Seven tiered oxlint config presets (each an array of flat config objects) are composed by the `setemiojo()` factory, which auto-detects dependencies via `local-pkg`. A separate `oxfmt()` preset merges user overrides onto opinionated defaults. A `@clack/prompts` CLI writes config files and package.json scripts at project init time.

**Tech Stack:** TypeScript 5, tsdown (Rolldown-based bundler with `--dts`), vitest snapshots, pnpm, @clack/prompts, local-pkg, bumpp, GitHub Actions Trusted Publishing (OIDC).

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Package metadata, exports map (`./` + `./oxfmt`), bin, scripts, deps |
| `tsconfig.json` | Strict TS, NodeNext module resolution |
| `tsdown.config.ts` | Build entry points: index, oxfmt, cli |
| `src/typegen.d.ts` | Extracts `OxlintConfigItem` type from oxlint's `defineConfig` signature |
| `scripts/typegen.ts` | Script that generates `src/typegen.d.ts` |
| `src/configs/base.ts` | eslint + oxc plugins, correctness + suspicious categories |
| `src/configs/typescript.ts` | typescript + unicorn plugins |
| `src/configs/react.ts` | react + react-perf + jsx-a11y plugins |
| `src/configs/node.ts` | node plugin |
| `src/configs/testing.ts` | vitest plugin, correctness only |
| `src/configs/next.ts` | nextjs plugin |
| `src/configs/tanstack.ts` | eslint plugin + jsPlugins: @tanstack/eslint-plugin-router |
| `src/presets/oxfmt.ts` | `oxfmt()` merges user overrides onto opinionated defaults |
| `src/factory.ts` | `setemiojo()` — auto-detects deps via local-pkg, composes presets |
| `src/index.ts` | Public re-exports: all presets + factory + types |
| `bin/index.mjs` | `#!/usr/bin/env node` CLI shim → `import('../dist/cli.js')` |
| `src/cli.ts` | Full @clack/prompts init wizard |
| `test/factory-snap.test.ts` | Vitest snapshot tests for 5 preset combos |
| `.github/workflows/ci.yml` | pnpm install → build → typecheck → test on push/PR |
| `.github/workflows/release.yml` | bumpp tag → npm Trusted Publishing via OIDC |
| `.gitignore` | node_modules, dist |
| `.npmrc` | `shamefully-hoist=false`, `strict-peer-dependencies=false` |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsdown.config.ts`
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Initialize git repo and write package.json**

```bash
cd /Users/oluwasetemi/r/oxc-config
git init
```

Create `package.json`:

```json
{
  "name": "@setemiojo/oxc-config",
  "version": "0.1.0",
  "description": "Shareable OXC toolchain config for oxlint and oxfmt",
  "type": "module",
  "license": "MIT",
  "author": "Oluwasetemi Ojo <setemiojo@gmail.com>",
  "homepage": "https://github.com/Oluwasetemi/oxc-config",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Oluwasetemi/oxc-config.git"
  },
  "publishConfig": {
    "access": "public"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./oxfmt": {
      "types": "./dist/oxfmt.d.ts",
      "default": "./dist/oxfmt.js"
    }
  },
  "bin": {
    "oxc-config": "./bin/index.mjs"
  },
  "files": [
    "dist",
    "bin"
  ],
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "typegen": "tsx scripts/typegen.ts",
    "bump": "bumpp",
    "prepublishOnly": "pnpm run build"
  },
  "dependencies": {
    "@clack/prompts": "^0.9.1",
    "local-pkg": "^0.5.1"
  },
  "peerDependencies": {
    "oxlint": ">=0.17.0",
    "@tanstack/eslint-plugin-router": "*",
    "oxfmt": "*"
  },
  "peerDependenciesMeta": {
    "@tanstack/eslint-plugin-router": {
      "optional": true
    },
    "oxfmt": {
      "optional": true
    }
  },
  "devDependencies": {
    "@clack/prompts": "^0.9.1",
    "bumpp": "^10.0.0",
    "local-pkg": "^0.5.1",
    "oxlint": "^0.17.0",
    "tsdown": "^0.12.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src", "scripts"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Write tsdown.config.ts**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    oxfmt: 'src/presets/oxfmt.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
})
```

- [ ] **Step 4: Write .gitignore and .npmrc**

`.gitignore`:
```
node_modules
dist
*.log
.DS_Store
```

`.npmrc`:
```
shamefully-hoist=false
strict-peer-dependencies=false
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json tsdown.config.ts .gitignore .npmrc
git commit -m "chore: project scaffolding — package.json, tsconfig, tsdown, pnpm"
```

---

## Task 2: Type Generation

**Files:**
- Create: `scripts/typegen.ts`
- Create: `src/typegen.d.ts`

- [ ] **Step 1: Write the typegen script**

Create `scripts/typegen.ts`:

```ts
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const content = `// Generated by scripts/typegen.ts — do not edit manually
import type { defineConfig } from 'oxlint'

type _DefineConfigArg = Parameters<typeof defineConfig>[0]

/**
 * A single item in an oxlint flat config array.
 * Extracted from oxlint's defineConfig signature so config files
 * don't each import directly from oxlint.
 */
export type OxlintConfigItem = _DefineConfigArg extends (infer T)[]
  ? T
  : _DefineConfigArg
`

writeFileSync(path.join(__dirname, '../src/typegen.d.ts'), content)
console.log('Generated src/typegen.d.ts')
```

- [ ] **Step 2: Create src/ directory and run typegen**

```bash
mkdir -p src/configs src/presets
pnpm typegen
```

Expected: `src/typegen.d.ts` is created with exported `OxlintConfigItem` type.

- [ ] **Step 3: Verify the generated file looks correct**

```bash
cat src/typegen.d.ts
```

Expected output:
```
// Generated by scripts/typegen.ts — do not edit manually
import type { defineConfig } from 'oxlint'
...
export type OxlintConfigItem = ...
```

- [ ] **Step 4: Commit**

```bash
git add scripts/typegen.ts src/typegen.d.ts
git commit -m "feat: typegen script extracts OxlintConfigItem from oxlint"
```

---

## Task 3: Config Presets

**Files:**
- Create: `src/configs/base.ts`
- Create: `src/configs/typescript.ts`
- Create: `src/configs/react.ts`
- Create: `src/configs/node.ts`
- Create: `src/configs/testing.ts`
- Create: `src/configs/next.ts`
- Create: `src/configs/tanstack.ts`

- [ ] **Step 1: Write base.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const base: OxlintConfigItem[] = [
  {
    name: 'setemiojo/base',
    plugins: ['eslint', 'oxc'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
  },
]
```

- [ ] **Step 2: Write typescript.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const typescript: OxlintConfigItem[] = [
  {
    name: 'setemiojo/typescript',
    plugins: ['typescript', 'unicorn'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
  },
]
```

- [ ] **Step 3: Write react.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const react: OxlintConfigItem[] = [
  {
    name: 'setemiojo/react',
    plugins: ['react', 'react-perf', 'jsx-a11y'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
  },
]
```

- [ ] **Step 4: Write node.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const node: OxlintConfigItem[] = [
  {
    name: 'setemiojo/node',
    plugins: ['node'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
  },
]
```

- [ ] **Step 5: Write testing.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const testing: OxlintConfigItem[] = [
  {
    name: 'setemiojo/testing',
    plugins: ['vitest'],
    categories: {
      correctness: 'error',
    },
  },
]
```

- [ ] **Step 6: Write next.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const next: OxlintConfigItem[] = [
  {
    name: 'setemiojo/next',
    plugins: ['nextjs'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
  },
]
```

- [ ] **Step 7: Write tanstack.ts**

```ts
import type { OxlintConfigItem } from '../typegen.js'

export const tanstack: OxlintConfigItem[] = [
  {
    name: 'setemiojo/tanstack',
    plugins: ['eslint'],
    jsPlugins: ['@tanstack/eslint-plugin-router'],
    categories: {
      correctness: 'error',
    },
  },
]
```

- [ ] **Step 8: Run typecheck to verify all presets type-check**

```bash
pnpm typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/configs/
git commit -m "feat: add seven tiered oxlint config presets (base through tanstack)"
```

---

## Task 4: oxfmt Preset

**Files:**
- Create: `src/presets/oxfmt.ts`

- [ ] **Step 1: Write oxfmt.ts**

```ts
export interface OxfmtOptions {
  printWidth?: number
  tabWidth?: number
  useTabs?: boolean
  semi?: boolean
  singleQuote?: boolean
  trailingComma?: 'all' | 'es5' | 'none'
  insertFinalNewline?: boolean
  sortImports?: boolean
  sortPackageJson?: boolean
}

const defaults: Required<OxfmtOptions> = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  insertFinalNewline: true,
  sortImports: false,
  sortPackageJson: true,
}

export function oxfmt(options: OxfmtOptions = {}): Required<OxfmtOptions> {
  return { ...defaults, ...options }
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/presets/oxfmt.ts
git commit -m "feat: add oxfmt() preset with opinionated defaults and user overrides"
```

---

## Task 5: Factory Function

**Files:**
- Create: `src/factory.ts`

- [ ] **Step 1: Write factory.ts**

```ts
import { isPackageExists } from 'local-pkg'
import { base } from './configs/base.js'
import { typescript } from './configs/typescript.js'
import { react } from './configs/react.js'
import { node } from './configs/node.js'
import { testing } from './configs/testing.js'
import { next } from './configs/next.js'
import { tanstack } from './configs/tanstack.js'
import type { OxlintConfigItem } from './typegen.js'

const ReactPackages = ['react', 'react-dom', '@tanstack/react-router', '@tanstack/start'] as const

export interface SetemiOjoOptions {
  typescript?: boolean
  react?: boolean
  tanstackRouter?: boolean
  next?: boolean
  node?: boolean
  testing?: boolean
}

export function setemiojo(options: SetemiOjoOptions = {}): OxlintConfigItem[] {
  const {
    typescript: enableTypescript = isPackageExists('typescript'),
    react: enableReact = ReactPackages.some(pkg => isPackageExists(pkg)),
    tanstackRouter = false,
    next: enableNext = false,
    node: enableNode = false,
    testing: enableTesting = false,
  } = options

  const configs: OxlintConfigItem[] = [...base]

  if (enableTypescript) configs.push(...typescript)
  if (enableReact) configs.push(...react)
  if (enableNode) configs.push(...node)
  if (enableTesting) configs.push(...testing)
  if (enableNext) configs.push(...next)
  if (tanstackRouter) configs.push(...tanstack)

  return configs
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/factory.ts
git commit -m "feat: setemiojo() factory auto-detects typescript/react via local-pkg"
```

---

## Task 6: Public Exports + Build Verification

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Write index.ts**

```ts
export { base } from './configs/base.js'
export { typescript } from './configs/typescript.js'
export { react } from './configs/react.js'
export { node } from './configs/node.js'
export { testing } from './configs/testing.js'
export { next } from './configs/next.js'
export { tanstack } from './configs/tanstack.js'
export { setemiojo } from './factory.js'
export type { SetemiOjoOptions } from './factory.js'
export type { OxlintConfigItem } from './typegen.js'
```

- [ ] **Step 2: Run build**

```bash
pnpm build
```

Expected: `dist/` created with `index.js`, `index.d.ts`, `oxfmt.js`, `oxfmt.d.ts`.

- [ ] **Step 3: Verify dist structure**

```bash
ls dist/
```

Expected: `index.js  index.d.ts  oxfmt.js  oxfmt.d.ts` (and sourcemaps)

- [ ] **Step 4: Commit**

```bash
git add src/index.ts dist/
git commit -m "feat: public exports and verified build output"
```

---

## Task 7: Snapshot Tests

**Files:**
- Create: `test/factory-snap.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `test/factory-snap.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { setemiojo } from '../src/factory.js'

describe('setemiojo factory snapshots', () => {
  it('base only', () => {
    expect(
      setemiojo({ typescript: false, react: false }),
    ).toMatchSnapshot()
  })

  it('base + typescript', () => {
    expect(
      setemiojo({ typescript: true, react: false }),
    ).toMatchSnapshot()
  })

  it('base + typescript + react', () => {
    expect(
      setemiojo({ typescript: true, react: true }),
    ).toMatchSnapshot()
  })

  it('base + typescript + react + tanstack', () => {
    expect(
      setemiojo({ typescript: true, react: true, tanstackRouter: true }),
    ).toMatchSnapshot()
  })

  it('full preset', () => {
    expect(
      setemiojo({
        typescript: true,
        react: true,
        tanstackRouter: true,
        next: true,
        node: true,
        testing: true,
      }),
    ).toMatchSnapshot()
  })
})
```

- [ ] **Step 2: Run tests to create initial snapshots**

```bash
pnpm test:run
```

Expected: 5 tests pass and `test/__snapshots__/factory-snap.test.ts.snap` is created.

- [ ] **Step 3: Inspect snapshots to verify correctness**

```bash
cat test/__snapshots__/factory-snap.test.ts.snap
```

Verify each snapshot:
- `base only` → 1 item with `name: 'setemiojo/base'`, `plugins: ['eslint', 'oxc']`
- `base + typescript` → 2 items, second has `name: 'setemiojo/typescript'`, `plugins: ['typescript', 'unicorn']`
- `base + typescript + react` → 3 items, third has `name: 'setemiojo/react'`, `plugins: ['react', 'react-perf', 'jsx-a11y']`
- `base + typescript + react + tanstack` → 4 items, fourth has `name: 'setemiojo/tanstack'`, `jsPlugins: ['@tanstack/eslint-plugin-router']`
- `full preset` → 7 items total

- [ ] **Step 4: Commit**

```bash
git add test/
git commit -m "test: snapshot tests for all five setemiojo() preset combos"
```

---

## Task 8: CLI Implementation

**Files:**
- Create: `src/cli.ts`
- Create: `bin/index.mjs`

- [ ] **Step 1: Create bin directory and shim**

```bash
mkdir -p bin
```

Create `bin/index.mjs`:

```js
#!/usr/bin/env node
import('../dist/cli.js').then(({ run }) => run())
```

Make it executable:

```bash
chmod +x bin/index.mjs
```

- [ ] **Step 2: Write src/cli.ts**

```ts
import * as p from '@clack/prompts'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isPackageExists } from 'local-pkg'

function getNodeVersion(): [number, number] {
  const [major, minor] = process.version.slice(1).split('.').map(Number) as [number, number]
  return [major, minor]
}

function supportsOxfmtConfigTs(): boolean {
  const [major, minor] = getNodeVersion()
  return major > 22 || (major === 22 && minor >= 18)
}

function detectPresets(): string[] {
  const detected: string[] = ['base']
  if (isPackageExists('typescript')) detected.push('typescript')
  if (['react', 'react-dom', '@tanstack/react-router', '@tanstack/start'].some(p => isPackageExists(p)))
    detected.push('react')
  return detected
}

async function confirmOverwrite(file: string): Promise<boolean> {
  if (!existsSync(file)) return true
  const ok = await p.confirm({ message: `${file} already exists. Overwrite?` })
  if (p.isCancel(ok)) { p.cancel('Cancelled'); process.exit(0) }
  return ok as boolean
}

function writeOxlintConfig(presets: string[]): void {
  const presetArgs = presets.map(name => `${name}: true`).join(', ')
  const content = `import { setemiojo } from '@setemiojo/oxc-config'
import { defineConfig } from 'oxlint'

export default defineConfig(setemiojo({ ${presetArgs} }))
`
  writeFileSync('oxlint.config.ts', content)
}

function writeOxfmtConfigTs(): void {
  const content = `import { oxfmt } from '@setemiojo/oxc-config/oxfmt'
export default oxfmt()
`
  writeFileSync('oxfmt.config.ts', content)
}

function writeOxfmtRcJson(): void {
  const { oxfmt } = await import('./presets/oxfmt.js')
  writeFileSync('.oxfmtrc.json', JSON.stringify(oxfmt(), null, 2) + '\n')
}

function addScripts(): void {
  if (!existsSync('package.json')) return
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  pkg.scripts ??= {}
  pkg.scripts['lint:ox'] = 'oxlint .'
  pkg.scripts['format:ox'] = 'oxfmt .'
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
}

export async function run(): Promise<void> {
  p.intro('@setemiojo/oxc-config')

  const tool = await p.select({
    message: 'What would you like to set up?',
    options: [
      { value: 'both', label: 'both (recommended)' },
      { value: 'oxlint', label: 'oxlint only' },
      { value: 'oxfmt', label: 'oxfmt only' },
    ],
    initialValue: 'both',
  })
  if (p.isCancel(tool)) { p.cancel('Cancelled'); process.exit(0) }

  const setupOxlint = tool === 'both' || tool === 'oxlint'
  const setupOxfmt = tool === 'both' || tool === 'oxfmt'

  let selectedPresets: string[] = []
  if (setupOxlint) {
    const detectedPresets = detectPresets()
    const presetResult = await p.multiselect({
      message: 'Which presets?',
      options: [
        { value: 'base', label: 'base' },
        { value: 'typescript', label: 'typescript' },
        { value: 'react', label: 'react' },
        { value: 'node', label: 'node' },
        { value: 'testing', label: 'testing' },
        { value: 'next', label: 'next' },
        { value: 'tanstack', label: 'tanstack' },
      ],
      initialValues: detectedPresets,
    })
    if (p.isCancel(presetResult)) { p.cancel('Cancelled'); process.exit(0) }
    selectedPresets = presetResult as string[]
  }

  let useConfigTs = false
  if (setupOxfmt) {
    const nodeSupports = supportsOxfmtConfigTs()
    const oxfmtFormat = await p.select({
      message: 'Use oxfmt.config.ts? (requires Node ≥ 22.18)',
      options: [
        { value: 'ts', label: 'yes, oxfmt.config.ts' },
        { value: 'json', label: 'no, write .oxfmtrc.json instead' },
      ],
      initialValue: nodeSupports ? 'ts' : 'json',
    })
    if (p.isCancel(oxfmtFormat)) { p.cancel('Cancelled'); process.exit(0) }
    useConfigTs = oxfmtFormat === 'ts'
    if (useConfigTs && !nodeSupports) {
      p.log.warn('oxfmt.config.ts requires Node ≥ 22.18. Current: ' + process.version)
    }
  }

  const addScriptsResult = await p.confirm({ message: 'Add scripts to package.json?' })
  if (p.isCancel(addScriptsResult)) { p.cancel('Cancelled'); process.exit(0) }

  if (setupOxlint && (await confirmOverwrite('oxlint.config.ts'))) {
    writeOxlintConfig(selectedPresets)
  }

  if (setupOxfmt) {
    if (useConfigTs && (await confirmOverwrite('oxfmt.config.ts'))) {
      writeOxfmtConfigTs()
    } else if (!useConfigTs && (await confirmOverwrite('.oxfmtrc.json'))) {
      await writeOxfmtRcJson()
    }
  }

  if (addScriptsResult) addScripts()

  p.outro('Done!')
}
```

- [ ] **Step 3: Fix the async import in writeOxfmtRcJson (it can't be async at top level — move the import)**

The `writeOxfmtRcJson` function above has a bug: `await import` inside a non-async function. Fix by making it async and awaiting at the call site. Replace `writeOxfmtRcJson` definition and its call site:

```ts
async function writeOxfmtRcJson(): Promise<void> {
  const { oxfmt } = await import('./presets/oxfmt.js')
  writeFileSync('.oxfmtrc.json', JSON.stringify(oxfmt(), null, 2) + '\n')
}
```

And at the call site in `run()`:
```ts
  if (setupOxfmt) {
    if (useConfigTs && (await confirmOverwrite('oxfmt.config.ts'))) {
      writeOxfmtConfigTs()
    } else if (!useConfigTs && (await confirmOverwrite('.oxfmtrc.json'))) {
      await writeOxfmtRcJson()
    }
  }
```

- [ ] **Step 4: Run typecheck and build**

```bash
pnpm typecheck && pnpm build
```

Expected: No TypeScript errors, `dist/cli.js` and `dist/cli.d.ts` generated.

- [ ] **Step 5: Smoke-test the CLI against dist**

```bash
node bin/index.mjs --help 2>&1 || node bin/index.mjs
```

Expected: `@setemiojo/oxc-config` intro prompt appears (or graceful exit if not in TTY).

- [ ] **Step 6: Commit**

```bash
git add src/cli.ts bin/index.mjs
git commit -m "feat: @clack/prompts init CLI writes oxlint.config.ts / .oxfmtrc.json"
```

---

## Task 9: GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Write ci.yml**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm typecheck

      - run: pnpm test:run
```

- [ ] **Step 2: Write release.yml**

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: GitHub Actions for CI validation and npm Trusted Publishing"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Full clean build + typecheck + tests**

```bash
pnpm build && pnpm typecheck && pnpm test:run
```

Expected: Build succeeds, 0 TypeScript errors, 5 snapshot tests pass.

- [ ] **Step 2: Verify exports map is correct**

```bash
node -e "import('@setemiojo/oxc-config').then(m => console.log(Object.keys(m)))" 2>/dev/null || \
node --input-type=module <<'EOF'
import { setemiojo, base, typescript, react, node, testing, next, tanstack } from './dist/index.js'
console.log('setemiojo:', typeof setemiojo)
console.log('base length:', base.length)
const result = setemiojo({ typescript: true, react: false })
console.log('factory result length:', result.length)
console.log('config names:', result.map(c => c.name))
EOF
```

Expected:
```
setemiojo: function
base length: 1
factory result length: 2
config names: [ 'setemiojo/base', 'setemiojo/typescript' ]
```

- [ ] **Step 3: Verify oxfmt export works**

```bash
node --input-type=module <<'EOF'
import { oxfmt } from './dist/oxfmt.js'
const result = oxfmt({ singleQuote: false, printWidth: 80 })
console.log(JSON.stringify(result, null, 2))
EOF
```

Expected: JSON object with `printWidth: 80`, `singleQuote: false`, all other defaults intact.

- [ ] **Step 4: Commit final verification**

```bash
git add -A
git commit -m "chore: all tasks complete — build, types, tests, CLI, CI all verified"
```

---

## Post-Shipping Checklist

- [ ] Push to GitHub: `git remote add origin https://github.com/Oluwasetemi/oxc-config.git && git push -u origin main`
- [ ] Verify CI passes on GitHub Actions
- [ ] Run `pnpm bump` to tag v0.1.0 and trigger release workflow
- [ ] Confirm npm package published at `https://npmjs.com/package/@setemiojo/oxc-config`
- [ ] Add `README.md` with usage examples for `setemiojo()`, direct presets, `oxfmt()`, and CLI
