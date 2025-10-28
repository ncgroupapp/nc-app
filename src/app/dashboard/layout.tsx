import { Navbar } from '@/components/layout/navbar'
import { SidebarDesktop } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarDesktop className="hidden w-64 md:block" />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}