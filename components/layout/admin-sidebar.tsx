'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard, ClipboardList, FolderKanban, FileText,
  GraduationCap, PanelLeftClose, PanelLeftOpen,
  LogOut, User, ChevronsUpDown,
} from 'lucide-react'
import { EfiziLogo } from '@/components/brand/efizi-logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Notifications } from '@/components/layout/notifications'
import { signOut } from '@/actions/auth'
import { APP_ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface AdminSidebarUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role?: string
  department?: string | null
}

interface AdminSidebarProps {
  pendingCount?: number
  user?: AdminSidebarUser
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
      className="flex items-center justify-center h-7 w-7 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
    >
      {state === 'expanded' ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
    </button>
  )
}

function NavItem({ title, url, icon: Icon, active, badge, color, activeBg, iconBg, activeIconBg }: {
  title: string; url: string; icon: React.ElementType; active: boolean; badge?: number
  color: string; activeBg: string; iconBg: string; activeIconBg: string
}) {
  return (
    <SidebarMenuItem>
      <Link
        href={url}
        title={title}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group/item relative',
          'group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:!shadow-none',
          active
            ? cn(activeBg, 'text-white shadow-lg')
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
        )}
      >
        <div className={cn(
          'flex h-9 w-9 aspect-square shrink-0 items-center justify-center rounded-xl transition-all duration-200',
          active
            ? cn('bg-white/20', 'group-data-[collapsible=icon]:shadow-lg', activeIconBg)
            : cn(iconBg, 'group-hover/item:scale-105', 'group-data-[collapsible=icon]:hover:bg-sidebar-accent/60')
        )}>
          <Icon className={cn('h-5 w-5 transition-colors duration-200', active ? 'text-white' : color)} />
        </div>
        <span className={cn('text-sm font-medium flex-1 group-data-[collapsible=icon]:hidden', active && 'font-semibold')}>{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className={cn(
            'text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 group-data-[collapsible=icon]:hidden',
            active ? 'bg-white/25 text-white' : 'bg-sidebar-primary/15 text-sidebar-primary'
          )}>{badge}</span>
        )}
        {badge !== undefined && badge > 0 && (
          <div className="hidden group-data-[collapsible=icon]:block absolute top-0 right-0">
            <div className="h-2 w-2 rounded-full bg-sidebar-primary shadow-lg shadow-sidebar-primary/50" />
          </div>
        )}
      </Link>
    </SidebarMenuItem>
  )
}

export function AdminSidebar({ pendingCount, user }: AdminSidebarProps) {
  const pathname = usePathname()

  const isDashboardActive = pathname === APP_ROUTES.admin && !pathname.startsWith(APP_ROUTES.adminQueue) && !pathname.startsWith(APP_ROUTES.adminProjects) && !pathname.startsWith(APP_ROUTES.adminTemplates) && !pathname.startsWith(APP_ROUTES.adminMentoring)
  const isQueueActive = pathname.startsWith(APP_ROUTES.adminQueue)
  const isProjectsActive = pathname.startsWith(APP_ROUTES.adminProjects)
  const isTemplatesActive = pathname.startsWith(APP_ROUTES.adminTemplates)
  const isMentoringActive = pathname.startsWith(APP_ROUTES.adminMentoring)

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header */}
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sidebar-primary/8 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Link href={APP_ROUTES.admin} className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/30">
              <div className="absolute inset-0 bg-sidebar-primary/30 blur-xl rounded-full animate-glow-pulse" />
              <EfiziLogo className="h-5 w-auto relative z-10" color="white" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-bold leading-none text-sidebar-foreground tracking-tight">Hub Inovação</p>
              <p className="text-[10px] text-sidebar-foreground/35 mt-1 font-medium">Admin</p>
            </div>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden"><CollapseToggle /></div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex justify-center mt-2"><CollapseToggle /></div>
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent className="pt-2 px-2 group-data-[collapsible=icon]:px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/25 text-[10px] uppercase tracking-widest font-semibold px-3 mb-1">Visão Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <NavItem title="Dashboard" url={APP_ROUTES.admin} icon={LayoutDashboard} active={isDashboardActive}
                color="text-sidebar-primary" activeBg="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/85" iconBg="bg-sidebar-primary/10" activeIconBg="group-data-[collapsible=icon]:bg-sidebar-primary" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/25 text-[10px] uppercase tracking-widest font-semibold px-3 mb-1">Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <NavItem title="Fila de Revisão" url={APP_ROUTES.adminQueue} icon={ClipboardList} active={isQueueActive} badge={pendingCount}
                color="text-warning" activeBg="bg-gradient-to-r from-warning to-warning/85" iconBg="bg-warning/10" activeIconBg="group-data-[collapsible=icon]:bg-warning" />
              <NavItem title="Projetos" url={APP_ROUTES.adminProjects} icon={FolderKanban} active={isProjectsActive}
                color="text-success" activeBg="bg-gradient-to-r from-success to-success/85" iconBg="bg-success/10" activeIconBg="group-data-[collapsible=icon]:bg-success" />
              <NavItem title="Templates" url={APP_ROUTES.adminTemplates} icon={FileText} active={isTemplatesActive}
                color="text-secondary" activeBg="bg-gradient-to-r from-secondary to-secondary/85" iconBg="bg-secondary/10" activeIconBg="group-data-[collapsible=icon]:bg-secondary" />
              <NavItem title="Mentoria" url={APP_ROUTES.adminMentoring} icon={GraduationCap} active={isMentoringActive}
                color="text-info" activeBg="bg-gradient-to-r from-info to-info/85" iconBg="bg-info/10" activeIconBg="group-data-[collapsible=icon]:bg-info" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2 space-y-2 group-data-[collapsible=icon]:p-1.5">
        {/* Notifications + Theme */}
        <div className="flex items-center justify-center gap-1 group-data-[collapsible=icon]:flex-col">
          {user?.id && (
            <Notifications role="admin" userId={user.id} />
          )}
          <ThemeToggle />
        </div>

        <div className="group-data-[collapsible=icon]:hidden h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        {/* User */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-2.5 rounded-xl p-2.5 w-full text-left transition-all duration-200 hover:bg-sidebar-accent/50',
                'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2'
              )}>
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9 ring-1 ring-sidebar-primary/20">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                    <AvatarFallback className="text-xs bg-sidebar-primary/15 text-sidebar-primary font-semibold">{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-sidebar" />
                </div>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="text-xs font-semibold truncate text-sidebar-foreground">{user.full_name}</p>
                  <p className="text-[10px] text-sidebar-foreground/35 truncate">{user.department ?? user.email}</p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/20 shrink-0 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
              <div className="px-2 py-2">
                <p className="text-sm font-semibold">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0">Administrador</Badge>
              </div>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />Sair
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
