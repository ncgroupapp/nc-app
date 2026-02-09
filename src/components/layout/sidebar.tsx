"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Package,
  Users,
  FileText,
  Calculator,
  Gavel,
  Truck,
  Ship,
  BarChart3,
  Settings,
  Tag,
} from "lucide-react";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Maestros",
    items: [
      {
        title: "Productos",
        href: "/dashboard/productos",
        icon: Package,
      },
      {
        title: "Proveedores",
        href: "/dashboard/proveedores",
        icon: Users,
      },
      {
        title: "Clientes",
        href: "/dashboard/clientes",
        icon: Users,
      },
      {
        title: "Marcas",
        href: "/dashboard/marcas",
        icon: Tag,
      },
      {
        title: "Ofertas",
        href: "/dashboard/ofertas",
        icon: Tag,
      },
    ],
  },
  {
    title: "Licitaciones",
    items: [
      {
        title: "Licitaciones",
        href: "/dashboard/licitaciones",
        icon: FileText,
      },
      {
        title: "Cotizaciones",
        href: "/dashboard/cotizaciones",
        icon: Calculator,
      },
      {
        title: "Adjudicaciones",
        href: "/dashboard/adjudicaciones",
        icon: Gavel,
      },
      {
        title: "Entregas",
        href: "/dashboard/entregas",
        icon: Truck,
      },
    ],
  },
  {
    title: "Importaciones",
    href: "/dashboard/importaciones",
    icon: Ship,
  },
  {
    title: "PDFs",
    href: "/dashboard/pdf",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Sistema de Licitaciones
          </h2>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => (
              <div key={item.title}>
                {item.href ? (
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href}>
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.title}
                    </Link>
                  </Button>
                ) : (
                  <div className="px-2 py-1">
                    <h3 className="mb-1 px-2 text-sm font-semibold text-muted-foreground">
                      {item.title}
                    </h3>
                    {item.items && (
                      <div className="space-y-1">
                        {item.items.map((subItem) => (
                          <Button
                            key={subItem.href}
                            variant={
                              pathname === subItem.href ? "secondary" : "ghost"
                            }
                            className="w-full justify-start pl-6"
                            asChild
                          >
                            <Link href={subItem.href}>
                              {subItem.icon && (
                                <subItem.icon className="mr-2 h-4 w-4" />
                              )}
                              {subItem.title}
                            </Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarDesktop({ className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn("hidden border-r bg-muted/40 md:block", className)}
      {...props}
    >
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <Sidebar />
      </ScrollArea>
    </aside>
  );
}

export function SidebarMobile({ className, ...props }: SidebarProps) {
  return (
    <aside className={cn("md:hidden", className)} {...props}>
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <Sidebar />
      </ScrollArea>
    </aside>
  );
}
