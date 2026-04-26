// /shared/types/achievement.types.ts

export type AchievementConditionType = 'xp' | 'streak' | 'checkins';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition_type: AchievementConditionType;
  threshold: number;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  created_at: string;
  updated_at: string;
}

export type AchievementInsert = {
  id?: string;
  name: string;
  description: string;
  condition_type: AchievementConditionType;
  threshold: number;
  created_at?: string;
  updated_at?: string;
};

export type AchievementUpdate = Partial<Omit<Achievement, 'id'>>;

export type UserAchievementInsert = {
  id?: string;
  user_id: string;
  achievement_id: string;
  unlocked_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserAchievementUpdate = Partial<Omit<UserAchievement, 'id' | 'user_id' | 'achievement_id'>>;
