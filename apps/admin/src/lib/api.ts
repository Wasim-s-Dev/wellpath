/** API base URL. Empty in development, where the Vite proxy forwards requests to the API. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? ''
