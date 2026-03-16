'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Lightbulb, LayoutDashboard, ClipboardList, FolderKanban, FileText, GraduationCap, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { APP_ROUTES } from '@/lib/constants'

interface AdminSidebarProps {
  pendingCount?: number
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

export function AdminSidebar({ pendingCount }: AdminSidebarProps) {
  const pathname = usePathname()

  const isDashboardActive =
    pathname === APP_ROUTES.admin &&
    !pathname.startsWith(APP_ROUTES.adminQueue) &&
    !pathname.startsWith(APP_ROUTES.adminProjects)
  const isQueueActive = pathname.startsWith(APP_ROUTES.adminQueue)
  const isProjectsActive = pathname.startsWith(APP_ROUTES.adminProjects)

  const overviewItems = [
    { title: 'Dashboard', url: APP_ROUTES.admin, icon: LayoutDashboard, active: isDashboardActive },
  ]

  const gestaoItems = [
    { title: 'Fila de Revisão', url: APP_ROUTES.adminQueue, icon: ClipboardList, active: isQueueActive, badge: pendingCount },
    { title: 'Projetos', url: APP_ROUTES.adminProjects, icon: FolderKanban, active: isProjectsActive },
    { title: 'Templates', url: APP_ROUTES.adminTemplates, icon: FileText, active: pathname.startsWith(APP_ROUTES.adminTemplates) },
    { title: 'Mentoria', url: APP_ROUTES.adminMentoring, icon: GraduationCap, active: pathname.startsWith(APP_ROUTES.adminMentoring) },
  ]

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Link href={APP_ROUTES.admin} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Lightbulb className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-none">Inovação</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Admin</p>
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
              {overviewItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gestaoItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

function NavItem({ item }: {
  item: {
    title: string
    url: string
    icon: React.ElementType
    active: boolean
    badge?: number
  }
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem className="relative">
      {item.active && (
        <motion.div
          layoutId="admin-sidebar-active"
          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <SidebarMenuButton asChild isActive={item.active} tooltip={item.title}>
        <Link href={item.url}>
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.title}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="bg-primary/15 text-primary text-xs font-medium rounded-full px-1.5 py-0.5 tabular-nums">
                {item.badge}
              </span>
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
