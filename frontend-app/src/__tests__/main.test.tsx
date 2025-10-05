import { describe, it, expect } from 'vitest'

describe.skip('main bootstrap', () => {
  it('mounts without crashing', async () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)

    // Dynamically import to run after DOM ready
    const mod = await import('../main')
    expect(mod).toBeTruthy()
  })
})
