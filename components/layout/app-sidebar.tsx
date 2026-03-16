'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Lightbulb, List, Sparkles, Mail, Building2, Shield,
  ChevronsUpDown, PanelLeftClose, PanelLeftOpen, GraduationCap,
} from 'lucide-react'
import { BadgeGrid } from '@/components/badges/badge-grid'
import { APP_ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface AppSidebarUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  department: string | null
  role?: string
}

interface AppSidebarProps {
  ticketCount?: number
  user?: AppSidebarUser
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function CollapseToggle() {
  const { state, toggleSidebar, isMobile } = useSidebar()
  if (isMobile) return null

  return (
    <button
      onClick={toggleSidebar}
      className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      title={state === 'expanded' ? 'Recolher sidebar' : 'Expandir sidebar'}
    >
      {state === 'expanded' ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeftOpen className="h-4 w-4" />
      )}
    </button>
  )
}

export function AppSidebar({ ticketCount, user }: AppSidebarProps) {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)

  const isTicketsActive =
    pathname === APP_ROUTES.app ||
    (pathname.startsWith('/app/') &&
      pathname !== APP_ROUTES.newTicket &&
      !pathname.startsWith(APP_ROUTES.appMentoring))

  return (
    <>
      <Sidebar collapsible="icon">
        {/* Header */}
        <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <Link href={APP_ROUTES.app} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Lightbulb className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold leading-none">Inovação</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Efizi</p>
              </div>
            </Link>
            <div className="group-data-[collapsible=icon]:hidden">
              <CollapseToggle />
            </div>
          </div>
          {/* Botão de expandir quando colapsado */}
          <div className="hidden group-data-[collapsible=icon]:flex justify-center mt-1">
            <CollapseToggle />
          </div>
        </SidebarHeader>

        <Separator className="mx-3 w-auto group-data-[collapsible=icon]:mx-2" />

        {/* Menu */}
        <SidebarContent className="pt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem className="relative">
                  {isTicketsActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <SidebarMenuButton asChild isActive={isTicketsActive} tooltip="Meus Chamados">
                    <Link href={APP_ROUTES.app}>
                      <List className="h-4 w-4" />
                      <span className="flex-1">Meus Chamados</span>
                      {ticketCount !== undefined && ticketCount > 0 && (
                        <span className="bg-primary/15 text-primary text-xs font-medium rounded-full px-1.5 py-0.5 tabular-nums">
                          {ticketCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem className="relative">
                  {pathname.startsWith(APP_ROUTES.appMentoring) && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <SidebarMenuButton asChild isActive={pathname.startsWith(APP_ROUTES.appMentoring)} tooltip="Mentoria">
                    <Link href={APP_ROUTES.appMentoring}>
                      <GraduationCap className="h-4 w-4" />
                      <span>Mentoria</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-2 space-y-2">
          {/* Nova Ideia */}
          <SidebarMenuButton asChild tooltip="Nova Ideia">
            <Link
              href={APP_ROUTES.newTicket}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" />
              <span>Nova Ideia</span>
            </Link>
          </SidebarMenuButton>

          <Separator className="group-data-[collapsible=icon]:hidden" />

          {/* User card */}
          {user && (
            <button
              onClick={() => setProfileOpen(true)}
              className={cn(
                'flex items-center gap-2 rounded-lg p-2 w-full text-left transition-colors',
                'hover:bg-muted/50',
                'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5'
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.department ?? user.email}</p>
              </div>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50 shrink-0 group-data-[collapsible=icon]:hidden" />
            </button>
          )}
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Profile Sheet */}
      {user && (
        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Meu Perfil</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold">{user.full_name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações</h3>
                <div className="space-y-3">
                  <ProfileField icon={Mail} label="E-mail" value={user.email} />
                  {user.department && <ProfileField icon={Building2} label="Setor" value={user.department} />}
                  <ProfileField icon={Shield} label="Perfil de acesso" value={user.role === 'admin' ? 'Administrador' : 'Colaborador'} />
                </div>
              </div>

              <Separator />

              <BadgeGrid userId={user.id} />

              <Separator />
              <p className="text-xs text-muted-foreground text-center">
                Dados sincronizados com sua conta Google Workspace.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

function ProfileField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}
