import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'

describe('useToast Hook', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('adds a toast', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.addToast('Test message')
        })

        expect(result.current.toasts).toHaveLength(1)
        expect(result.current.toasts[0].message).toBe('Test message')
        expect(result.current.toasts[0].variant).toBe('default')
    })

    it('removes a toast', () => {
        const { result } = renderHook(() => useToast())

        let id: string
        act(() => {
            id = result.current.addToast('Test message')
        })

        expect(result.current.toasts).toHaveLength(1)

        act(() => {
            result.current.removeToast(id)
        })

        expect(result.current.toasts).toHaveLength(0)
    })

    it('auto-removes toast after duration', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.addToast('Test message', 'default', 1000)
        })

        expect(result.current.toasts).toHaveLength(1)

        act(() => {
            vi.advanceTimersByTime(1000)
        })

        expect(result.current.toasts).toHaveLength(0)
    })

    it('adds success toast', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.success('Success message')
        })

        expect(result.current.toasts[0].variant).toBe('success')
    })

    it('adds error toast', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.error('Error message')
        })

        expect(result.current.toasts[0].variant).toBe('error')
    })
})
