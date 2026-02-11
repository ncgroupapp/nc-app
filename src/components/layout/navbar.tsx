'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Package,
  Users,
  FileText,
  Calculator,
  Gavel,
  Truck,
  Ship,
  Menu,
  LogOut,
  Settings,
  User
} from 'lucide-react'
import { featureFlags } from '@/lib/feature-flags'

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  {
    name: 'Maestros',
    href: '#',
    icon: Package,
    children: [
      { name: 'Productos', href: '/dashboard/productos', icon: Package },
      { name: 'Proveedores', href: '/dashboard/proveedores', icon: Users },
      { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
    ]
  },
  ...(featureFlags.licitaciones ? [{
    name: 'Licitaciones',
    href: '#',
    icon: Gavel,
    children: [
      { name: 'Todas', href: '/dashboard/licitaciones', icon: FileText },
      { name: 'Cotizaciones', href: '/dashboard/cotizaciones', icon: Calculator },
      { name: 'Adjudicaciones', href: '/dashboard/adjudicaciones', icon: Gavel },
      { name: 'Entregas', href: '/dashboard/entregas', icon: Truck },
    ]
  }] : []),
  ...(featureFlags.importaciones ? [{
    name: 'Importaciones',
    href: '/dashboard/importaciones',
    icon: Ship,
  }] : []),
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('backend_token')
      router.push('/login')
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/80 bg-primary text-primary-foreground backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4">
        <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/dashboard">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                Sistema de Licitaciones
              </span>
            </div>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              {allNavigation.map((item) => (
                <NavigationMenuItem key={item.name}>
                  {item.children ? (
                    <>
                      <NavigationMenuTrigger className="h-9 bg-transparent text-primary-foreground hover:bg-primary-foreground/15 data-[state=open]:bg-primary-foreground/15">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.children.map((child) => (
                            <li key={child.name}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                    pathname === child.href &&
                                      "bg-accent text-accent-foreground"
                                  )} 
                                >
                                  <div className="flex items-center space-x-2">
                                    <child.icon className="h-4 w-4" />
                                    <div className="text-sm font-medium leading-none">
                                      {child.name}
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group inline-flex h-9 w-max items-center bg-transparent px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/15 focus:bg-primary-foreground/15 focus:outline-none disabled:pointer-events-none disabled:opacity-50 mb-4",
                          pathname === item.href &&
                            "bg-primary-foreground/20"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/productos" className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                Productos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/proveedores" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Proveedores
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/clientes" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Clientes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {featureFlags.licitaciones && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/licitaciones"
                    className="flex items-center"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Licitaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/cotizaciones"
                    className="flex items-center"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Cotizaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/adjudicaciones"
                    className="flex items-center"
                  >
                    <Gavel className="mr-2 h-4 w-4" />
                    Adjudicaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/entregas" className="flex items-center">
                    <Truck className="mr-2 h-4 w-4" />
                    Entregas
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {featureFlags.importaciones && (
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/importaciones"
                  className="flex items-center"
                >
                  <Ship className="mr-2 h-4 w-4" />
                  Importaciones
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search bar could go here */}
          </div>
          <nav className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}