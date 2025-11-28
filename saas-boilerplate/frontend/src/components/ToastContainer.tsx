import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '@/hooks/useToast'
import { Toast } from './ui/toast'

interface ToastContextType {
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, success, error, warning, info, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
      {children}

      {/* Toast Container */}
      <div
        aria-live="assertive"
        className="fixed inset-0 z-50 flex flex-col items-end justify-end px-4 py-6 pointer-events-none sm:p-6 gap-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-in slide-in-from-right-full fade-in duration-300"
          >
            <Toast
              variant={toast.variant}
              onClose={() => removeToast(toast.id)}
            >
              {toast.message}
            </Toast>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
