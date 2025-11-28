/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for user sessions.
 */
export type UserSession = {
    readonly id: string;
    readonly user: string;
    readonly user_email: string;
    readonly ip_address: string | null;
    readonly started_at: string;
    readonly last_activity: string;
    readonly ended_at: string | null;
    readonly is_active: boolean;
    readonly duration_seconds: string;
};

