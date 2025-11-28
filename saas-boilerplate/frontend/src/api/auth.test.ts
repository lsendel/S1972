import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from './auth'
import { api } from './config'

vi.mock('./config', () => ({
    api: {
        auth: {
            authLoginCreate: vi.fn(),
            authSignupCreate: vi.fn(),
            authLogoutCreate: vi.fn(),
            authMeRetrieve: vi.fn(),
            authEmailVerifyCreate: vi.fn(),
            authPasswordResetCreate: vi.fn(),
            authPasswordResetConfirmCreate: vi.fn(),
            authCsrfRetrieve: vi.fn(),
        }
    }
}))

describe('Auth API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('login calls correct endpoint', async () => {
        const credentials = { email: 'test@example.com', password: 'password' }
        await auth.login(credentials)
        expect(api.auth.authLoginCreate).toHaveBeenCalledWith({ requestBody: credentials })
    })

    it('register calls correct endpoint', async () => {
        const userData = { email: 'test@example.com', password: 'password', full_name: 'Test User' }
        await auth.signup(userData)
        expect(api.auth.authSignupCreate).toHaveBeenCalledWith({ requestBody: userData })
    })

    it('logout calls correct endpoint', async () => {
        await auth.logout()
        expect(api.auth.authLogoutCreate).toHaveBeenCalled()
    })

    it('resetPassword calls correct endpoint', async () => {
        await auth.resetPassword('test@example.com')
        expect(api.auth.authPasswordResetCreate).toHaveBeenCalledWith({ requestBody: { email: 'test@example.com' } })
    })

    it('resetPasswordConfirm calls correct endpoint', async () => {
        const data = { uid: 'uid', token: 'token', new_password: 'password', re_new_password: 'password' }
        await auth.confirmPasswordReset(data)
        expect(api.auth.authPasswordResetConfirmCreate).toHaveBeenCalledWith({ requestBody: data })
    })
})
