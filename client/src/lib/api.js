// When VITE_API_URL is set (e.g. in production), use it as the base.
// In local dev (no env var), fall back to '' so relative /api/* paths go
// through the Vite dev-server proxy to http://localhost:3001.
export const BASE_URL = import.meta.env.VITE_API_URL ?? ''
