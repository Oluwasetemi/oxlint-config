import type { OxlintConfigItem } from '../typegen.js'

export const react: OxlintConfigItem[] = [
  {
    plugins: ['react', 'jsx-a11y'],
    // Note: 'react-perf' plugin not included as it's not available in LintPlugins type
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
  },
]
