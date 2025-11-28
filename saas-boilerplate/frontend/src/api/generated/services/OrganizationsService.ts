/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Invitation } from '../models/Invitation';
import type { Membership } from '../models/Membership';
import type { MembershipRequest } from '../models/MembershipRequest';
import type { Organization } from '../models/Organization';
import type { OrganizationRequest } from '../models/OrganizationRequest';
import type { PaginatedOrganizationList } from '../models/PaginatedOrganizationList';
import type { PatchedOrganizationRequest } from '../models/PatchedOrganizationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OrganizationsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns PaginatedOrganizationList
     * @throws ApiError
     */
    public organizationsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedOrganizationList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/organizations/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Organization
     * @throws ApiError
     */
    public organizationsCreate({
        requestBody,
    }: {
        requestBody: OrganizationRequest,
    }): CancelablePromise<Organization> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/organizations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Invitation
     * @throws ApiError
     */
    public organizationsInvitationsList({
        organizationSlug,
        ordering,
        search,
    }: {
        organizationSlug: string,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<Array<Invitation>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/organizations/{organization_slug}/invitations/',
            path: {
                'organization_slug': organizationSlug,
            },
            query: {
                'ordering': ordering,
                'search': search,
            },
        });
    }
    /**
     * @returns Invitation
     * @throws ApiError
     */
    public organizationsInvitationsRetrieve({
        id,
        organizationSlug,
    }: {
        /**
         * A UUID string identifying this invitation.
         */
        id: string,
        organizationSlug: string,
    }): CancelablePromise<Invitation> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/organizations/{organization_slug}/invitations/{id}/',
            path: {
                'id': id,
                'organization_slug': organizationSlug,
            },
        });
    }
    /**
     * @returns Membership
     * @throws ApiError
     */
    public organizationsMembersList({
        organizationSlug,
        ordering,
        search,
    }: {
        organizationSlug: string,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<Array<Membership>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/organizations/{organization_slug}/members/',
            path: {
                'organization_slug': organizationSlug,
            },
            query: {
                'ordering': ordering,
                'search': search,
            },
        });
    }
    /**
     * @returns Membership
     * @throws ApiError
     */
    public organizationsMembersRetrieve({
        id,
        organizationSlug,
    }: {
        /**
         * A UUID string identifying this membership.
         */
        id: string,
        organizationSlug: string,
    }): CancelablePromise<Membership> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/organizations/{organization_slug}/members/{id}/',
            path: {
                'id': id,
                'organization_slug': organizationSlug,
            },
        });
    }
    /**
     * @returns Membership
     * @throws ApiError
     */
    public organizationsMembersInviteCreate({
        organizationSlug,
        requestBody,
    }: {
        organizationSlug: string,
        requestBody?: MembershipRequest,
    }): CancelablePromise<Membership> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/organizations/{organization_slug}/members/invite/',
            path: {
                'organization_slug': organizationSlug,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Organization
     * @throws ApiError
     */
    public organizationsRetrieve({
        slug,
    }: {
        slug: string,
    }): CancelablePromise<Organization> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/organizations/{slug}/',
            path: {
                'slug': slug,
            },
        });
    }
    /**
     * @returns Organization
     * @throws ApiError
     */
    public organizationsUpdate({
        slug,
        requestBody,
    }: {
        slug: string,
        requestBody: OrganizationRequest,
    }): CancelablePromise<Organization> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/v1/organizations/{slug}/',
            path: {
                'slug': slug,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Organization
     * @throws ApiError
     */
    public organizationsPartialUpdate({
        slug,
        requestBody,
    }: {
        slug: string,
        requestBody?: PatchedOrganizationRequest,
    }): CancelablePromise<Organization> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/v1/organizations/{slug}/',
            path: {
                'slug': slug,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public organizationsDestroy({
        slug,
    }: {
        slug: string,
    }): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/v1/organizations/{slug}/',
            path: {
                'slug': slug,
            },
        });
    }
}
