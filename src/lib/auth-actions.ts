'use server'

import { cookies } from 'next/headers'

export async function setAuthToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('backend_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Expira en 7 días o según lo que defina el backend
    maxAge: 60 * 60 * 24 * 7 
  })
}

export async function removeAuthToken() {
  const cookieStore = await cookies()
  cookieStore.delete('backend_token')
}

export async function getAuthToken() {
  const cookieStore = await cookies()
  return cookieStore.get('backend_token')?.value
}
