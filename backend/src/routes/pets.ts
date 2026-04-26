import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabaseAdmin } from '../db/client';
import {
    fetchGitHubStats,
    fetchLeetCodeStats,
    fetchHackerRankStats,
    calculateCustomXP,
    RateLimitError,
    ExternalApiError,
} from '../api/external';
import {
    platformIdSchema,
    checkInSchema,
    type PlatformId,
} from '../validation/schemas';
import type { AuthEnv } from '../middleware/auth';

const app = new Hono<AuthEnv>();

/**
 * Calculate level from XP
 * Formula: xpForLevel = 100 * (level ^ 1.5)
 */
function calculateLevel(totalXp: number): number {
    let level = 1;
    while (totalXp >= Math.floor(100 * Math.pow(level, 1.5))) {
        level++;
    }
    return level - 1;
}

/**
 * Calculate XP required for next level
 */
function xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Determine pet mood based on last check-in time
 */
function calculateMood(lastChecked: string | null): 'active' | 'idle' | 'neglected' | 'excited' {
    if (!lastChecked) {
        return 'idle';
    }

    const hoursSinceCheckin = (Date.now() - new Date(lastChecked).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCheckin < 4) {
        return 'excited'; // Just checked in
    } else if (hoursSinceCheckin < 24) {
        return 'active'; // Checked in recently
    } else if (hoursSinceCheckin < 72) {
        return 'idle'; // A bit stale
    } else {
        return 'neglected'; // Needs attention
    }
}

/**
 * GET /pets - Get all user's pets
 */
app.get('/', async (c) => {
    const user = c.get('user');

    try {
        const { data: pets, error } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('user_id', user.id)
            .order('platform_id', { ascending: true });

        if (error) {
            console.error('Database error fetching pets:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }

        // Calculate current mood for each pet
        const petsWithMood = pets.map((pet) => ({
            ...pet,
            mood: calculateMood(pet.last_checked),
        }));

        return c.json({ pets: petsWithMood });
    } catch (error) {
        console.error('Error fetching pets:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * GET /pets/:platformId - Get specific pet
 */
app.get('/:platformId', zValidator('param', platformIdSchema), async (c) => {
    const user = c.get('user');
    const platformId = c.req.param('platformId') as PlatformId;

    try {
        const { data: pet, error } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform_id', platformId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return c.json({ error: 'Pet not found' }, 404);
            }
            console.error('Database error fetching pet:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }

        return c.json({
            pet: {
                ...pet,
                mood: calculateMood(pet.last_checked),
            },
        });
    } catch (error) {
        console.error('Error fetching pet:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * POST /pets/:platformId/checkin - Check in with a pet
 */
app.post(
    '/:platformId/checkin',
    zValidator('param', platformIdSchema),
    zValidator('json', checkInSchema),
    async (c) => {
        const user = c.get('user');
        const platformId = c.req.param('platformId') as PlatformId;
        const body = c.req.valid('json');

        try {
            // 1. Get or create pet
            let { data: pet, error: fetchError } = await supabaseAdmin
                .from('pets')
                .select('*')
                .eq('user_id', user.id)
                .eq('platform_id', platformId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Database error fetching pet:', fetchError);
                return c.json({ error: 'Internal server error' }, 500);
            }

            // Create pet if doesn't exist
            if (!pet) {
                const { data: newPet, error: createError } = await supabaseAdmin
                    .from('pets')
                    .insert({
                        user_id: user.id,
                        platform_id: platformId,
                        level: 1,
                        xp: 0,
                        mood: 'idle',
                        stats: {},
                        streaks: [],
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Database error creating pet:', createError);
                    return c.json({ error: 'Internal server error' }, 500);
                }

                pet = newPet;
            }

            // 2. Check cooldown (4 hours)
            if (pet.last_checked) {
                const lastCheckedTime = new Date(pet.last_checked).getTime();
                const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;

                if (lastCheckedTime > fourHoursAgo) {
                    const msRemaining = lastCheckedTime + 4 * 60 * 60 * 1000 - Date.now();
                    const minutesRemaining = Math.ceil(msRemaining / (60 * 1000));

                    return c.json(
                        {
                            error: 'Check-in on cooldown',
                            cooldownRemaining: msRemaining,
                            message: `You can check in again in ${minutesRemaining} minutes`,
                        },
                        429
                    );
                }
            }

            // 3. Fetch stats and calculate XP based on platform
            let xpGained = 0;
            let stats = {};

            try {
                switch (platformId) {
                    case 'github': {
                        if (!body.username) {
                            return c.json({ error: 'Username required for GitHub' }, 400);
                        }
                        const githubStats = await fetchGitHubStats(body.username, c.env as any);
                        xpGained = githubStats.xpGained;
                        stats = {
                            totalEvents: githubStats.totalEvents,
                            commits: githubStats.commits,
                            prs: githubStats.prs,
                            issues: githubStats.issues,
                        };
                        break;
                    }

                    case 'leetcode': {
                        if (!body.username) {
                            return c.json({ error: 'Username required for LeetCode' }, 400);
                        }
                        const leetcodeStats = await fetchLeetCodeStats(body.username);
                        xpGained = leetcodeStats.xpGained;
                        stats = {
                            totalSolved: leetcodeStats.totalSolved,
                            easySolved: leetcodeStats.easySolved,
                            mediumSolved: leetcodeStats.mediumSolved,
                            hardSolved: leetcodeStats.hardSolved,
                        };
                        break;
                    }

                    case 'hackerrank': {
                        if (!body.username) {
                            return c.json({ error: 'Username required for HackerRank' }, 400);
                        }
                        const hackerrankStats = await fetchHackerRankStats(body.username);
                        xpGained = hackerrankStats.xpGained;
                        stats = {
                            problemsSolved: hackerrankStats.problemsSolved,
                            badges: hackerrankStats.badges,
                        };
                        break;
                    }

                    case 'custom': {
                        xpGained = calculateCustomXP(body.customMetrics || {});
                        stats = body.customMetrics || {};
                        break;
                    }
                }
            } catch (error) {
                if (error instanceof RateLimitError) {
                    return c.json(
                        {
                            error: 'External API rate limit exceeded',
                            retryAfter: error.retryAfter,
                        },
                        429
                    );
                }

                if (error instanceof ExternalApiError) {
                    console.error('External API error:', error);
                    return c.json(
                        {
                            error: 'Failed to fetch platform stats. Please try again later.',
                        },
                        503
                    );
                }

                throw error;
            }

            // 4. Update pet with new XP and level
            const newTotalXp = pet.xp + xpGained;
            const oldLevel = pet.level;
            const newLevel = calculateLevel(newTotalXp);
            const leveledUp = newLevel > oldLevel;

            const { data: updatedPet, error: updateError } = await supabaseAdmin
                .from('pets')
                .update({
                    xp: newTotalXp,
                    level: newLevel,
                    last_checked: new Date().toISOString(),
                    stats,
                    mood: 'excited',
                })
                .eq('id', pet.id)
                .select()
                .single();

            if (updateError) {
                console.error('Database error updating pet:', updateError);
                return c.json({ error: 'Internal server error' }, 500);
            }

            // 5. Return updated pet data
            return c.json({
                pet: {
                    ...updatedPet,
                    mood: 'excited',
                },
                xpGained,
                leveledUp,
                oldLevel,
                newLevel,
                nextLevelXp: xpForLevel(newLevel + 1),
            });
        } catch (error) {
            console.error('Error during check-in:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
);

export default app;