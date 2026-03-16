'use client'

import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/actions/auth'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Notifications } from '@/components/layout/notifications'
import { LogOut, ChevronRight } from 'lucide-react'

interface HeaderProps {
  user: {
    id?: string
    full_name: string
    email: string
    avatar_url: string | null
    role?: string
    department?: string | null
  }
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/app': 'Meus Chamados',
  '/app/novo': 'Nova Ideia',
  '/admin': 'Dashboard',
  '/admin/fila': 'Fila de Revisão',
  '/admin/projetos': 'Projetos',
}

function getBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  if (BREADCRUMB_MAP[pathname]) {
    return [{ label: BREADCRUMB_MAP[pathname] }]
  }

  if (pathname.startsWith('/app/novo')) {
    return [
      { label: 'Meus Chamados', href: '/app' },
      { label: 'Nova Ideia' },
    ]
  }

  if (pathname.startsWith('/app/')) {
    return [
      { label: 'Meus Chamados', href: '/app' },
      { label: 'Detalhes' },
    ]
  }

  if (pathname.startsWith('/admin/projetos/')) {
    return [
      { label: 'Projetos', href: '/admin/projetos' },
      { label: 'Detalhes' },
    ]
  }

  return []
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border/40 px-4 lg:px-6">
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              {crumb.href ? (
                <a href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground/80 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-0.5">
        {user.id && (
          <Notifications
            role={(user.role as 'admin' | 'collaborator') ?? 'collaborator'}
            userId={user.id}
          />
        )}
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
