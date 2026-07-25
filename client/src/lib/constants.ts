/** API base URL — in dev proxied by Vite, in prod set via env var */
export const API_BASE_URL = '/api';

/** Google Client ID from env */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
