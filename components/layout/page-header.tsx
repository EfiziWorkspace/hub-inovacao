import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  gradient?: 'primary' | 'info' | 'success' | 'warning'
  children?: React.ReactNode
}

const GRADIENTS = {
  primary: 'from-primary/12 via-primary/5 to-transparent',
  info: 'from-info/12 via-info/5 to-transparent',
  success: 'from-success/12 via-success/5 to-transparent',
  warning: 'from-warning/12 via-warning/5 to-transparent',
}

const ORB_COLORS = {
  primary: 'bg-primary/5',
  info: 'bg-info/5',
  success: 'bg-success/5',
  warning: 'bg-warning/5',
}

export function PageHeader({ title, description, gradient = 'primary', children }: PageHeaderProps) {
  return (
    <div className={cn(
      'relative overflow-hidden -mx-6 lg:-mx-8 -mt-6 px-6 lg:px-8 pt-6 pb-6 mb-2 bg-gradient-to-b',
      GRADIENTS[gradient]
    )}>
      {/* Decorative gradient orb */}
      <div className={cn(
        'absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none',
        ORB_COLORS[gradient]
      )} />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
