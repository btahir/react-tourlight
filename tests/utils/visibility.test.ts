import { describe, expect, it } from 'vitest'
import { isElementVisible } from '../../src/utils/visibility.ts'

// The shared predicate keeps current-page diagnostics and playback readiness consistent.
describe('target visibility', () => {
  it('does not anchor a tour to a transparent ancestor, and resolves after it appears', () => {
    const parent = document.createElement('div')
    const target = document.createElement('button')
    parent.append(target)
    document.body.append(parent)
    parent.style.opacity = '0'
    expect(isElementVisible(target)).toBe(false)
    parent.style.opacity = '1'
    expect(isElementVisible(target)).toBe(true)
    parent.remove()
    expect(isElementVisible(target)).toBe(false)
  })
})
