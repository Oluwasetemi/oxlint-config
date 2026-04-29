import fs from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { execa } from 'execa'
import { glob } from 'tinyglobby'
import { afterAll, beforeAll, it } from 'vitest'
import { setemiojo } from '../src/factory.js'
import type { SetemiOjoOptions } from '../src/factory.js'

const isWindows = process.platform === 'win32'
const timeout = isWindows ? 120_000 : 30_000
const oxlintBin = resolve('node_modules/.bin/oxlint')
const root = resolve('.')

beforeAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true })
})
afterAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true })
})

runWithConfig('base', { typescript: false, react: false }, ['javascript.js', 'typescript.ts'])
runWithConfig('typescript', { typescript: true, react: false }, ['typescript.ts'])
runWithConfig('react', { typescript: true, react: true }, ['jsx.jsx', 'tsx.tsx'])
runWithConfig('node', { node: true }, ['javascript.js'])

function normalizeReport(output: string, target: string): string {
  return output
    // strip absolute paths — replace target dir with a stable placeholder
    .replace(new RegExp(target.replace(/[/\\]/g, '[/\\\\]'), 'g'), '<root>')
    // strip timing line (changes every run)
    .replace(/Finished in \d+m?s on \d+ files? with \d+ rules using \d+ threads?\./g, 'Finished in [TIME].')
    // strip GitHub Actions annotation lines emitted on CI (::error file=..., ::warning file=...)
    .split('\n').filter(line => !line.startsWith('::error') && !line.startsWith('::warning')).join('\n')
    .trim()
}

function runWithConfig(name: string, options: SetemiOjoOptions, inputFiles: string[]) {
  it.concurrent(name, async ({ expect }) => {
    const inputDir = resolve('test/fixtures/input')
    const outputDir = resolve('test/fixtures/output', name)
    // _fixtures must be inside project root so node_modules/oxlint resolves in the .ts config
    const target = resolve('_fixtures', name)

    await fs.mkdir(target, { recursive: true })

    for (const file of inputFiles) {
      await fs.copyFile(join(inputDir, file), join(target, file))
    }

    // Write a .ts config so oxlint accepts inline extends (OxlintConfig[])
    // JSON config only supports extends: string[] (file paths)
    const config = setemiojo(options)
    await fs.writeFile(
      join(target, 'oxlint.config.ts'),
      [
        `import { defineConfig } from 'oxlint'`,
        `export default defineConfig(${JSON.stringify(config, null, 2)})`,
        '',
      ].join('\n'),
    )

    const filePaths = inputFiles.map(f => `_fixtures/${name}/${f}`)
    const configFlag = `_fixtures/${name}/oxlint.config.ts`

    // Capture the violation report before --fix (shows all rules that fire)
    const reportResult = await execa(
      oxlintBin,
      ['-c', configFlag, ...filePaths],
      { cwd: root, reject: false, all: true },
    )
    const report = normalizeReport(reportResult.all ?? '', target)
    await expect.soft(report).toMatchFileSnapshot(join(outputDir, 'report.txt'))

    // Run --fix and snapshot files that changed
    await execa(oxlintBin, ['--fix', '-c', configFlag, ...filePaths], {
      cwd: root,
      reject: false,
    })

    const files = await glob('**/*', {
      ignore: ['oxlint.config.ts'],
      cwd: target,
    })

    await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(join(target, file), 'utf-8')
        await expect.soft(content).toMatchFileSnapshot(join(outputDir, file))
      }),
    )
  }, timeout)
}
