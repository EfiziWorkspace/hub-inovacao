import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase admin client
const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}))
const mockEq = vi.fn()
const mockIn = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      mockFrom(table)
      return {
        select: (cols: string, opts?: any) => {
          mockSelect(cols, opts)
          const chain = {
            eq: (col: string, val: string) => {
              mockEq(col, val)
              return chain
            },
            in: (col: string, vals: string[]) => {
              mockIn(col, vals)
              return chain
            },
            then: (resolve: any) => {
              // Default: return count 0
              resolve({ count: 0 })
            },
          }
          // Make it thenable for Promise.all
          return Object.assign(chain, {
            [Symbol.toStringTag]: 'Promise',
            then: (onFulfilled: any) => Promise.resolve({ count: 0 }).then(onFulfilled),
            catch: (onRejected: any) => Promise.resolve({ count: 0 }).catch(onRejected),
          })
        },
      }
    },
  }),
}))

describe('Badge definitions', () => {
  it('has correct badge structure', async () => {
    const { getUserBadges } = await import('@/actions/badges')
    const badges = await getUserBadges('test-user-id')

    expect(badges).toHaveLength(6)

    // All badges should have required fields
    for (const badge of badges) {
      expect(badge).toHaveProperty('type')
      expect(badge).toHaveProperty('label')
      expect(badge).toHaveProperty('description')
      expect(badge).toHaveProperty('icon')
      expect(badge).toHaveProperty('earned')
      expect(typeof badge.earned).toBe('boolean')
    }
  })

  it('includes expected badge types', async () => {
    const { getUserBadges } = await import('@/actions/badges')
    const badges = await getUserBadges('test-user-id')

    const types = badges.map((b) => b.type)
    expect(types).toContain('primeira_ideia')
    expect(types).toContain('cinco_ideias')
    expect(types).toContain('ideia_aprovada')
    expect(types).toContain('tres_aprovadas')
    expect(types).toContain('ideia_concluida')
    expect(types).toContain('participou_mentoria')
  })

  it('all badges are unearned with 0 counts', async () => {
    const { getUserBadges } = await import('@/actions/badges')
    const badges = await getUserBadges('test-user-id')

    for (const badge of badges) {
      expect(badge.earned).toBe(false)
    }
  })
})
