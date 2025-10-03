

export type NotificationSettingsDto = {
    notifType: string;
    enabled: boolean;
};

export interface Notification {
    id: string;
    userId: string;
    notifType: string;
    message: string;
    createdAt: string;
    read: boolean;
}


export async function fetchNotificationSettings(): Promise<NotificationSettingsDto[]> {
    const token = getAccessToken();

    const res = await fetch(
        `${import.meta.env.VITE_NOTIFICATION_API_URL}/api/notification-settings`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function updateNotificationSetting(
    notifType: string,
    enabled: boolean
): Promise<NotificationSettingsDto> {
    const token = getAccessToken();

    const res = await fetch(
        `${import.meta.env.VITE_NOTIFICATION_API_URL}/api/notification-settings/${notifType}?enabled=${enabled}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

import { getAccessToken } from "../../auth/api/authApi";

// DTO sa backenda
export interface NotificationDto {
    id: string; // UUID
    notifType: string;
    message: string;
    createdAt: string;
    read: boolean;
}

const BASE_URL = import.meta.env.VITE_NOTIFICATION_API_URL;

export async function getNotificationById(id: string): Promise<NotificationDto> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/notifications/${id}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function getUserNotifications(): Promise<NotificationDto[]> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/notifications`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function getUnreadNotifications(): Promise<NotificationDto[]> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/notifications/unread`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function markAllAsRead(): Promise<void> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }
}



export async function markAsRead(id: string): Promise<void> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }
}

export async function markSelectedAsRead(ids: string[]): Promise<void> {
    const token = getAccessToken();

    const params = new URLSearchParams();
    ids.forEach((id) => params.append("ids", id));

    const res = await fetch(`${BASE_URL}/api/notifications/read?${params.toString()}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }
}

export async function deleteNotificationsBulk(ids: string[]): Promise<void> {
    const token = getAccessToken();
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("ids", id));

    const res = await fetch(`${BASE_URL}/api/notifications?${params}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }
}