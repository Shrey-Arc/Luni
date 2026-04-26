import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { globalRateLimit, checkinRateLimit } from './middleware/rateLimit';
import { authMiddleware } from './middleware/auth';

// Import routes (these will be created in later phases)
import petsRoutes from './routes/pets';
// import achievementsRoutes from './routes/achievements';
// import settingsRoutes from './routes/settings';
// import exportRoutes from './routes/export';

const app = new Hono();

// Security headers
app.use('*', async (c, next) => {
    c.header('Content-Security-Policy', "default-src 'self'; connect-src 'self' https://api.github.com https://leetcode.com https://www.hackerrank.com");
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    await next();
});

// Apply middleware in order: CORS → Rate Limit → Auth
app.use('*', corsMiddleware);
app.use('*', globalRateLimit);

// Health check (no auth required)
app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes - apply auth middleware
app.use('/api/*', authMiddleware);

// Stricter rate limit for check-in endpoints
app.use('/api/pets/*/checkin', checkinRateLimit);

// Mount routes (will be uncommented in later phases)
app.route('/api/pets', petsRoutes);
// app.route('/api/achievements', achievementsRoutes);
// app.route('/api/settings', settingsRoutes);
// app.route('/api/export', exportRoutes);

// Catch-all 404
app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal server error' }, 500);
});

export default app;
