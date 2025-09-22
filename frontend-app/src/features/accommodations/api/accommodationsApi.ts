import type {AmenityResponseDto} from "./amenitiesApi.ts";

export type AccommodationResponseDto = {
    id: string;
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
    hostId?: string;
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


export async function fetchAccommodations(): Promise<AccommodationResponseDto[]> {
    console.log(`${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations`);
    const res = await fetch(`${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
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
    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations/${id}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}

// PUT update accommodation
export async function updateAccommodation(
    id: string,
    request: AccommodationRequestDto
): Promise<AccommodationResponseDto> {
    const res = await fetch(
        `${import.meta.env.VITE_ACCOMMODATION_API_URL}/api/accommodations/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}