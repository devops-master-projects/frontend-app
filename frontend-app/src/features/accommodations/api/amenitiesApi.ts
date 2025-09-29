export interface AmenityRequestDto {
    name: string;
    description: string;
}

export interface AmenityResponseDto {
    id: string;
    name: string;
    description: string;
}
import { getAccessToken, getTokenType } from "../../auth/api/authApi.ts";

export async function createAmenity(
    request: AmenityRequestDto
): Promise<AmenityResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/amenities`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
            },
            body: JSON.stringify(request),
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function fetchAmenities(): Promise<AmenityResponseDto[]> {
    const res = await fetch(`${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/amenities`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}
