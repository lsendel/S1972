/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SubscriptionsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public subscriptionsCurrentRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/subscriptions/current/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public subscriptionsPlansRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/subscriptions/plans/',
        });
    }
}
