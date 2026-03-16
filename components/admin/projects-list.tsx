'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { Search, FolderOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getDisplayStatus, DISPLAY_STATUS_LABELS, DISPLAY_STATUS_DOT_COLORS, type DisplayStatus } from '@/lib/constants'
import type { TicketStatus } from '@/lib/types/enums'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ProjectFilter = 'todos' | 'aberto' | 'em_andamento' | 'encerrado'

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

  const counts = useMemo(() => {
    const c = { todos: projects.length, aberto: 0, em_andamento: 0, encerrado: 0 }
    for (const p of projects) {
      c[getProjectFilter(p.status)]++
    }
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
    return list
  }, [projects, filter, search])

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
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
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
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
        ) : (
          <motion.div
            key={filter + search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((project, i) => {
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
        )}
      </AnimatePresence>
    </div>
  )
}
