export const USE_MOCK = (import.meta as any).env?.VITE_USE_MOCK === 'true'

export const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000'
