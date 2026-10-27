"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { loginSchema } from "@/lib/validations/schema"
import api from "@/lib/axios"
import { isTokenExpired, getClientCookie } from "@/lib/utils"
import { setAuthToken } from "@/lib/auth-actions"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AlertCircle, Eye, EyeOff, FileText, Loader2, Package, PenLine } from "lucide-react";

const LOGIN_FEATURES = [
  { icon: FileText, label: "Licitaciones, cotizaciones y adjudicaciones" },
  { icon: Package, label: "Inventario de repuestos, stock y proveedores" },
  { icon: PenLine, label: "Documentos oficiales con firma autorizada" },
] as const

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Solo redirigir si hay usuario Y hay token del backend Y NO ha expirado
      const backendToken = getClientCookie('backend_token')
      if (user && backendToken && !isTokenExpired(backendToken)) {
        router.push("/dashboard")
      }
    })
    return () => unsubscribe()
  }, [router])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Login en Firebase
      await signInWithEmailAndPassword(auth, data.email, data.password)

      // 2. Login en Backend para obtener JWT
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      })

      // 3. Guardar token
      if (response.data && response.data.data.access_token) {
        const token = response.data.data.access_token
        await setAuthToken(token)
      } else {
        throw new Error("No se recibió el token de acceso del servidor")
      }

      router.push("/dashboard")
      router.refresh()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
      let message = "Ocurrió un error al iniciar sesión."

      if (err.response) {
        // Error de Axios/Backend
        message = err.response.data?.message || "Error al conectar con el servidor de autenticación."
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        message = "Credenciales incorrectas."
      } else if (err.code === "auth/too-many-requests") {
        message = "Demasiados intentos fallidos. Intente de nuevo más tarde."
      } else if (err.message === "No se recibió el token de acceso del servidor") {
        message = "Error de comunicación con el backend."
      }

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main id="main-content" className="flex min-h-screen w-full bg-white" tabIndex={-1}>
      <section
        className="nc-login-hero relative hidden lg:flex lg:w-[56%] flex-col overflow-hidden px-16 py-14 text-white"
        aria-hidden="true"
      >
        <div className="nc-login-dots absolute inset-0" />
        <div className="nc-login-ring nc-login-ring-1" />
        <div className="nc-login-ring nc-login-ring-2" />
        <div className="nc-login-ring nc-login-ring-3" />
        <div className="nc-login-ring nc-login-ring-4" />
        <div className="nc-login-lines absolute right-16 bottom-36 flex flex-col items-end gap-2">
          <i className="w-28" />
          <i className="w-20" />
          <i className="w-11" />
        </div>

        <div className="relative z-10">
          <div className="nc-login-logo inline-flex">
            <Image
              src="/logo/logo-blanco.png"
              alt="NC Group SAS"
              width={429}
              height={338}
              priority
              className="h-[min(338px,36vh)] w-auto -ml-6 mt-[min(70px,6vh)] object-contain"
            />
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <h2 className="nc-login-fade max-w-xl text-4xl font-extrabold leading-tight tracking-tight [animation-delay:.5s]">
            Sistema de Gestión de Licitaciones
          </h2>
          <div className="nc-login-rule my-6 h-[3px] w-16 rounded-full" />
          <ul className="flex flex-col gap-3.5 text-[15px] text-slate-300">
            {LOGIN_FEATURES.map((feature, index) => (
              <li
                key={feature.label}
                className="nc-login-fade flex items-center gap-3.5"
                style={{ animationDelay: `${0.85 + index * 0.15}s` }}
              >
                <span className="grid size-10 place-items-center rounded-lg border border-white/15 bg-white/5">
                  <feature.icon className="size-[18px] text-brand-cyan" />
                </span>
                {feature.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="nc-login-fade relative z-10 mt-12 flex justify-between border-t border-white/10 pt-5 text-xs text-slate-400 [animation-delay:1.3s]">
          <span>Pinamar, Canelones · Uruguay</span>
          <span>ncgroup@ncgroup.com.uy</span>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center p-6">
      <Card className="nc-login-form nc-login-fade w-full max-w-sm border-0 shadow-none [animation-delay:.3s]">
        <CardHeader className="space-y-2 px-0">
          <div className="mb-4 flex justify-center lg:hidden">
            <Image
              src="/logo/logo.png"
              alt="NC Group SAS"
              width={120}
              height={95}
              priority
              className="object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-brand-navy">Bienvenido</CardTitle>
          <CardDescription className="text-[15px]">
            Ingresá con tu cuenta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-xl"
                        placeholder="tu@email.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input className="h-12 rounded-xl"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-navy text-[15px] font-bold shadow-lg shadow-brand-blue/30 hover:opacity-95"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ingresar
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center px-0">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} NC GROUP SAS · Sistema de Gestión de Licitaciones
          </p>
        </CardFooter>
      </Card>
      </section>
    </main>
  )
}