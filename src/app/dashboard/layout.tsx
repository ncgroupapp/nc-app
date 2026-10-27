import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AuthGuard } from '@/components/layout/auth-guard'
import { Separator } from '@/components/ui/separator'
import { ErrorBoundary } from '@/components/common/error-boundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="relative flex h-14 shrink-0 items-center gap-2 bg-white px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium text-brand-navy">
              Sistema de Gestión de Licitaciones
            </span>
            <div className="nc-brand-line absolute inset-x-0 bottom-0 h-0.5" aria-hidden="true" />
          </header>
          <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
