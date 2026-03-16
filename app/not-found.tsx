import Link from 'next/link'
import { Lightbulb, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-up">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <Lightbulb className="h-12 w-12 text-primary animate-float-slow" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Página não encontrada
        </h1>

        <p className="text-muted-foreground text-base mb-8 max-w-sm">
          Parece que essa ideia ainda não existe. Que tal voltar e criar uma?
        </p>

        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/app">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
