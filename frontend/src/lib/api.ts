/**
 * api.ts — base URL helper for all fetch calls.
 *
 * In development (Vite dev server) VITE_API_URL is not set,
 * so paths like "/api/questionnaire" are proxied to localhost:3001
 * by vite.config.ts.
 *
 * In production (Vercel) VITE_API_URL is set to the Railway backend URL,
 * e.g. "https://carnot-backend.up.railway.app".
 * Calls then become "https://carnot-backend.up.railway.app/api/questionnaire".
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL ?? ''
  return `${base}${path}`
}
