import {getAccessToken, getTokenType} from "../../auth/api/authApi.ts";

export type AvailabilityRequestDto = {
    accommodationId: string;
    startDate: string;
    endDate: string;
    price: number;
    priceType: "NORMAL" | "HOLIDAY" | "SEASONAL" | "WEEKEND"; // jednoznačno

};


export type AvailabilityResponseDto = {
    id: string;
    accommodationId: string;
    startDate: string;
    endDate: string;
    price: number;
    status: "AVAILABLE" | "RESERVED";
    priceType: "NORMAL" | "HOLIDAY" | "SEASONAL" | "WEEKEND"; // jednoznačno
};


import { config } from "../../../config/env.ts";
const BASE_URL = config.bookingApiUrl;

export type ReservationRequestCreateDto = {
    accommodationId: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string;   // "YYYY-MM-DD"
    guestCount: number;
};

export type ReservationRequestResponseDto = {
    id: string;
    guestId: string;
    accommodationId: string;
    startDate: string;
    endDate: string;
    guestCount: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    guestEmail?: string;
    guestFirstName?: string;
    guestLastName?: string;
    createdAt: string;
    connectedReservationCancelled?: string;
    cancellationsCount? : number;

};

export async function createReservationRequest(
    dto: ReservationRequestCreateDto
): Promise<ReservationRequestResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/reservation-requests`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
        body: JSON.stringify(dto),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * GET reservation requests by guest
 */
export async function getReservationRequestsByGuest(
    accommodationId: string
): Promise<ReservationRequestResponseDto[]> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${BASE_URL}/api/reservation-requests/guest/${accommodationId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
            },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * GET reservation requests by accommodation
 */
export async function getReservationRequestsByAccommodation(
    accommodationId: string
): Promise<ReservationRequestResponseDto[]> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${BASE_URL}/api/reservation-requests/accommodation/${accommodationId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
            },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * UPDATE reservation request status
 */
export async function updateReservationRequestStatus(
    id: string,
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
): Promise<ReservationRequestResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${BASE_URL}/api/reservation-requests/${id}/status?status=${status}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
            },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}


export async function getAvailability(
    accommodationId: string
): Promise<AvailabilityResponseDto[]> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${BASE_URL}/api/availability/${accommodationId}/calendar`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
            },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}

/**
 * POST new availability
 */
export async function createAvailability(
    request: AvailabilityRequestDto
): Promise<AvailabilityResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/availability`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}
/**
 * PUT update availability
 */
export async function updateAvailability(
    id: string,
    request: Partial<AvailabilityRequestDto>
): Promise<AvailabilityResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/availability/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}


/**
 * DELETE availability
 */
export async function deleteAvailability(id: string): Promise<void> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/availability/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}


export async function deleteReservationRequest(id: string): Promise<void> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/reservation-requests/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}


export type ReservationRequestUpdateDto = {
    startDate: string;
    endDate: string;
    guestCount: number;
};

export async function updateReservationRequest(
    id: string,
    dto: ReservationRequestUpdateDto
): Promise<ReservationRequestResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/reservation-requests/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
        body: JSON.stringify(dto),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}


export async function cancelReservation(requestId: string): Promise<void> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(`${BASE_URL}/api/reservation-requests/${requestId}/cancel`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}

export async function canGuestRateAccommodation(accommodationId: string): Promise<boolean> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/booking/accommodations/${accommodationId}/can-rate`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json(); // boolean
}

export async function canGuestRateHost(hostId: string): Promise<boolean> {
    const token = getAccessToken();

    const res = await fetch(
        `${BASE_URL}/api/booking/host/${hostId}/can-rate`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
    }

    return res.json();
}
