/** API base URL — in dev proxied by Vite, in prod set via VITE_API_URL env var */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Google Client ID from env */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
