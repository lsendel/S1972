import React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import client from "@/api/client"

interface OAuthProvider {
  provider: string
  name: string
  connected: boolean
}

interface ConnectedAccount {
  id: string
  provider: string
  provider_name: string
  email?: string
  name?: string
  picture?: string
  avatar_url?: string
  login?: string
  date_joined: string
}

export default function OAuthConnections() {
  const queryClient = useQueryClient()

  const { data: providers, isLoading: providersLoading } = useQuery<{ providers: OAuthProvider[] }>({
    queryKey: ['oauth', 'providers'],
    queryFn: () => client.get('/auth/oauth/providers/'),
  })

  const { data: accounts } = useQuery<{ accounts: ConnectedAccount[] }>({
    queryKey: ['oauth', 'accounts'],
    queryFn: () => client.get('/auth/oauth/accounts/'),
  })

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => client.post(`/auth/oauth/disconnect/${provider}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth', 'providers'] })
      queryClient.invalidateQueries({ queryKey: ['oauth', 'accounts'] })
    },
    onError: (error: any) => {
      alert(error?.error || 'Failed to disconnect account')
    },
  })

  const handleConnect = async (provider: string) => {
    try {
      const response = await client.get<{ authorization_url: string }>(`/auth/oauth/authorize/${provider}/`)
      if (response.authorization_url) {
        // Redirect to OAuth provider
        window.location.href = response.authorization_url
      }
    } catch (error: any) {
      alert(error?.error || 'Failed to initiate OAuth connection')
    }
  }

  const handleDisconnect = (provider: string) => {
    if (window.confirm(`Are you sure you want to disconnect your ${provider} account?`)) {
      disconnectMutation.mutate(provider)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )
      case 'github':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const getConnectedAccount = (provider: string) => {
    return accounts?.accounts.find(acc => acc.provider === provider)
  }

  if (providersLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
        <p className="text-sm text-gray-600 mb-4">
          Link your account with third-party services for easier sign-in.
        </p>

        <div className="space-y-4">
          {providers?.providers?.map((provider) => {
            const connectedAccount = getConnectedAccount(provider.provider)
            const isConnected = provider.connected

            return (
              <div
                key={provider.provider}
                className="flex items-center justify-between p-4 border rounded-lg bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getProviderIcon(provider.provider)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    {isConnected && connectedAccount ? (
                      <div className="text-sm text-gray-600">
                        {connectedAccount.email || connectedAccount.login}
                        {connectedAccount.name && ` (${connectedAccount.name})`}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Not connected</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Connected
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(provider.provider)}
                        disabled={disconnectMutation.isPending}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(provider.provider)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {providers?.providers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No OAuth providers configured. Please add OAuth credentials to your environment variables.
            </div>
          )}
        </div>
      </div>

      {accounts && accounts.accounts.length > 0 && (
        <div className="text-sm text-gray-500 mt-4">
          <p>
            <strong>Note:</strong> You can disconnect OAuth accounts only if you have set a password or have
            another connected account to ensure you can still access your account.
          </p>
        </div>
      )}
    </div>
  )
}
