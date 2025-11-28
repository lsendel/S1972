/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityLog } from '../models/ActivityLog';
import type { DashboardStats } from '../models/DashboardStats';
import type { PaginatedActivityLogList } from '../models/PaginatedActivityLogList';
import type { PaginatedUserSessionList } from '../models/PaginatedUserSessionList';
import type { UserSession } from '../models/UserSession';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AnalyticsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List activity logs
     * Retrieve a paginated list of activity logs with filtering and search capabilities.
     * @returns PaginatedActivityLogList
     * @throws ApiError
     */
    public adminActivityLogsList({
        action,
        ordering,
        page,
        pageSize,
        search,
        user,
    }: {
        /**
         * * `user.login` - User Login
         * * `user.logout` - User Logout
         * * `user.register` - User Registration
         * * `user.password_change` - Password Changed
         * * `user.password_reset` - Password Reset
         * * `user.2fa_enabled` - 2FA Enabled
         * * `user.2fa_disabled` - 2FA Disabled
         * * `user.profile_update` - Profile Updated
         * * `org.created` - Organization Created
         * * `org.updated` - Organization Updated
         * * `org.deleted` - Organization Deleted
         * * `org.member_invited` - Member Invited
         * * `org.member_joined` - Member Joined
         * * `org.member_removed` - Member Removed
         * * `org.role_changed` - Member Role Changed
         * * `sub.created` - Subscription Created
         * * `sub.upgraded` - Subscription Upgraded
         * * `sub.downgraded` - Subscription Downgraded
         * * `sub.cancelled` - Subscription Cancelled
         * * `sub.renewed` - Subscription Renewed
         * * `sub.payment_failed` - Payment Failed
         * * `admin.user_impersonate` - User Impersonated
         * * `admin.user_suspend` - User Suspended
         * * `admin.user_activate` - User Activated
         * * `admin.data_export` - Data Exported
         */
        action?: 'admin.data_export' | 'admin.user_activate' | 'admin.user_impersonate' | 'admin.user_suspend' | 'org.created' | 'org.deleted' | 'org.member_invited' | 'org.member_joined' | 'org.member_removed' | 'org.role_changed' | 'org.updated' | 'sub.cancelled' | 'sub.created' | 'sub.downgraded' | 'sub.payment_failed' | 'sub.renewed' | 'sub.upgraded' | 'user.2fa_disabled' | 'user.2fa_enabled' | 'user.login' | 'user.logout' | 'user.password_change' | 'user.password_reset' | 'user.profile_update' | 'user.register',
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        user?: string,
    }): CancelablePromise<PaginatedActivityLogList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/activity-logs/',
            query: {
                'action': action,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'user': user,
            },
        });
    }
    /**
     * Get activity log details
     * Retrieve detailed information about a specific activity log entry.
     * @returns ActivityLog
     * @throws ApiError
     */
    public adminActivityLogsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this activity log.
         */
        id: string,
    }): CancelablePromise<ActivityLog> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/activity-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Aggregate daily metrics
     * Manually trigger aggregation of daily metrics. Normally runs automatically via Celery.
     * @returns any No response body
     * @throws ApiError
     */
    public adminAnalyticsAggregateCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/admin/analytics/aggregate/',
        });
    }
    /**
     * Get dashboard statistics
     * Retrieve key metrics for the admin dashboard including users, organizations, subscriptions, and revenue.
     * @returns DashboardStats
     * @throws ApiError
     */
    public adminAnalyticsDashboardRetrieve(): CancelablePromise<DashboardStats> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/analytics/dashboard/',
        });
    }
    /**
     * Get time series data
     * Retrieve time series data for a specific metric over a specified number of days.
     * @returns any No response body
     * @throws ApiError
     */
    public adminAnalyticsTimeSeriesRetrieve({
        metricType,
        days,
    }: {
        /**
         * Type of metric (e.g., users.new, revenue.mrr)
         */
        metricType: string,
        /**
         * Number of days of data (default: 30)
         */
        days?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/analytics/time_series/',
            query: {
                'days': days,
                'metric_type': metricType,
            },
        });
    }
    /**
     * List user sessions
     * Retrieve a paginated list of user sessions.
     * @returns PaginatedUserSessionList
     * @throws ApiError
     */
    public adminSessionsList({
        isActive,
        ordering,
        page,
        pageSize,
        search,
        user,
    }: {
        isActive?: boolean,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        user?: string,
    }): CancelablePromise<PaginatedUserSessionList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/sessions/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'user': user,
            },
        });
    }
    /**
     * Get active sessions
     * Retrieve currently active user sessions.
     * @returns UserSession
     * @throws ApiError
     */
    public adminSessionsActiveRetrieve(): CancelablePromise<UserSession> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/sessions/active/',
        });
    }
}
