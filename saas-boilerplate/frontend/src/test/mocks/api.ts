import { vi } from 'vitest'


export const mockApi = {
    auth: {
        authMeRetrieve: vi.fn(),
        authLoginCreate: vi.fn(),
        authSignupCreate: vi.fn(),
        authLogoutCreate: vi.fn(),
        authMePartialUpdate: vi.fn(),
        authPasswordChangeCreate: vi.fn(),
        authPasswordResetCreate: vi.fn(),
        authPasswordResetConfirmCreate: vi.fn(),
        authEmailVerifyCreate: vi.fn(),
        authCsrfRetrieve: vi.fn(),
    },
    organizations: {
        organizationsList: vi.fn(),
        organizationsRetrieve: vi.fn(),
        organizationsCreate: vi.fn(),
        organizationsMembersList: vi.fn(),
        organizationsInvitationsList: vi.fn(),
        organizationsMembersInviteCreate: vi.fn(),
    },
    subscriptions: {
        subscriptionsCurrentRetrieve: vi.fn(),
        subscriptionsPlansRetrieve: vi.fn(),
    },
    analytics: {
        adminAnalyticsDashboardRetrieve: vi.fn(),
        adminAnalyticsTimeSeriesRetrieve: vi.fn(),
        adminActivityLogsList: vi.fn(),
    }
}
