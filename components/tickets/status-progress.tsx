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

const STEP_COLORS: Record<number, { dot: string; line: string; text: string }> = {
  0: {
    dot: 'bg-primary border-primary shadow-primary/30',
    line: 'from-primary to-info',
    text: 'text-primary',
  },
  1: {
    dot: 'bg-info border-info shadow-info/30',
    line: 'from-info to-success',
    text: 'text-info',
  },
  2: {
    dot: 'bg-success border-success shadow-success/30',
    line: '',
    text: 'text-success',
  },
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
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20"
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
        const colors = STEP_COLORS[i]

        return (
          <div key={step.display} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center w-full">
                {/* Line before dot */}
                {i > 0 && (
                  <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                    {(isCompleted || isCurrent) && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6, delay: i * 0.2, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r',
                          STEP_COLORS[i - 1].line
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Dot */}
                <div className="relative shrink-0">
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className={cn(
                        'absolute inset-0 rounded-full',
                        colors.dot.split(' ')[0]
                      )}
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.15, type: 'spring', stiffness: 300 }}
                    className={cn(
                      'relative h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all',
                      isCompleted
                        ? colors.dot
                        : isCurrent
                          ? cn(colors.dot, 'shadow-md ring-4 ring-current/10')
                          : 'border-border bg-background'
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    )}
                  </motion.div>
                </div>

                {/* Line after dot */}
                {!isLast && (
                  <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                    {isCompleted && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6, delay: i * 0.2 + 0.1, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r',
                          colors.line
                        )}
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
                    ? colors.text
                    : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
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
