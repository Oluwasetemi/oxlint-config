import type { OxlintConfigItem } from '../typegen.js'

export const testing: OxlintConfigItem[] = [
  {
    plugins: ['vitest'],
    categories: {
      correctness: 'error',
    },
  },
]
