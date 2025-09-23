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
