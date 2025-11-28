import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  variant: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((
    message: string,
    variant: Toast['variant'] = 'default',
    duration: number = 5000
  ) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, variant, duration }

    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'default', duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
