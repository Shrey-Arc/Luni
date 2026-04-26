import { z } from 'zod';

// Platform validation
export const platformIdSchema = z.enum(['github', 'leetcode', 'hackerrank', 'custom']);

// Check-in request schema
export const checkInSchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required')
        .max(100, 'Username too long')
        .optional(), // Optional for custom platform
    customMetrics: z
        .object({
            activity1: z.number().int().min(0).max(10000).optional(),
            activity2: z.number().int().min(0).max(10000).optional(),
            streak: z.number().int().min(0).max(1000).optional(),
        })
        .optional(),
});

// Settings update schema
export const settingsUpdateSchema = z.object({
    enabledPlatforms: z
        .object({
            github: z.boolean(),
            leetcode: z.boolean(),
            hackerrank: z.boolean(),
            custom: z.boolean(),
        })
        .optional(),
    usernames: z
        .object({
            github: z.string().max(100).optional(),
            leetcode: z.string().max(100).optional(),
            hackerrank: z.string().max(100).optional(),
        })
        .optional(),
    theme: z.enum(['dark', 'light']).optional(),
});

// Achievement filter schema
export const achievementFilterSchema = z.object({
    petId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

// Export data schema
export const exportFormatSchema = z.enum(['json', 'csv']);

// Pet query params
export const petQuerySchema = z.object({
    platformId: platformIdSchema.optional(),
});

// Pagination schema
export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

// Type exports for use in route handlers
export type PlatformId = z.infer<typeof platformIdSchema>;
export type CheckInRequest = z.infer<typeof checkInSchema>;
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
export type AchievementFilter = z.infer<typeof achievementFilterSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type PetQuery = z.infer<typeof petQuerySchema>;
export type Pagination = z.infer<typeof paginationSchema>;