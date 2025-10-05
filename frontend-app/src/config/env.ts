// src/config/env.ts
export const getEnvVar = (key: keyof NonNullable<Window['_env_']>): string => {
    // Redosled prioriteta:
    // 1. Runtime (window._env_), 2. Build-time (import.meta.env), 3. fallback ''
    return window._env_?.[key] || import.meta.env[key] || '';
};

export const config = {
    apiUrl: getEnvVar('VITE_API_URL'),
    accommodationApiUrl: getEnvVar('VITE_ACCOMMODATION_API_URL'),
    bookingApiUrl: getEnvVar('VITE_BOOKING_API_URL'),
    searchApiUrl: getEnvVar('VITE_SEARCH_API_URL'),
    notificationApiUrl: getEnvVar('VITE_NOTIFICATION_API_URL'),
    cloudinary: {
        cloudName: getEnvVar('VITE_CLOUDINARY_CLOUD_NAME'),
        uploadPreset: getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET'),
    },
    reviewApiUrl: getEnvVar('VITE_REVIEW_API_URL'),
};
