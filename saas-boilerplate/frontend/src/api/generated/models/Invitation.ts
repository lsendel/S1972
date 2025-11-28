/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleEnum } from './RoleEnum';
import type { StatusEnum } from './StatusEnum';
export type Invitation = {
    readonly id: string;
    email: string;
    role?: RoleEnum;
    readonly status: StatusEnum;
    readonly created_at: string;
    readonly expires_at: string;
    readonly invited_by_email: string;
};

