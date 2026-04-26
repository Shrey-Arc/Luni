interface Env {
    GITHUB_PAT: string;
}

interface GitHubStats {
    totalEvents: number;
    commits: number;
    prs: number;
    issues: number;
    xpGained: number;
}

interface LeetCodeStats {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    xpGained: number;
}

interface HackerRankStats {
    problemsSolved: number;
    badges: number;
    xpGained: number;
}

// Simple in-memory cache (use Cloudflare KV or Supabase in production)
const cache = new Map<string, { data: any; expiresAt: number }>();

function getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (!cached || cached.expiresAt < Date.now()) {
        cache.delete(key);
        return null;
    }
    return cached.data;
}

function setCache(key: string, data: any, ttlMs: number) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

export class RateLimitError extends Error {
    retryAfter: number;

    constructor(message: string, retryAfter: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export class ExternalApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'ExternalApiError';
        this.statusCode = statusCode;
    }
}

/**
 * Fetch GitHub user activity statistics
 * @param username - GitHub username
 * @param env - Environment variables containing GITHUB_PAT
 * @returns GitHub statistics with XP calculation
 */
export async function fetchGitHubStats(
    username: string,
    env: Env
): Promise<GitHubStats> {
    const cacheKey = `github:${username}`;
    const cached = getCached<GitHubStats>(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(
            `https://api.github.com/users/${username}/events?per_page=100`,
            {
                headers: {
                    Authorization: `Bearer ${env.GITHUB_PAT}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'Luni-App',
                },
            }
        );

        // Handle rate limiting
        if (response.status === 403 || response.status === 429) {
            const resetTime = response.headers.get('x-ratelimit-reset');
            const retryAfter = resetTime
                ? parseInt(resetTime) - Math.floor(Date.now() / 1000)
                : 3600; // Default 1 hour

            throw new RateLimitError(
                'GitHub API rate limit exceeded',
                retryAfter
            );
        }

        if (!response.ok) {
            throw new ExternalApiError(
                'Failed to fetch GitHub stats',
                response.status
            );
        }

        const events = await response.json();

        if (!Array.isArray(events)) {
            throw new ExternalApiError('Invalid GitHub API response', 500);
        }

        // Count different event types
        let commits = 0;
        let prs = 0;
        let issues = 0;

        events.forEach((event: any) => {
            if (event.type === 'PushEvent') {
                commits += event.payload?.commits?.length || 0;
            } else if (event.type === 'PullRequestEvent') {
                prs++;
            } else if (event.type === 'IssuesEvent') {
                issues++;
            }
        });

        // Calculate XP: commits * 5 + PRs * 20 + general events * 1
        // Cap at 300 from activity, plus base 100 XP
        const activityXp = Math.min(commits * 5 + prs * 20 + events.length * 1, 300);
        const xpGained = activityXp + 100;

        const stats: GitHubStats = {
            totalEvents: events.length,
            commits,
            prs,
            issues,
            xpGained,
        };

        // Cache for 24 hours
        setCache(cacheKey, stats, 24 * 60 * 60 * 1000);

        return stats;
    } catch (error) {
        if (error instanceof RateLimitError || error instanceof ExternalApiError) {
            throw error;
        }
        throw new ExternalApiError('Failed to fetch GitHub stats', 500);
    }
}

/**
 * Fetch LeetCode user statistics
 * @param username - LeetCode username
 * @returns LeetCode statistics with XP calculation
 */
export async function fetchLeetCodeStats(
    username: string
): Promise<LeetCodeStats> {
    const cacheKey = `leetcode:${username}`;
    const cached = getCached<LeetCodeStats>(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Luni-App',
            },
            body: JSON.stringify({
                query,
                variables: { username },
            }),
        });

        if (!response.ok) {
            throw new ExternalApiError(
                'Failed to fetch LeetCode stats',
                response.status
            );
        }

        const data = await response.json();

        // Validate response structure
        if (
            !data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum ||
            !Array.isArray(data.data.matchedUser.submitStatsGlobal.acSubmissionNum)
        ) {
            throw new ExternalApiError('Invalid LeetCode API response', 500);
        }

        const submissions = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;

        // Extract difficulty counts
        let easySolved = 0;
        let mediumSolved = 0;
        let hardSolved = 0;

        submissions.forEach((item: any) => {
            const difficulty = item.difficulty?.toLowerCase();
            const count = parseInt(item.count) || 0;

            if (difficulty === 'easy') {
                easySolved = count;
            } else if (difficulty === 'medium') {
                mediumSolved = count;
            } else if (difficulty === 'hard') {
                hardSolved = count;
            }
        });

        const totalSolved = easySolved + mediumSolved + hardSolved;

        // Calculate XP: easy * 10 + medium * 25 + hard * 50
        // Cap at 400 from problems, plus base 80 XP
        const problemXp = Math.min(
            easySolved * 10 + mediumSolved * 25 + hardSolved * 50,
            400
        );
        const xpGained = problemXp + 80;

        const stats: LeetCodeStats = {
            totalSolved,
            easySolved,
            mediumSolved,
            hardSolved,
            xpGained,
        };

        // Cache for 24 hours
        setCache(cacheKey, stats, 24 * 60 * 60 * 1000);

        return stats;
    } catch (error) {
        if (error instanceof ExternalApiError) {
            throw error;
        }
        throw new ExternalApiError('Failed to fetch LeetCode stats', 500);
    }
}

/**
 * Fetch HackerRank user statistics
 * @param username - HackerRank username
 * @returns HackerRank statistics with XP calculation
 */
export async function fetchHackerRankStats(
    username: string
): Promise<HackerRankStats> {
    const cacheKey = `hackerrank:${username}`;
    const cached = getCached<HackerRankStats>(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        // HackerRank's public API is limited, using profile scraping approach
        const response = await fetch(
            `https://www.hackerrank.com/rest/hackers/${username}/scores_elo`,
            {
                headers: {
                    'User-Agent': 'Luni-App',
                },
            }
        );

        if (response.status === 404) {
            // User not found - return zero stats
            const stats: HackerRankStats = {
                problemsSolved: 0,
                badges: 0,
                xpGained: 90, // Base XP only
            };
            return stats;
        }

        if (!response.ok) {
            throw new ExternalApiError(
                'Failed to fetch HackerRank stats',
                response.status
            );
        }

        const data = await response.json();

        // HackerRank API can be unreliable, use fallback for mock data
        const problemsSolved = data?.total_problems_solved || 0;
        const badges = data?.badges?.length || 0;

        // Calculate XP: problems * 8 + badges * 40
        // Cap at 350 from activity, plus base 90 XP
        const activityXp = Math.min(problemsSolved * 8 + badges * 40, 350);
        const xpGained = activityXp + 90;

        const stats: HackerRankStats = {
            problemsSolved,
            badges,
            xpGained,
        };

        // Cache for 24 hours
        setCache(cacheKey, stats, 24 * 60 * 60 * 1000);

        return stats;
    } catch (error) {
        if (error instanceof ExternalApiError) {
            throw error;
        }

        // Graceful fallback - return base XP if API unavailable
        return {
            problemsSolved: 0,
            badges: 0,
            xpGained: 90,
        };
    }
}

/**
 * Calculate XP for custom platform based on user-provided metrics
 * @param metrics - Custom activity metrics
 * @returns XP calculation
 */
export function calculateCustomXP(metrics: {
    activity1?: number;
    activity2?: number;
    streak?: number;
}): number {
    const activity1 = metrics.activity1 || 0;
    const activity2 = metrics.activity2 || 0;
    const streak = metrics.streak || 0;

    // Custom formula: activity1 * 10 + activity2 * 15 + streak * 5 + base 60
    return activity1 * 10 + activity2 * 15 + streak * 5 + 60;
}