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
