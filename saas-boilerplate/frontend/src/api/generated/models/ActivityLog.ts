/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionEnum } from './ActionEnum';
/**
 * Serializer for activity logs.
 */
export type ActivityLog = {
    readonly id: string;
    readonly user: string | null;
    readonly user_email: string;
    readonly user_name: string;
    readonly action: ActionEnum;
    readonly action_display: string;
    readonly description: string;
    readonly ip_address: string | null;
    readonly metadata: any;
    readonly created_at: string;
};

