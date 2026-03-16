import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: function () { return this },
        in: function () { return this },
        then: (resolve: (val: { count: number }) => void) => resolve({ count: 0 }),
        catch: () => {},
        [Symbol.toStringTag]: 'Promise',
      }),
    }),
  }),
}))

describe('Badge definitions', () => {
  it('has correct badge structure', async () => {
    const { getUserBadges } = await import('@/actions/badges')
    const badges = await getUserBadges('test-user-id')

    expect(badges).toHaveLength(6)

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
