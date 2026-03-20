'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    setTheme(theme === 'dark' ? 'light' : 'dark')

    requestAnimationFrame(() => {
      setTimeout(() => {
        root.classList.remove('theme-transition')
      }, 300)
    })
  }, [theme, setTheme])

  if (!mounted) return <div className="h-8 w-8" />

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Alternar tema"
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className="h-8 w-8 rounded-lg"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
