import { signInWithGoogle } from '@/actions/auth'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { BrandSide } from '@/components/login/brand-side'
import { Lightbulb } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-screen">
      <BrandSide />

      {/* Lado direito — glow bleeding + glassmorphism */}
      <div className="flex flex-1 flex-col relative overflow-hidden">

        {/* [A] Glow bleeding — emana do lado esquerdo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at -10% 50%, oklch(0.68 0.21 35 / 0.18) 0%, transparent 70%),
              radial-gradient(ellipse 50% 40% at -5% 20%, oklch(0.72 0.21 38 / 0.10) 0%, transparent 60%)
            `,
          }}
        />
        {/* Glow sutil no canto inferior esquerdo também */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 0% 100%, oklch(0.68 0.21 35 / 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Fundo base adaptativo ao tema */}
        <div className="absolute inset-0 bg-background -z-10" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 sm:p-6">
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Lightbulb className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Efizi</span>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>

        {/* Conteúdo central */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-8 pb-12">
          {/* [D] Card glassmorphism */}
          <div
            className="
              w-full max-w-sm
              animate-fade-up
              rounded-2xl p-8
              border border-white/10 dark:border-white/8
              shadow-xl shadow-black/5 dark:shadow-black/30
              backdrop-blur-sm
            "
            style={{
              background: 'oklch(from var(--background) l c h / 0.7)',
              animationDelay: '0.15s',
              opacity: 0,
            }}
          >
            {/* Borda laranja sutil no topo do card */}
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent, oklch(0.68 0.21 35 / 0.5), transparent)',
              }}
            />

            <div className="space-y-7">
              {/* Heading */}
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Entre com sua conta corporativa para acessar o painel.
                </p>
              </div>

              {/* Mensagem de erro */}
              <ErrorMessage searchParams={searchParams} />

              {/* Botão + aviso */}
              <div className="space-y-4">
                <form action={signInWithGoogle}>
                  <button
                    type="submit"
                    className="
                      group relative w-full flex items-center justify-center gap-3
                      h-11 px-6 rounded-xl font-medium text-sm
                      bg-foreground text-background
                      dark:bg-white dark:text-black
                      hover:opacity-90 hover:-translate-y-0.5
                      active:translate-y-0
                      transition-all duration-200
                      shadow-md hover:shadow-lg
                      overflow-hidden
                    "
                  >
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                        backgroundSize: '200% auto',
                        animation: 'shimmer 1.5s linear infinite',
                      }}
                    />
                    <GoogleIcon />
                    <span className="relative">Entrar com Google</span>
                  </button>
                </form>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">acesso restrito</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Lightbulb className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas contas{' '}
                    <span className="font-semibold text-foreground">@efizi.com.br</span>{' '}
                    têm acesso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  if (!params.error) return null

  const messages: Record<string, string> = {
    domain: 'Apenas contas @efizi.com.br têm acesso a este sistema.',
    oauth: 'Erro ao conectar com o Google. Tente novamente.',
    session: 'Erro ao criar sessão. Tente novamente.',
    no_code: 'Código de autorização inválido. Tente novamente.',
  }

  return (
    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
      {messages[params.error] ?? 'Ocorreu um erro. Tente novamente.'}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
