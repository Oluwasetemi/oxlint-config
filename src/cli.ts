import * as p from '@clack/prompts'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isPackageExists } from 'local-pkg'

function supportsOxfmtConfigTs(): boolean {
  const [major, minor] = process.version.slice(1).split('.').map(Number) as [number, number]
  return major > 22 || (major === 22 && minor >= 18)
}

function detectPresets(): string[] {
  const detected: string[] = ['base']
  if (isPackageExists('typescript')) detected.push('typescript')
  if (['react', 'react-dom', '@tanstack/react-router', '@tanstack/start'].some(pkg => isPackageExists(pkg)))
    detected.push('react')
  return detected
}

async function confirmOverwrite(file: string): Promise<boolean> {
  if (!existsSync(file)) return true
  const ok = await p.confirm({ message: `${file} already exists. Overwrite?` })
  if (p.isCancel(ok)) {
    p.cancel('Cancelled')
    process.exit(0)
  }
  return ok as boolean
}

const PRESET_KEY_MAP: Record<string, string> = { tanstack: 'tanstackRouter' }

function writeOxlintConfig(presets: string[]): void {
  const flagArgs = presets
    .filter(name => name !== 'base')
    .map(name => `${PRESET_KEY_MAP[name] ?? name}: true`)
  const args = flagArgs.length > 0 ? `{ ${flagArgs.join(', ')} }` : '{}'
  const content = `import { setemiojo } from '@setemiojo/oxc-config'
import { defineConfig } from 'oxlint'

export default defineConfig(setemiojo(${args}))
`
  writeFileSync('oxlint.config.ts', content)
}

function writeOxfmtConfigTs(): void {
  const content = `import { oxfmt } from '@setemiojo/oxc-config/oxfmt'
export default oxfmt()
`
  writeFileSync('oxfmt.config.ts', content)
}

async function writeOxfmtRcJson(): Promise<void> {
  const { oxfmt } = await import('./presets/oxfmt.js')
  writeFileSync('.oxfmtrc.json', JSON.stringify(oxfmt(), null, 2) + '\n')
}

function addScripts(): void {
  if (!existsSync('package.json')) return
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as Record<string, unknown>
    const scripts = (pkg['scripts'] ?? {}) as Record<string, string>
    scripts['lint:ox'] = 'oxlint .'
    scripts['format:ox'] = 'oxfmt .'
    pkg['scripts'] = scripts
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
  }
  catch {
    p.log.error('Could not update package.json — update scripts manually.')
  }
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
  if (p.isCancel(tool)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

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
    if (p.isCancel(presetResult)) {
      p.cancel('Cancelled')
      process.exit(0)
    }
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
    if (p.isCancel(oxfmtFormat)) {
      p.cancel('Cancelled')
      process.exit(0)
    }
    useConfigTs = oxfmtFormat === 'ts'
    if (useConfigTs && !nodeSupports) {
      p.log.warn('oxfmt.config.ts requires Node ≥ 22.18. Current: ' + process.version)
    }
  }

  const addScriptsResult = await p.confirm({ message: 'Add scripts to package.json?' })
  if (p.isCancel(addScriptsResult)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  if (setupOxlint && (await confirmOverwrite('oxlint.config.ts'))) {
    writeOxlintConfig(selectedPresets)
  }

  if (setupOxfmt) {
    if (useConfigTs && (await confirmOverwrite('oxfmt.config.ts'))) {
      writeOxfmtConfigTs()
    }
    else if (!useConfigTs && (await confirmOverwrite('.oxfmtrc.json'))) {
      await writeOxfmtRcJson()
    }
  }

  if (addScriptsResult) {
    addScripts()
  }

  p.outro('Done!')
}
