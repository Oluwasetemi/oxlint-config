# @setemiojo/oxc-config

[![npm](https://img.shields.io/npm/v/@setemiojo/oxc-config?color=444&label=)](https://npmjs.com/package/@setemiojo/oxc-config)

Shareable [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) config for the OXC toolchain.

- Reasonable defaults, best practices, only one line of config
- Auto-detects TypeScript and React — zero config for most projects
- Composable presets: `base`, `typescript`, `react`, `node`, `testing`, `next`, `tanstackRouter`
- Optional [oxfmt](#oxfmt) formatter preset — single quotes, no semi, trailing commas, sorted imports
- Requires oxlint ≥ 1.0.0

> [!WARNING]
> This is a **personal config** with strong opinions. Changes may not suit every project or team.
>
> If you use this config directly, review changes every time you update. Or fork it and maintain your own.

## Usage

### Starter Wizard

Run the CLI to set up oxlint and oxfmt in your project with one command:

```bash
pnpm dlx @setemiojo/oxc-config@latest
```

The wizard will:
- Auto-detect installed packages (TypeScript, React, etc.) and pre-select the right presets
- Write `oxlint.config.ts` using `setemiojo()`
- Write `oxfmt.config.ts` or `.oxfmtrc.json` for the formatter
- Add `lint:ox` and `format:ox` scripts to `package.json`

### Manual Install

```bash
pnpm i -D oxlint @setemiojo/oxc-config
```

Create `oxlint.config.ts` in your project root:

```ts
// oxlint.config.ts
import { setemiojo } from '@setemiojo/oxc-config'
import { defineConfig } from 'oxlint'

export default defineConfig(setemiojo())
```

### Add scripts to package.json

```json
{
  "scripts": {
    "lint:ox": "oxlint .",
    "lint:ox:fix": "oxlint . --fix"
  }
}
```

## IDE Support

<details>
<summary>🟦 VS Code support</summary>

<br>

Install the [oxc VS Code extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode).

Add the following to your `.vscode/settings.json`:

```jsonc
{
  // Enable oxlint
  "oxc.enable": true,

  // Auto-fix on save
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "explicit"
  }
}
```

</details>

<details>
<summary>🔲 Zed support</summary>

<br>

Install the [oxc Zed extension](https://github.com/oxc-project/zed-oxc).

Add the following to your `.zed/settings.json`:

```jsonc
{
  "code_actions_on_format": {
    "source.fixAll.oxc": true
  }
}
```

</details>

## Customization

### Auto-detection

`setemiojo()` auto-detects your project's installed packages and enables the right presets:

| Detected package | Preset enabled |
|---|---|
| `typescript` | `typescript` |
| `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/start` | `react` |

All other presets are **opt-in**:

```ts
// oxlint.config.ts
import { setemiojo } from '@setemiojo/oxc-config'
import { defineConfig } from 'oxlint'

export default defineConfig(setemiojo({
  // explicitly override auto-detection
  typescript: true,
  react: true,

  // opt-in extras
  node: true,
  testing: true,
  next: true,
  tanstackRouter: true,
}))
```

### Presets

You can also import individual presets and compose them manually:

```ts
// oxlint.config.ts
import { base, react, typescript, node } from '@setemiojo/oxc-config'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [
    ...base,
    ...typescript,
    ...react,
    ...node,
  ],
})
```

Check out the [configs](https://github.com/Oluwasetemi/oxc-config/blob/main/src/configs) and [factory](https://github.com/Oluwasetemi/oxc-config/blob/main/src/factory.ts) for more details.

### React

React support is **automatically detected** when any of the following packages are installed:

- `react` / `react-dom`
- `@tanstack/react-router` / `@tanstack/start`

Or explicitly enable it:

```ts
export default defineConfig(setemiojo({ react: true }))
```

### Node.js

```ts
export default defineConfig(setemiojo({ node: true }))
```

### Testing

Enables rules for test files (vitest, jest):

```ts
export default defineConfig(setemiojo({ testing: true }))
```

### Next.js

```ts
export default defineConfig(setemiojo({ next: true }))
```

### TanStack Router

Requires the optional peer dependency `@tanstack/eslint-plugin-router`:

```bash
pnpm i -D @tanstack/eslint-plugin-router
```

```ts
export default defineConfig(setemiojo({ tanstackRouter: true }))
```

## oxfmt

Install the formatter:

```bash
pnpm i -D oxfmt
```

### With `oxfmt.config.ts` (Node ≥ 22.18)

```ts
// oxfmt.config.ts
import { oxfmt } from '@setemiojo/oxc-config/oxfmt'

export default oxfmt()
```

### With `.oxfmtrc.json`

```bash
node -e "const {oxfmt}=await import('@setemiojo/oxc-config/oxfmt');const fs=await import('node:fs');fs.writeFileSync('.oxfmtrc.json',JSON.stringify(oxfmt(),null,2)+'\\n')"
```

### Customize formatter options

```ts
import { oxfmt } from '@setemiojo/oxc-config/oxfmt'

export default oxfmt({
  printWidth: 120,
  singleQuote: false,
  semi: true,
  trailingComma: 'es5',
  sortImports: true,
})
```

Default options:

| Option | Default |
|---|---|
| `printWidth` | `100` |
| `tabWidth` | `2` |
| `useTabs` | `false` |
| `semi` | `false` |
| `singleQuote` | `true` |
| `trailingComma` | `"all"` |
| `insertFinalNewline` | `true` |
| `sortImports` | `false` |
| `sortPackageJson` | `true` |

### Add scripts to package.json

```json
{
  "scripts": {
    "format:ox": "oxfmt .",
    "format:ox:check": "oxfmt . --check"
  }
}
```

## Versioning Policy

This project follows [Semantic Versioning](https://semver.org/). However, since this is a config with opinions, rule changes are not treated as breaking changes.

### Breaking changes

- Node.js version requirement changes
- oxlint major version bumps that affect config shape
- Removal of exported presets or factory options

### Non-breaking changes

- Enabling or tightening rules within a preset
- Rule option changes
- Dependency version bumps

## FAQ

### Why oxlint instead of ESLint?

[oxlint](https://oxc.rs/docs/guide/usage/linter) is 50–100× faster than ESLint. For large codebases, the difference is seconds vs. minutes. It covers the most important correctness and suspicious rules with zero plugin setup.

### Why oxfmt instead of Prettier?

[oxfmt](https://github.com/nicolo-ribaudo/oxfmt) is built on OXC's Rust parser — significantly faster than Prettier's JS parser. It intentionally stays close to Prettier's output so migration is easy.

### Can I use this alongside ESLint?

Yes. oxlint and ESLint target different things and don't conflict. oxlint is a fast first pass for correctness rules; ESLint handles complex type-aware and stylistic rules.

## Check Also

- [oluwasetemi/eslint-config](https://github.com/oluwasetemi/eslint-config) — ESLint flat config (TypeScript, React, Vue, and more)
- [oluwasetemi/dotfiles](https://github.com/oluwasetemi/dotfiles) — My dotfiles
- [oxc-project/oxc](https://github.com/oxc-project/oxc) — The OXC toolchain

## License

[MIT](./LICENSE) License &copy; 2025-PRESENT [Oluwasetemi Ojo](https://github.com/oluwasetemi)
