import { api } from './config';
import type { Notification } from '../components/notifications/NotificationItem';

export const notificationsApi = {
    list: async (): Promise<Notification[]> => {
        const response = await api.request.request<Notification[]>({
            method: 'GET',
            url: '/api/v1/notifications/',
        });
        return response;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.request.request({
            method: 'POST',
            url: `/api/v1/notifications/${id}/read/`,
        });
    },

    markAllAsRead: async (): Promise<void> => {
        await api.request.request({
            method: 'POST',
            url: '/api/v1/notifications/read_all/',
        });
    },
};
