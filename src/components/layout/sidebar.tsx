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
import { featureFlags } from "@/lib/feature-flags";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
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
  ...(featureFlags.licitaciones ? [{
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
  }] : []),
  ...(featureFlags.importaciones ? [{
    title: "Importaciones",
    href: "/dashboard/importaciones",
    icon: Ship,
  }] : []),
  ...(featureFlags.pdfs ? [{
    title: "PDFs",
    href: "/dashboard/pdf",
    icon: BarChart3,
  }] : []),
  ...(featureFlags.configuracion ? [{
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  }] : []),
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarNavItems.map((item) => (
              <div key={item.title}>
                {item.href ? (
                  <Button
                    variant="ghost"
                    className={cn("w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground")}
                    asChild
                  >
                    <Link href={item.href}>
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.title}
                    </Link>
                  </Button>
                ) : (
                  <div className="px-2 py-1">
                    <h3 className="mb-1 px-2 text-sm font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                      {item.title}
                    </h3>
                    {item.items && (
                      <div className="space-y-1">
                        {item.items.map((subItem) => (
                          <Button
                            key={subItem.href}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start pl-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              pathname === subItem.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
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
      className={cn("hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block", className)}
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
