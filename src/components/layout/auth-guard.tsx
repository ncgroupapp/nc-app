"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react";
import { isTokenExpired, getClientCookie, removeClientCookie } from "@/lib/utils"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {

    const checkAuth = (user: any) => {
      const backendToken = getClientCookie('backend_token')
      const tokenExpired = backendToken ? isTokenExpired(backendToken) : true

      if (user && backendToken && !tokenExpired) {
        setAuthenticated(true)
        setLoading(false)
      } else {
        setAuthenticated(false)
        setLoading(false)
        if (backendToken && tokenExpired) {
           removeClientCookie('backend_token')
        }
        if (pathname !== '/login') {
          router.push("/login")
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkAuth(user)
    })

    if (!loading) {
      checkAuth(auth.currentUser)
    }

    return () => unsubscribe()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}