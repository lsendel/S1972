/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserSession } from '../models/UserSession';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AdminService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * User session endpoints.
     *
     * Provides information about user sessions for analytics.
     * @returns UserSession
     * @throws ApiError
     */
    public adminSessionsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this user session.
         */
        id: string,
    }): CancelablePromise<UserSession> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/sessions/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
