interface PageHeaderProps {
  title: string
  description?: string
  gradient?: 'primary' | 'info' | 'success' | 'warning'
  children?: React.ReactNode
}

const GRADIENTS = {
  primary: 'from-primary/8 via-primary/3 to-transparent',
  info: 'from-info/8 via-info/3 to-transparent',
  success: 'from-success/8 via-success/3 to-transparent',
  warning: 'from-warning/8 via-warning/3 to-transparent',
}

export function PageHeader({ title, description, gradient = 'primary', children }: PageHeaderProps) {
  return (
    <div className={`relative -mx-6 lg:-mx-8 -mt-6 px-6 lg:px-8 pt-6 pb-6 mb-2 bg-gradient-to-b ${GRADIENTS[gradient]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
