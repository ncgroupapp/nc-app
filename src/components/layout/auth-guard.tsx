"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import { isTokenExpired } from "@/lib/utils"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const backendToken = localStorage.getItem('backend_token')
      const tokenExpired = backendToken ? isTokenExpired(backendToken) : true

      if (user && backendToken && !tokenExpired) {
        setAuthenticated(true)
        setLoading(false)
      } else {
        setAuthenticated(false)
        setLoading(false)
        if (backendToken && tokenExpired) {
           localStorage.removeItem('backend_token')
        }
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!authenticated) {
    return null // O podrías retornar un fragmento vacío mientras redirige
  }

  return <>{children}</>
}
