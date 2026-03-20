'use client'

import { cn } from '@/lib/utils'
import { getDisplayStatus, type DisplayStatus } from '@/lib/constants'
import type { TicketStatus } from '@/lib/types/enums'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

const STEPS: { display: DisplayStatus; label: string }[] = [
  { display: 'aberto', label: 'Aberto' },
  { display: 'em_andamento', label: 'Em Andamento' },
  { display: 'concluido', label: 'Concluído' },
]

const STEP_INDEX: Record<DisplayStatus, number> = {
  aberto: 0,
  em_andamento: 1,
  concluido: 2,
  recusado: -1,
}

export function StatusProgress({ status }: { status: TicketStatus }) {
  const display = getDisplayStatus(status)
  const currentIndex = STEP_INDEX[display]
  const isRejected = display === 'recusado'

  if (isRejected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive">
          <X className="h-3.5 w-3.5 text-destructive-foreground" />
        </div>
        <span className="text-sm font-semibold text-destructive">Chamado recusado</span>
      </motion.div>
    )
  }

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex
        const isCurrent = i === currentIndex
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.display} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center w-full">
                {/* Line before dot */}
                {i > 0 && (
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    {(isCompleted || isCurrent) && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6, delay: i * 0.2, ease: 'easeOut' }}
                        className="h-full rounded-full bg-primary"
                      />
                    )}
                  </div>
                )}

                {/* Dot */}
                <div className="relative shrink-0">
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-primary"
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.15, type: 'spring', stiffness: 300 }}
                    className={cn(
                      'relative h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isCompleted
                        ? 'bg-primary border-primary'
                        : isCurrent
                          ? 'bg-primary border-primary shadow-md shadow-primary/30 ring-4 ring-primary/10'
                          : 'border-muted-foreground/30 bg-background'
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                    )}
                  </motion.div>
                </div>

                {/* Line after dot */}
                {!isLast && (
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    {isCompleted && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6, delay: i * 0.2 + 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-primary"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isCurrent
                    ? 'text-primary'
                    : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
