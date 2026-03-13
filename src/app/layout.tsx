import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de Licitaciones",
  description: "Sistema integral para la gestión de licitaciones y administración de proveedores",
  keywords: ["licitaciones", "gestión", "proveedores", "compras", "sistema"],
  authors: [{ name: "Corna App Team" }],
  icons: {
    icon: "/logo/logo.png",
  },
  openGraph: {
    title: "Sistema de Gestión de Licitaciones",
    description: "Sistema integral para la gestión de licitaciones",
    url: "https://nc-app-kappa.vercel.app",
    siteName: "Corna App",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Gestión de Licitaciones",
    description: "Sistema integral para la gestión de licitaciones",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Saltar al contenido principal
        </a>
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
        <Toaster />
        <ConfirmDialog />
      </body>
    </html>
  );
}
