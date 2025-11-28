import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import client from "@/api/client"

interface TwoFactorStatus {
  enabled: boolean
  device: any | null
  backup_codes_remaining: number
}

export default function TwoFactorAuth() {
  const queryClient = useQueryClient()
  const [showSetup, setShowSetup] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const { data: status, isLoading } = useQuery<TwoFactorStatus>({
    queryKey: ['2fa', 'status'],
    queryFn: () => client.get('/auth/2fa/status/'),
  })

  const setupMutation = useMutation({
    mutationFn: () => client.post<{ qr_code: string; secret: string }>('/auth/2fa/setup/', { name: 'Default' }),
    onSuccess: (data) => {
      setQrCode(data.qr_code)
      setSecret(data.secret)
      setShowSetup(true)
    },
    onError: (error: any) => {
      alert(error?.error || 'Failed to set up 2FA')
    },
  })

  const enableMutation = useMutation({
    mutationFn: (token: string) => client.post<{ backup_codes: string[] }>('/auth/2fa/enable/', { token }),
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes)
      setShowBackupCodes(true)
      setShowSetup(false)
      setQrCode(null)
      setSecret(null)
      setVerificationCode("")
      queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] })
    },
    onError: (error: any) => {
      alert(error?.error || 'Failed to enable 2FA')
    },
  })

  const disableMutation = useMutation({
    mutationFn: (password: string) => client.post('/auth/2fa/disable/', { password }),
    onSuccess: () => {
      setDisablePassword("")
      queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] })
      alert('2FA has been successfully disabled')
    },
    onError: (error: any) => {
      alert(error?.error || 'Failed to disable 2FA')
    },
  })

  const regenerateBackupCodesMutation = useMutation({
    mutationFn: (password: string) => client.post<{ backup_codes: string[] }>('/auth/2fa/backup-codes/regenerate/', { password }),
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes)
      setShowBackupCodes(true)
      queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] })
    },
    onError: (error: any) => {
      alert(error?.error || 'Failed to regenerate backup codes')
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

  const handleRegenerateBackupCodes = () => {
    const password = prompt('Enter your password to regenerate backup codes:')
    if (password) {
      regenerateBackupCodesMutation.mutate(password)
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

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>

        {!status?.enabled && !showSetup && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Two-factor authentication is not enabled. Enable it now to secure your account.
            </p>
            <Button onClick={handleSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? 'Setting up...' : 'Enable 2FA'}
            </Button>
          </div>
        )}

        {showSetup && qrCode && (
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Step 1: Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-sm font-medium mb-2">Or enter this code manually:</p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border">{secret}</code>
            </div>

            <h3 className="font-semibold mb-4">Step 2: Verify Code</h3>
            <form onSubmit={handleEnable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Enter 6-digit code from your authenticator app
                </label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                  className="max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={verificationCode.length !== 6 || enableMutation.isPending}>
                  {enableMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSetup(false)
                    setQrCode(null)
                    setSecret(null)
                    setVerificationCode("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {showBackupCodes && backupCodes && (
          <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-300">
            <h3 className="font-semibold mb-2 text-yellow-900">Save Your Backup Codes</h3>
            <p className="text-sm text-yellow-800 mb-4">
              Store these codes in a safe place. Each code can only be used once to access your account if you lose your device.
            </p>
            <div className="bg-white p-4 rounded border mb-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadBackupCodes}>Download Codes</Button>
              <Button variant="outline" onClick={() => setShowBackupCodes(false)}>
                I've Saved My Codes
              </Button>
            </div>
          </div>
        )}

        {status?.enabled && !showSetup && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900">Two-factor authentication is enabled</p>
                <p className="text-sm text-green-700">
                  Your account is protected with 2FA. You have {status.backup_codes_remaining} backup codes remaining.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRegenerateBackupCodes}>
                Regenerate Backup Codes
              </Button>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">
                Disabling 2FA will make your account less secure. Enter your password to confirm.
              </p>
              <form onSubmit={handleDisable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!disablePassword || disableMutation.isPending}
                >
                  {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
