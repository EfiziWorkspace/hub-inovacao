import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className merge)', () => {
  it('merges class names', () => {
    const result = cn('text-sm', 'font-bold')
    expect(result).toContain('text-sm')
    expect(result).toContain('font-bold')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toContain('base')
    expect(result).toContain('active')
  })

  it('removes falsy values', () => {
    const result = cn('base', false && 'hidden', null, undefined)
    expect(result).toBe('base')
  })

  it('resolves tailwind conflicts', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })
})
