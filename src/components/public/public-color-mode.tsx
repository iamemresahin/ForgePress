'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PublicColorMode = 'dark' | 'light'

type PublicColorModeContextValue = {
  mode: PublicColorMode
  setMode: (mode: PublicColorMode) => void
  toggleMode: () => void
}

const STORAGE_KEY = 'forgepress:public-color-mode'

const PublicColorModeContext = createContext<PublicColorModeContextValue | null>(null)

function getStoredMode(): PublicColorMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'dark'
}

export function PublicThemeShell({
  as: Component = 'main',
  className,
  style,
  children,
}: {
  as?: ElementType
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const [mode, setMode] = useState<PublicColorMode>('dark')

  useEffect(() => {
    const nextMode = getStoredMode()
    setMode(nextMode)
    document.documentElement.dataset.publicMode = nextMode
  }, [])

  useEffect(() => {
    document.documentElement.dataset.publicMode = mode
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  )

  return (
    <PublicColorModeContext.Provider value={value}>
      <Component data-public-mode={mode} className={cn('public-theme-shell', className)} style={style}>
        {children}
      </Component>
    </PublicColorModeContext.Provider>
  )
}

export function usePublicColorMode() {
  const context = useContext(PublicColorModeContext)

  if (!context) {
    throw new Error('usePublicColorMode must be used inside PublicThemeShell.')
  }

  return context
}
