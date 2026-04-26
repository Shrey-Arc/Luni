import { Context, Next } from 'hono';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const globalStore: RateLimitStore = {};
const checkinStore: RateLimitStore = {};

function cleanupStore(store: RateLimitStore) {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}

// Cleanup every 5 minutes
setInterval(() => {
    cleanupStore(globalStore);
    cleanupStore(checkinStore);
}, 5 * 60 * 1000);

function checkRateLimit(
    identifier: string,
    store: RateLimitStore,
    limit: number,
    windowMs: number
): { allowed: boolean; resetTime: number; remaining: number } {
    const now = Date.now();
    const record = store[identifier];

    if (!record || record.resetTime < now) {
        // New window
        store[identifier] = {
            count: 1,
            resetTime: now + windowMs,
        };
        return {
            allowed: true,
            resetTime: now + windowMs,
            remaining: limit - 1,
        };
    }

    // Existing window
    if (record.count >= limit) {
        return {
            allowed: false,
            resetTime: record.resetTime,
            remaining: 0,
        };
    }

    record.count++;
    return {
        allowed: true,
        resetTime: record.resetTime,
        remaining: limit - record.count,
    };
}

// Global rate limit: 60 requests per minute
export async function globalRateLimit(c: Context, next: Next) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

    const result = checkRateLimit(
        `global:${ip}`,
        globalStore,
        60,
        60 * 1000 // 1 minute
    );

    c.header('X-RateLimit-Limit', '60');
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString());

    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        c.header('Retry-After', retryAfter.toString());
        return c.json(
            {
                error: 'Too many requests',
                retryAfter,
            },
            429
        );
    }

    await next();
}

// Checkin rate limit: 5 requests per minute (stricter)
export async function checkinRateLimit(c: Context, next: Next) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

    const result = checkRateLimit(
        `checkin:${ip}`,
        checkinStore,
        5,
        60 * 1000 // 1 minute
    );

    c.header('X-RateLimit-Limit', '5');
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString());

    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        c.header('Retry-After', retryAfter.toString());
        return c.json(
            {
                error: 'Too many check-in attempts. Please wait before trying again.',
                retryAfter,
            },
            429
        );
    }

    await next();
}