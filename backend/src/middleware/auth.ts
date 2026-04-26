import { Context, Next } from 'hono';
import { supabasePublic } from '../db/client';

export interface AuthEnv {
    Variables: {
        user: {
            id: string;
            email: string;
        };
    };
}

export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
    // Extract Bearer token from Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // Verify token using Supabase Auth
        const { data: { user }, error } = await supabasePublic.auth.getUser(token);

        if (error || !user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // Set verified user in context
        c.set('user', {
            id: user.id,
            email: user.email || '',
        });

        await next();
    } catch (error) {
        console.error('Auth verification failed:', error);
        return c.json({ error: 'Unauthorized' }, 401);
    }
}

// Optional route - allows requests with or without auth
export async function optionalAuth(c: Context<AuthEnv>, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
            const { data: { user }, error } = await supabasePublic.auth.getUser(token);

            if (!error && user) {
                c.set('user', {
                    id: user.id,
                    email: user.email || '',
                });
            }
        } catch (error) {
            // Silent fail for optional auth
            console.error('Optional auth failed:', error);
        }
    }

    await next();
}