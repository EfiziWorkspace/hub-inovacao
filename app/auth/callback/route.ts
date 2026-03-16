import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_DOMAIN = 'efizi.com.br'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !sessionData.user) {
    return NextResponse.redirect(`${origin}/login?error=session`)
  }

  const user = sessionData.user
  const email = user.email ?? ''

  // Validar domínio @efizi.com.br
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=domain`)
  }

  // Criar ou atualizar profile
  const adminClient = createAdminClient()
  const googleMeta = user.user_metadata

  const profileData = {
    id: user.id,
    email,
    full_name: googleMeta?.full_name ?? googleMeta?.name ?? email.split('@')[0],
    avatar_url: googleMeta?.avatar_url ?? googleMeta?.picture ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, role, department')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    // Novo usuário — criar profile
    await adminClient.from('profiles').insert({
      ...profileData,
      role: 'collaborator',
      department: null,
    })
    return NextResponse.redirect(`${origin}/app?onboarding=true`)
  } else {
    // Usuário existente — atualizar nome e avatar
    await adminClient.from('profiles').update(profileData).eq('id', user.id)
    return NextResponse.redirect(
      `${origin}${existingProfile.role === 'admin' ? '/admin' : '/app'}`
    )
  }
}
