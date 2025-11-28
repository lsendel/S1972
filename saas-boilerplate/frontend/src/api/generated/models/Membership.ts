/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleEnum } from './RoleEnum';
export type Membership = {
    readonly id: string;
    readonly user: string;
    readonly user_email: string;
    readonly user_full_name: string;
    readonly user_avatar: string;
    role?: RoleEnum;
    is_active?: boolean;
    readonly created_at: string;
};

