"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { removeClientCookie } from "@/lib/utils";
import { removeAuthToken } from "@/lib/auth-actions";
import { BookOpen, Calculator, ChevronDown, ChevronUp, FileText, Gavel, Home, LogOut, Package, Settings, Ship, Tag, Truck, User, Users } from "lucide-react";
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
        title: "Manuales",
        href: "/dashboard/manuales",
        icon: BookOpen,
      },
    ]
    : []),
];

// Active item: navy pill with a cyan marker on the left edge (brand colors)
const ACTIVE_ITEM_CLASS =
  "relative font-medium data-[active=true]:bg-brand-navy data-[active=true]:text-white data-[active=true]:hover:bg-brand-navy data-[active=true]:hover:text-white data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r data-[active=true]:before:bg-brand-cyan";

// "/dashboard" only matches itself; other sections also match their sub-pages (e.g. a product detail)
function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      removeClientCookie("backend_token");
      await removeAuthToken();
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
            <SidebarMenuButton size="lg" asChild className="h-14 hover:bg-transparent">
              <Link href="/dashboard">
                <div className="flex aspect-square size-11 shrink-0 items-center justify-center">
                  <Image
                    src="/logo/logo.png"
                    alt="NC Group SAS"
                    width={56}
                    height={44}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold tracking-wide text-brand-navy">NC GROUP</span>
                  <span className="text-xs text-muted-foreground">
                    Gestión de Licitaciones
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
                    isActive={isActivePath(pathname, item.href!)}
                    tooltip={item.title}
                    className={ACTIVE_ITEM_CLASS}
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
                          isActive={isActivePath(pathname, subItem.href)}
                          tooltip={subItem.title}
                          className={ACTIVE_ITEM_CLASS}
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
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-navy text-white">
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