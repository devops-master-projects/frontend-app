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

const BASE_URL = import.meta.env.VITE_BOOKING_API_URL;


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
};


/**
 * CREATE reservation request
 * TODO! ID korisnika treba da ide iz tokena
 */
export async function createReservationRequest(
    dto: ReservationRequestCreateDto
): Promise<ReservationRequestResponseDto> {
    const res = await fetch(`${BASE_URL}/api/reservation-requests`, {
        // TODO!
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Guest-Id": "22b2383b-2f46-4116-8015-462c32531af1",
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
 * TODO! uzece iz tokena
 */
export async function getReservationRequestsByGuest(
    guestId: string,
    accommodationId: string
): Promise<ReservationRequestResponseDto[]> {
    const res = await fetch(`${BASE_URL}/api/reservation-requests/guest/${guestId}/${accommodationId}`);
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
    const res = await fetch(`${BASE_URL}/api/reservation-requests/accommodation/${accommodationId}`);
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
    const res = await fetch(`${BASE_URL}/api/reservation-requests/${id}/status?status=${status}`, {
        method: "PATCH",
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}




/**
 * GET availability for accommodation
 */
export async function getAvailability(
    accommodationId: string
): Promise<AvailabilityResponseDto[]> {
    const res = await fetch(`${BASE_URL}/api/availability/${accommodationId}/calendar`);
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
    const res = await fetch(`${BASE_URL}/api/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${BASE_URL}/api/availability/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${BASE_URL}/api/availability/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}

export async function deleteReservationRequest(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/reservation-requests/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
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
    const res = await fetch(`${BASE_URL}/api/reservation-requests/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}


