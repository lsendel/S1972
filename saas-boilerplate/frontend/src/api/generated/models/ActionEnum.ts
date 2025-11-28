/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
export enum ActionEnum {
    USER_LOGIN = 'user.login',
    USER_LOGOUT = 'user.logout',
    USER_REGISTER = 'user.register',
    USER_PASSWORD_CHANGE = 'user.password_change',
    USER_PASSWORD_RESET = 'user.password_reset',
    USER_2FA_ENABLED = 'user.2fa_enabled',
    USER_2FA_DISABLED = 'user.2fa_disabled',
    USER_PROFILE_UPDATE = 'user.profile_update',
    ORG_CREATED = 'org.created',
    ORG_UPDATED = 'org.updated',
    ORG_DELETED = 'org.deleted',
    ORG_MEMBER_INVITED = 'org.member_invited',
    ORG_MEMBER_JOINED = 'org.member_joined',
    ORG_MEMBER_REMOVED = 'org.member_removed',
    ORG_ROLE_CHANGED = 'org.role_changed',
    SUB_CREATED = 'sub.created',
    SUB_UPGRADED = 'sub.upgraded',
    SUB_DOWNGRADED = 'sub.downgraded',
    SUB_CANCELLED = 'sub.cancelled',
    SUB_RENEWED = 'sub.renewed',
    SUB_PAYMENT_FAILED = 'sub.payment_failed',
    ADMIN_USER_IMPERSONATE = 'admin.user_impersonate',
    ADMIN_USER_SUSPEND = 'admin.user_suspend',
    ADMIN_USER_ACTIVATE = 'admin.user_activate',
    ADMIN_DATA_EXPORT = 'admin.data_export',
}
