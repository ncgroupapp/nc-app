"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ChevronDown, ChevronUp, Package, User, LogOut } from "lucide-react";
import {
  Home,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  href?: string;
  icon?: LucideIcon;
  items?: { title: string; href: string; icon?: LucideIcon }[];
}

const sidebarNavItems: NavItem[] = [
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
  ...(featureFlags.licitaciones
    ? [
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
      ]
    : []),
  ...(featureFlags.importaciones
    ? [
        {
          title: "Importaciones",
          href: "/dashboard/importaciones",
          icon: Ship,
        },
      ]
    : []),
  ...(featureFlags.pdfs
    ? [
        {
          title: "PDFs",
          href: "/dashboard/pdf",
          icon: BarChart3,
        },
      ]
    : []),
  ...(featureFlags.configuracion
    ? [
        {
          title: "Configuración",
          href: "/dashboard/configuracion",
          icon: Settings,
        },
      ]
    : []),
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("backend_token");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Split items into flat links and grouped sections
  const flatItems = sidebarNavItems.filter((item) => item.href);
  const groupedItems = sidebarNavItems.filter(
    (item) => !item.href && item.items
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Licitaciones</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    Sistema de Gestión
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main navigation items */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {flatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href!}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grouped sections (e.g. Licitaciones) */}
        {groupedItems.map((group) => (
          <Collapsible
            key={group.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  {group.title}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items?.map((subItem) => (
                      <SidebarMenuItem key={subItem.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === subItem.href}
                          tooltip={subItem.title}
                        >
                          <Link href={subItem.href}>
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      {/* User section at the bottom */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary/20">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      Administrador
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
