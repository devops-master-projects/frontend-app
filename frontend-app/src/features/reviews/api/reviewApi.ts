import { getAccessToken } from "../../auth/api/authApi.ts";


import { config } from "../../../config/env.ts";
const BASE_URL = config.reviewApiUrl;


export interface AccommodationReviewDTO {
    id: string;
    guestId: string;
    accommodationId: string;
    rating: number;
    comment: string;
    createdAt: string;
    guestFirstName: string;
    guestLastName: string;
}
export interface UpsertAccommodationReview {
    accommodationId: string;
    rating: number;
    comment?: string;
}

export interface ReviewPage {
    content: AccommodationReviewDTO[];
    totalPages: number;
    averageRating: number;
}

export async function deleteReview(id: string): Promise<void> {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/api/reviews/accommodations/${id}`, {
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

export async function getReviewById(id: string): Promise<AccommodationReviewDTO> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/reviews/accommodations/${id}`, {
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

/**
 * Update an existing review
 */
export async function updateReview(id: string, review: UpsertAccommodationReview): Promise<AccommodationReviewDTO> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/reviews/accommodations/${id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(review),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

/**
 * Get paginated reviews for an accommodation
 */
export async function getAccommodationReviews(
    accommodationId: string,
    page: number,
    size: number = 5
): Promise<ReviewPage> {
    const res = await fetch(
        `${BASE_URL}/api/reviews/accommodations/${accommodationId}/reviews?page=${page - 1}&size=${size}`
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

export interface CreateReviewDTO {
    accommodationId: string;
    rating: number;
    comment: string;
}

export async function createAccommodationReview(dto: CreateReviewDTO): Promise<void> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/reviews/accommodations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }
}

export interface HostReviewDTO {
    id: string;
    guestId: string;
    hostId: string;
    rating: number;
    comment: string;
    createdAt: string;
    guestFirstName: string;
    guestLastName: string;
}

export interface HostReviewsResponse {
    content: HostReviewDTO[];
    totalPages: number;
    averageRating: number;
}


export async function getHostReviews(
    hostId: string,
    page: number = 0,
    size: number = 5
): Promise<HostReviewsResponse> {
    const res = await fetch(`${BASE_URL}/api/reviews/hosts/${hostId}/reviews?page=${page}&size=${size}`, {
        method: "GET",

    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json();
}

export interface UpsertHostReviewDTO {
    hostId: string;
    rating: number;
    comment: string;
}

export async function createHostReview(dto: UpsertHostReviewDTO): Promise<void> {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/api/reviews/hosts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}

export async function getHostReviewById(reviewId: string) {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/api/reviews/hosts/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}

export async function updateHostReview(
    reviewId: string,
    dto: UpsertHostReviewDTO
): Promise<void> {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/api/reviews/hosts/${reviewId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}

export async function deleteHostReview(reviewId: string): Promise<void> {
    const token = getAccessToken();

    const res = await fetch(`${BASE_URL}/api/reviews/hosts/${reviewId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
}