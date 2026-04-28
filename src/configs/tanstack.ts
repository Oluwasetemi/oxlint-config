import type { OxlintConfigItem } from '../typegen.js'

export const tanstack: OxlintConfigItem[] = [
  {
    plugins: ['eslint'],
    jsPlugins: ['@tanstack/eslint-plugin-router'],
    categories: {
      correctness: 'error',
    },
  },
]
