/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_ACCOMMODATION_API_URL: string;
    readonly VITE_BOOKING_API_URL: string;
    readonly VITE_SEARCH_API_URL: string;
    readonly VITE_NOTIFICATION_API_URL: string;
    readonly VITE_CLOUDINARY_CLOUD_NAME: string;
    readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
    readonly VITE_REVIEW_API_URL : string;

}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    _env_?: {
        VITE_API_URL?: string;
        VITE_ACCOMMODATION_API_URL?: string;
        VITE_BOOKING_API_URL?: string;
        VITE_SEARCH_API_URL?: string;
        VITE_NOTIFICATION_API_URL?: string;
        VITE_CLOUDINARY_CLOUD_NAME?: string;
        VITE_CLOUDINARY_UPLOAD_PRESET?: string;
        VITE_REVIEW_API_URL? : string;
    };
}
