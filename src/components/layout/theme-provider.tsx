'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/** Light/dark mode via the "dark" class on <html>; the choice is remembered in the browser. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
