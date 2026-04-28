# @setemiojo/oxc-config — Design Spec

**Date:** 2026-04-28
**Status:** Approved
**Repo:** github.com/Oluwasetemi/oxc-config (new standalone repo)
**Package:** `@setemiojo/oxc-config`

---

## Overview

A shareable OXC toolchain config package for oxlint and oxfmt, modeled after `@setemiojo/eslint-config`. Exposes composable TypeScript presets and a `setemiojo()` auto-detecting factory for oxlint, plus an `oxfmt()` preset for the formatter. A `@clack/prompts` CLI handles project setup.

**Why now:** antfu, sxzz, and posva have no published oxlint/oxfmt config packages. Antfu's oxlint integration is blocked (Issue #767). This is a first-mover opportunity. The `oxlint.config.ts` import pattern bypasses oxlint's current `node_modules extends` limitation (Issue #15538). Oxfmt's missing `extends` support (Issue #16394) is bridged by the CLI.

---

## Repository Structure

```
oxc-config/
├── src/
│   ├── configs/
│   │   ├── base.ts          # eslint + oxc categories: correctness, suspicious
│   │   ├── typescript.ts    # typescript plugin + unicorn
│   │   ├── react.ts         # react + react-perf + jsx-a11y
│   │   ├── node.ts          # node plugin
│   │   ├── testing.ts       # vitest plugin
│   │   ├── next.ts          # nextjs plugin
│   │   └── tanstack.ts      # @tanstack/eslint-plugin-router (js plugin)
│   ├── presets/
│   │   └── oxfmt.ts         # oxfmt preset object
│   ├── factory.ts           # setemiojo() auto-detecting factory
│   ├── cli.ts               # init CLI entry point
│   └── index.ts             # public exports
├── bin/
│   └── index.mjs            # CLI shim
├── scripts/
│   └── typegen.ts           # generates src/typegen.d.ts
├── test/
│   └── factory-snap.test.ts # vitest snapshot tests
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml      # npm Trusted Publishing via OIDC
└── package.json
```

**Tooling** (mirrors `eslint-config`):
- Build: `tsdown` with `--dts`
- Test: `vitest` snapshot tests
- Release: `bumpp` + GitHub Actions Trusted Publishing
- Package manager: `pnpm` (single-package repo, no workspace catalogs needed)

---

## API Design

### Composable Presets

Users import presets directly into `oxlint.config.ts`:

```ts
import { base, typescript, react, node, testing, next, tanstack } from '@setemiojo/oxc-config'
import { defineConfig } from 'oxlint'

export default defineConfig([...base, ...typescript, ...react])
```

Each preset is an array of oxlint config objects. Config names follow the `setemiojo/` prefix pattern (e.g. `setemiojo/base`, `setemiojo/react`).

### Factory Function

Auto-detects from the project's `package.json` via `local-pkg`:

```ts
import { setemiojo } from '@setemiojo/oxc-config'

export default setemiojo({
  typescript: true,       // auto-detected: isPackageExists('typescript')
  react: true,            // auto-detected: ReactPackages (react, react-dom, @tanstack/react-router, @tanstack/start)
  tanstackRouter: false,  // opt-in
  next: false,            // opt-in
  node: false,            // opt-in
  testing: false,         // opt-in
})
```

`ReactPackages` mirrors the same list used in `@setemiojo/eslint-config`.

### Oxfmt Preset

```ts
// oxfmt.config.ts (Node ≥ 22.18)
import { oxfmt } from '@setemiojo/oxc-config/oxfmt'
export default oxfmt({ singleQuote: false, printWidth: 100 })
```

`oxfmt()` merges user overrides onto the default preset and returns a plain object. When written as `.oxfmtrc.json`, the CLI serializes it to JSON at init time.

**Default oxfmt preset values:**
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "insertFinalNewline": true,
  "sortImports": false,
  "sortPackageJson": true
}
```

---

## Tiered Preset Contents

| Preset | Oxlint Plugins Enabled | Categories |
|--------|------------------------|------------|
| `base` | `eslint`, `oxc` | correctness, suspicious |
| `typescript` | `typescript`, `unicorn` | correctness, suspicious |
| `react` | `react`, `react-perf`, `jsx-a11y` | correctness, suspicious |
| `node` | `node` | correctness, suspicious |
| `testing` | `vitest` | correctness |
| `next` | `nextjs` | correctness, suspicious |
| `tanstack` | `eslint` (jsPlugins: `@tanstack/eslint-plugin-router`) | correctness |

---

## CLI Design

```
$ npx @setemiojo/oxc-config init
```

Interactive `@clack/prompts` wizard:

```
┌  @setemiojo/oxc-config
│
◆  What would you like to set up?
│  ○ oxlint only
│  ○ oxfmt only
│  ● both (recommended)
│
◆  Which presets? (multi-select — shown when oxlint selected)
│  ◼ base  ◼ typescript  ◼ react  ○ node  ○ testing  ○ next  ○ tanstack
│
◆  Use oxfmt.config.ts? (shown when oxfmt selected, Node ≥ 22.18 detected)
│  Stays live via semver. Requires Node 22.18+.
│  ● yes  ○ no, write .oxfmtrc.json instead
│
◆  Add scripts to package.json?
│  ● yes  ○ no
│
└  ✓ Done!
```

**Files written:**
- `oxlint.config.ts` — imports `setemiojo()` with user-selected presets
- `oxfmt.config.ts` OR `.oxfmtrc.json` — based on Node version + user choice
- `package.json` scripts: `"lint:ox": "oxlint ."` and `"format:ox": "oxfmt ."`

**Flow rules:**
- "oxlint only" → skips oxfmt Node version question
- "oxfmt only" → skips preset multi-select
- Existing config files → `clack confirm()` before overwriting each
- Preset multi-select defaults pre-ticked based on `isPackageExists()` detection
- Node < 22.18 + user forces `oxfmt.config.ts` → `clack log.warn()` with version requirement

---

## Data Flow

```
package.json (isPackageExists via local-pkg)
        │
        ▼
  setemiojo(options)
        │
        ▼
  merge preset arrays  ←── [...base, ...typescript, ...react, ...]
        │
        ▼
  oxlint config object  →  user's oxlint.config.ts re-exports this
```

For oxfmt: `oxfmt(options)` merges user overrides onto default preset → returns plain object → either imported in `oxfmt.config.ts` or serialized to `.oxfmtrc.json` by CLI.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Optional plugin not installed (e.g. `@tanstack/eslint-plugin-router`) | `local-pkg` check → `clack log.warn()` with install hint |
| CLI file overwrite | `clack confirm()` → bail on "no" |
| `oxfmt.config.ts` on Node < 22.18 (user-forced) | `clack log.warn()` with Node version requirement |
| Unknown option passed to `setemiojo()` | TypeScript compile error (strict types via `typegen.d.ts`) |

---

## Testing

- **Snapshot tests** (`test/factory-snap.test.ts`) on `setemiojo()` output — assert config names (`setemiojo/base`, `setemiojo/react`, etc.), plugin presence, rule severities
- **Preset combos tested:** `base`, `base+typescript`, `base+typescript+react`, `base+typescript+react+tanstack`, full preset
- **No fixture-file tests** initially (oxlint runs as a separate binary, no Node API)

---

## Packages

**Dependencies:**
- `local-pkg` — package existence detection
- `@clack/prompts` — CLI wizard

**Dev dependencies:**
- `oxlint` — peer (the actual linter binary)
- `tsdown`, `vitest`, `bumpp`, `tsx`, `typescript`

**Peer dependencies:**
- `oxlint` — required
- `oxfmt` — optional (only if using oxfmt preset)
- `@tanstack/eslint-plugin-router` — optional (tanstack preset)

---

## Release

Same pattern as `@setemiojo/eslint-config`:
- `bumpp` for version bumping
- GitHub Actions `release.yml` with `id-token: write` for npm Trusted Publishing (OIDC, no long-lived tokens)
- `publishConfig: { access: "public" }`
- Repository URLs use `Oluwasetemi` (capital O) to match GitHub canonical URL for provenance validation
