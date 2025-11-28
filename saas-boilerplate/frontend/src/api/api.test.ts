import { describe, it, expect, vi } from 'vitest'
import axios from 'axios'
import './config' // Import for side effects

vi.mock('axios', () => {
    const mockInterceptors = {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
    }
    return {
        default: {
            create: vi.fn(() => ({
                interceptors: mockInterceptors,
                get: vi.fn(),
                post: vi.fn(),
                put: vi.fn(),
                patch: vi.fn(),
                delete: vi.fn(),
            })),
            interceptors: mockInterceptors, // Mock global interceptors too
        },
    }
})

describe('API Client', () => {
    it('configures global axios interceptors', () => {
        expect(axios.interceptors.request.use).toHaveBeenCalled()
        expect(axios.interceptors.response.use).toHaveBeenCalled()
    })
})
