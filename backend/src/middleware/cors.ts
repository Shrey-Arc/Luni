import { Context, Next } from 'hono';

const ALLOWED_ORIGINS = [
    'https://luni.app',
    'http://localhost:5173',
    'http://localhost:5174', // Backup Vite port
];

export async function corsMiddleware(c: Context, next: Next) {
    const origin = c.req.header('origin');

    // Check if origin is allowed
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        c.header('Access-Control-Allow-Origin', origin);
    }

    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    await next();
}