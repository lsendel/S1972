/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { AxiosHttpRequest } from './core/AxiosHttpRequest';
import { AdminService } from './services/AdminService';
import { AnalyticsService } from './services/AnalyticsService';
import { AuthService } from './services/AuthService';
import { OrganizationsService } from './services/OrganizationsService';
import { SubscriptionsService } from './services/SubscriptionsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class ApiClient {
    public readonly admin: AdminService;
    public readonly analytics: AnalyticsService;
    public readonly auth: AuthService;
    public readonly organizations: OrganizationsService;
    public readonly subscriptions: SubscriptionsService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.admin = new AdminService(this.request);
        this.analytics = new AnalyticsService(this.request);
        this.auth = new AuthService(this.request);
        this.organizations = new OrganizationsService(this.request);
        this.subscriptions = new SubscriptionsService(this.request);
    }
}

