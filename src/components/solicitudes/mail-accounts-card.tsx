'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Mail, Plug, RefreshCw, Unplug } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { showSnackbar } from '@/components/ui/snackbar'
import { useConfirm } from '@/hooks/use-confirm'
import { handleActionError } from '@/lib/error-handler'
import { MailAccount, formatDateTime, solicitudesService } from '@/services/solicitudes.service'

interface MailAccountsCardProps {
  onSynced: () => void
}

export function MailAccountsCard({ onSynced }: MailAccountsCardProps) {
  const { confirm } = useConfirm()
  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [configured, setConfigured] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | 'connect' | null>(null)
  const [email, setEmail] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await solicitudesService.getMailAccounts()
      setAccounts(result.accounts)
      setConfigured(result.configured)
    } catch (error) {
      handleActionError(error, 'No se pudieron cargar las casillas conectadas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleConnect = async (hint?: string) => {
    setBusyId('connect')
    try {
      window.location.href = await solicitudesService.getConnectUrl(hint || email.trim() || undefined)
    } catch (error) {
      handleActionError(error, 'No se pudo iniciar la conexión con Google')
      setBusyId(null)
    }
  }

  const handleSync = async (account: MailAccount) => {
    setBusyId(account.id)
    try {
      const result = await solicitudesService.syncNow(account.id)
      showSnackbar(
        result.imported || result.updated
          ? `${result.imported} solicitudes nuevas, ${result.updated} actualizadas`
          : 'No hay mails nuevos con la etiqueta',
        'success',
      )
      onSynced()
    } catch (error) {
      handleActionError(error, 'No se pudo revisar la casilla')
    } finally {
      setBusyId(null)
      load()
    }
  }

  const handleDisconnect = async (account: MailAccount) => {
    const confirmed = await confirm({
      title: 'Desconectar casilla',
      message: `Se revoca el permiso de la app sobre ${account.email} y deja de revisarse. Las solicitudes ya cargadas se mantienen.`,
      variant: 'destructive',
    })
    if (!confirmed) return
    setBusyId(account.id)
    try {
      await solicitudesService.disconnect(account.id)
      showSnackbar('Casilla desconectada', 'success')
    } catch (error) {
      handleActionError(error, 'No se pudo desconectar la casilla')
    } finally {
      setBusyId(null)
      load()
    }
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-base text-brand-navy">
          <Mail className="h-4 w-4" /> Casillas de correo
        </CardTitle>
        <CardDescription>
          Se cargan como solicitudes los mails con la etiqueta <b>Solicitudes</b>. La app solo tiene permiso de lectura y
          revisa la casilla cada 2 minutos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Falta configurar la conexión con Google en el servidor (credenciales OAuth). Hasta entonces no se puede conectar
            una casilla.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : (
          accounts.map((account) => {
            const connected = account.active && !account.needsReconnect
            return (
              <div key={account.id} className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-semibold text-brand-navy">
                    {connected ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="truncate">{account.email}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {!account.active
                      ? 'Desconectada'
                      : account.needsReconnect
                        ? 'El permiso venció o fue revocado: volvé a conectarla'
                        : account.lastSyncAt
                          ? `Revisada ${formatDateTime(account.lastSyncAt)}`
                          : 'Conectada, esperando la primera revisión'}
                  </p>
                  {account.lastError && connected && (
                    <p className="mt-1 text-xs text-red-600">Último error: {account.lastError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {connected ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleSync(account)} disabled={busyId !== null}>
                        {busyId === account.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                        Revisar ahora
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDisconnect(account)} disabled={busyId !== null}>
                        <Unplug className="mr-1.5 h-4 w-4" /> Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(account.email)} disabled={!configured || busyId !== null}>
                      <Plug className="mr-1.5 h-4 w-4" /> Volver a conectar
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-dashed p-3 md:flex-row md:items-center">
          <Input
            type="email"
            placeholder="Casilla a conectar (ej: ncgroup@ncgroup.com.uy)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="md:max-w-sm"
          />
          <Button onClick={() => handleConnect()} disabled={!configured || busyId !== null}>
            {busyId === 'connect' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plug className="mr-1.5 h-4 w-4" />}
            Conectar con Google
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
