/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for TOTP device information.
 */
export type TOTPDevice = {
    readonly id: string;
    /**
     * Device name
     */
    name?: string;
    /**
     * Whether the device has been confirmed
     */
    readonly confirmed: boolean;
    readonly created_at: string;
    readonly last_used_at: string | null;
    readonly provisioning_uri: string;
};

