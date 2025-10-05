import type {AmenityResponseDto} from "./amenitiesApi.ts";
import { getAccessToken, getTokenType} from "../../auth/api/authApi.ts";

export type AccommodationResponseDto = {
    id: string;
    hostId?: string;
    name: string;
    minGuests: number;
    maxGuests: number;
    description: string;
    urlPhotos: string[];
    location: LocationDto;
    autoConfirm: boolean;
    pricingMode: string;
    amenities: AmenityResponseDto[];
};

export type LocationDto = {
    country: string;
    city: string;
    address: string;
    postalCode: string;
};

export type AccommodationRequestDto = {
    name: string;
    location: LocationDto;
    minGuests: number;
    maxGuests: number;
    description: string;
    autoConfirm: boolean;
    pricingMode: string;
    photos: string[];
    amenities: string[];
};


export interface AvailabilityDto {
    id: string;
    startDate: string;   // ISO string (npr. "2025-10-05")
    endDate: string;
    price: number;
    priceType: string;   // "NORMAL", "SEASONAL", "HOLIDAY", ...
    status: string;      // "AVAILABLE" ili "OCCUPIED"
}

export interface AccommodationDocument {
    id: string;
    name: string;
    description: string;
    minGuests: number;
    maxGuests: number;
    autoConfirm: boolean;
    pricingMode: string;   // "PER_NIGHT" ili "PER_PERSON"

    location: LocationDto;
    amenities: string[];
    photos: string[];
    availabilities?: AvailabilityDto[];
}



export interface SearchResponse {
    id: string;
    name: string;
    description: string;
    location: LocationDto;
    photos: string[];
    amenities: string[];
    minGuests: number;
    maxGuests: number;

    totalPrice: number;   // BigDecimal → number
    unitPrice: number;    // BigDecimal → number
    pricingMode: "PER_PERSON" | "PER_ACCOMMODATION" | "PER_NIGHT" | "FIXED";
}


export async function getAutoConfirm(accommodationId: string): Promise<boolean> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations/${accommodationId}/auto-confirm`,
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

    const data = await res.json();
    return data.autoConfirm;
}

export async function updateAutoConfirm(
    accommodationId: string,
    autoConfirm: boolean
): Promise<void> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations/${accommodationId}/auto-confirm`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
            },
            body: JSON.stringify({ autoConfirm }),
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}

export async function fetchAccommodations(): Promise<SearchResponse[]> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    console.log(`${import.meta.env.VITE_SEARCH_API_URL}/api/search/all`);

    const res = await fetch(`${import.meta.env.VITE_SEARCH_API_URL}/api/search/all`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${tokenType} ${token}` } : {})
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}

export async function uploadPhotoToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);


    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Cloudinary upload failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    console.log(data.secure_url);
    return data.secure_url as string;
}

export async function createAccommodation(
    request: AccommodationRequestDto
): Promise<AccommodationResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations`,
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
        throw new Error(text || `Backend error (HTTP ${res.status})`);
    }

    return res.json();
}

export async function fetchAccommodationById(id: string): Promise<AccommodationResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations/${id}`,
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

export async function updateAccommodation(
    id: string,
    request: AccommodationRequestDto
): Promise<AccommodationResponseDto> {
    const token = getAccessToken();
    const tokenType = getTokenType();

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations/${id}`,
        {
            method: "PUT",
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
export interface SearchRequest {
    location: string;
    guests: number;
    startDate?: string;
    endDate?: string;
}

export async function searchAccommodations(
    req: SearchRequest
): Promise<SearchResponse[]> {
    const res = await fetch(`${import.meta.env.VITE_SEARCH_API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}