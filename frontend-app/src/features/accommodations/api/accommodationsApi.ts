export type LocationDto = {
    country: string;
    city: string;
    address: string;
    postalCode: string;
};

export type AccommodationResponseDto = {
    id: string;
    name: string;
    minGuests: number;
    maxGuests: number;
    description: string;
    urlPhotos: string[];
    location: LocationDto;
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
