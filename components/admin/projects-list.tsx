'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import {
  Search, FolderOpen, LayoutGrid, List, ArrowUpDown,
  ChevronLeft, ChevronRight, Building2, User,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getDisplayStatus, DISPLAY_STATUS_LABELS, type DisplayStatus } from '@/lib/constants'
import type { TicketStatus } from '@/lib/types/enums'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ProjectFilter = 'todos' | 'aberto' | 'em_andamento' | 'encerrado'
type SortOption = 'recent' | 'oldest' | 'az' | 'za'
type ViewMode = 'grid' | 'list'

const ITEMS_PER_PAGE = 12

interface Project {
  id: string
  title: string
  description: string
  department: string
  status: string
  dev_substatus: string | null
  updated_at: string
  profiles: { full_name: string } | null
}

const FILTERS: { value: ProjectFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'aberto', label: 'Abertos' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'encerrado', label: 'Encerrados' },
]

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Mais recente' },
  { value: 'oldest', label: 'Mais antigo' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
]

const ACCENT_BORDERS: Record<DisplayStatus, string> = {
  aberto: 'border-l-warning',
  em_andamento: 'border-l-info',
  concluido: 'border-l-success',
  recusado: 'border-l-destructive',
}

function getProjectFilter(status: string): ProjectFilter {
  const display = getDisplayStatus(status as TicketStatus)
  if (display === 'concluido' || display === 'recusado') return 'encerrado'
  if (display === 'em_andamento') return 'em_andamento'
  return 'aberto'
}

export function ProjectsList({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<ProjectFilter>('todos')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('recent')
  const [view, setView] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)

  const counts = useMemo(() => {
    const c = { todos: projects.length, aberto: 0, em_andamento: 0, encerrado: 0 }
    for (const p of projects) c[getProjectFilter(p.status)]++
    return c
  }, [projects])

  const filtered = useMemo(() => {
    let list = projects

    if (filter !== 'todos') {
      list = list.filter((p) => getProjectFilter(p.status) === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.profiles?.full_name?.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
      )
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'recent': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'oldest': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        case 'az': return a.title.localeCompare(b.title)
        case 'za': return b.title.localeCompare(a.title)
        default: return 0
      }
    })

    return list
  }, [projects, filter, search, sort])

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Reset page when filters change
  useMemo(() => setPage(1), [filter, search, sort])

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'text-sm px-4 py-2 rounded-full border transition-all duration-200',
                  filter === f.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {f.label}
                <span className="ml-1.5 opacity-70">{counts[f.value]}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, autor ou setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sort + View toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex gap-1">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md transition-colors',
                    sort === s.value
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                view === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} resultado(s)
        {totalPages > 1 && ` • Página ${page} de ${totalPages}`}
      </p>

      {/* Content */}
      <AnimatePresence mode="wait">
        {paginated.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground/50 animate-float-slow" />
            </div>
            <p className="font-medium text-lg">Nenhum projeto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou a busca.
            </p>
          </motion.div>
        ) : view === 'grid' ? (
          <motion.div
            key={`grid-${filter}-${sort}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {paginated.map((project, i) => {
              const display = getDisplayStatus(project.status as TicketStatus)
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Link href={`/admin/projetos/${project.id}`}>
                    <Card className={cn(
                      'group border-l-[3px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer h-full',
                      ACCENT_BORDERS[display]
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          <TicketStatusBadge status={project.status as TicketStatus} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project.profiles?.full_name ?? '—'} · {project.department}</span>
                          <span>
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          /* List view */
          <motion.div
            key={`list-${filter}-${sort}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {paginated.map((project, i) => {
              const display = getDisplayStatus(project.status as TicketStatus)
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Link href={`/admin/projetos/${project.id}`}>
                    <div className={cn(
                      'group flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer',
                      'border-l-[3px]', ACCENT_BORDERS[display]
                    )}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {project.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {project.profiles?.full_name ?? '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {project.department}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <TicketStatusBadge status={project.status as TicketStatus} />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'h-8 w-8 rounded-md text-sm font-medium transition-colors',
                  page === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
