import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/api/config"
import { useToast } from "@/hooks/useToast"
import { CheckCircle, AlertTriangle, Download, Copy, RefreshCw, ShieldCheck, X } from "lucide-react"
import type { TOTPDevice, ApiError } from "@/api/generated"

interface TwoFactorStatus {
  enabled: boolean
  device: TOTPDevice | null
  backup_codes_remaining: number
}

interface SetupResponse {
  device: TOTPDevice
  qr_code: string
  secret: string
}

interface EnableResponse {
  message: string
  backup_codes: string[]
  warning: string
}

interface RegenerateResponse {
  message: string
  backup_codes: string[]
  warning: string
}

export default function TwoFactorAuth() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [showSetup, setShowSetup] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  // State for regenerating backup codes
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [regeneratePassword, setRegeneratePassword] = useState("")

  const { data: status, isLoading } = useQuery<TwoFactorStatus>({
    queryKey: ['2fa', 'status'],
    queryFn: async () => {
      const response = await api.auth.auth2FaStatusRetrieve()
      return response as unknown as TwoFactorStatus
    },
  })

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await api.auth.auth2FaSetupCreate({ requestBody: { name: 'Default Device' } })
      return response as unknown as SetupResponse
    },
    onSuccess: (data) => {
      setQrCode(data.qr_code)
      setSecret(data.secret)
      setShowSetup(true)
    },
    onError: (err: ApiError) => {
      const body = err.body as { error?: string }
      error(body?.error ?? 'Failed to set up 2FA')
    },
  })

  const enableMutation = useMutation({
    mutationFn: async (token: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await api.auth.auth2FaEnableCreate({ requestBody: { token } })
      return response as unknown as EnableResponse
    },
    onSuccess: async (data) => {
      setBackupCodes(data.backup_codes)
      setShowBackupCodes(true)
      setShowSetup(false)
      setQrCode(null)
      setSecret(null)
      setVerificationCode("")
      await queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] })
      success("Two-factor authentication has been enabled successfully.")
    },
    onError: (err: ApiError) => {
      const body = err.body as { error?: string }
      error(body?.error ?? 'Failed to enable 2FA')
    },
  })

  const disableMutation = useMutation({
    mutationFn: (password: string) => api.auth.auth2FaDisableCreate({ requestBody: { password } }),
    onSuccess: async () => {
      setDisablePassword("")
      await queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] })
      success("Two-factor authentication has been disabled.")
    },
    onError: (err: ApiError) => {
      const body = err.body as { error?: string }
      error(body?.error ?? 'Failed to disable 2FA')
    },
  })

  const regenerateBackupCodesMutation = useMutation({
    mutationFn: (password: string) => api.auth.auth2FaBackupCodesRegenerateCreate({ requestBody: { password } }),
    onSuccess: async (data) => {
      const response = data as unknown as RegenerateResponse
      setBackupCodes(response.backup_codes)
      setShowBackupCodes(true)
      setShowRegenerateConfirm(false)
      setRegeneratePassword("")
      await queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] })
      success("New backup codes have been generated.")
    },
    onError: (err: ApiError) => {
      const body = err.body as { error?: string }
      error(body?.error ?? 'Failed to regenerate backup codes')
    },
  })

  const handleSetup = () => {
    setupMutation.mutate()
  }

  const handleEnable = (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.length === 6) {
      enableMutation.mutate(verificationCode)
    }
  }

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault()
    if (disablePassword) {
      disableMutation.mutate(disablePassword)
    }
  }

  const handleRegenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (regeneratePassword) {
      regenerateBackupCodesMutation.mutate(regeneratePassword)
    }
  }

  const downloadBackupCodes = () => {
    if (!backupCodes) return

    const text = backupCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '2fa-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyBackupCodes = () => {
    if (!backupCodes) return
    navigator.clipboard.writeText(backupCodes.join('\n'))
      .then(() => success("Backup codes copied to clipboard"))
      .catch(() => error("Failed to copy codes"))
  }

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading security settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>

        {!status?.enabled && !showSetup && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 mb-4">
              Two-factor authentication is not enabled. Enable it now to secure your account.
            </p>
            <Button onClick={handleSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? 'Setting up...' : 'Enable 2FA'}
            </Button>
          </div>
        )}

        {showSetup && qrCode && (
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold">Step 1: Scan QR Code</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSetup(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center mb-4 bg-white p-2 rounded border w-fit mx-auto">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="bg-gray-50 p-4 rounded mb-6 text-center">
              <p className="text-sm font-medium mb-2">Or enter this code manually:</p>
              <code className="text-sm font-mono bg-white px-3 py-1 rounded border select-all">{secret}</code>
            </div>

            <h3 className="font-semibold mb-4">Step 2: Verify Code</h3>
            <form onSubmit={handleEnable} className="space-y-4 max-w-sm mx-auto">
              <div>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">Enter the 6-digit code from your app</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button type="submit" disabled={verificationCode.length !== 6 || enableMutation.isPending} className="w-full">
                  {enableMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {showBackupCodes && backupCodes && (
          <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Save Your Backup Codes</h3>
                <p className="text-sm text-yellow-800">
                  Store these codes in a safe place. Each code can only be used once to access your account if you lose your device.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-yellow-200 mb-4 shadow-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm text-center">
                {backupCodes.map((code, index) => (
                  <div key={index} className="py-1 px-2 bg-gray-50 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadBackupCodes} className="gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={copyBackupCodes} className="gap-2 bg-white">
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="ghost" onClick={() => setShowBackupCodes(false)} className="ml-auto">
                I've Saved My Codes
              </Button>
            </div>
          </div>
        )}

        {status?.enabled && !showSetup && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900">Two-factor authentication is enabled</p>
                <p className="text-sm text-green-700">
                  Your account is protected with 2FA. You have {status.backup_codes_remaining} backup codes remaining.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Regenerate Backup Codes
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                If you've lost your backup codes or used most of them, you can generate a new set.
              </p>

              {!showRegenerateConfirm ? (
                <Button variant="outline" onClick={() => setShowRegenerateConfirm(true)}>
                  Regenerate Codes
                </Button>
              ) : (
                <form onSubmit={handleRegenerateSubmit} className="bg-gray-50 p-4 rounded-lg border max-w-md">
                  <p className="text-sm font-medium mb-3">Confirm with your password</p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={regeneratePassword}
                      onChange={(e) => setRegeneratePassword(e.target.value)}
                      placeholder="Current Password"
                      className="bg-white"
                    />
                    <Button type="submit" disabled={!regeneratePassword || regenerateBackupCodesMutation.isPending}>
                      {regenerateBackupCodesMutation.isPending ? '...' : 'Confirm'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => {
                      setShowRegenerateConfirm(false)
                      setRegeneratePassword("")
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="border rounded-lg p-6 border-red-100">
              <h3 className="font-semibold mb-4 text-red-900">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">
                Disabling 2FA will make your account less secure. Enter your password to confirm.
              </p>
              <form onSubmit={handleDisable} className="space-y-4 max-w-md">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Current Password"
                  />
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={!disablePassword || disableMutation.isPending}
                  >
                    {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
