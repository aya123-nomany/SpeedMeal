// In development, Vite proxy forwards /api → http://localhost:5000 (no CORS issues)
// In production (Vercel), use the Cloudflare Worker URL
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'https://speedmeal.ayaennoamany.workers.dev/api';

// Socket.io connects directly (no Vite proxy for WebSockets)
export const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://speedmeal.ayaennoamany.workers.dev';

export default API_BASE_URL;

