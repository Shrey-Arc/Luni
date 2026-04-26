// /shared/types/api.types.ts

import type {
    Achievement,
    UserAchievement,
} from './achievements';
import type { CheckIn, Pet, PlatformType } from './pets';
import type { Settings, User } from './user';

export interface ApiError {
    code: string;
    message: string;
    details?: string;
}

export interface ApiResponse<T> {
    data: T;
    error: null;
}

export interface ApiErrorResponse {
    data: null;
    error: ApiError;
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface CreateUserRequest {
    id: string;
}

export type CreateUserResponse = ApiResult<User>;

export interface CreatePetRequest {
    platform: PlatformType;
}

export type CreatePetResponse = ApiResult<Pet>;

export interface ListPetsResponse {
    pets: Pet[];
}

export type ListPetsApiResponse = ApiResult<ListPetsResponse>;

export interface CreateCheckInRequest {
    pet_id: string;
}

export type CreateCheckInResponse = ApiResult<CheckIn>;

export interface ListCheckInsResponse {
    checkins: CheckIn[];
}

export type ListCheckInsApiResponse = ApiResult<ListCheckInsResponse>;

export interface UpdateSettingsRequest {
    timezone?: string;
    reminder_enabled?: boolean;
    reminder_hour?: number;
}

export type SettingsResponse = ApiResult<Settings>;

export interface ListAchievementsResponse {
    achievements: Achievement[];
    user_achievements: UserAchievement[];
}

export type ListAchievementsApiResponse = ApiResult<ListAchievementsResponse>;

export interface HealthResponse {
    status: 'ok';
    timestamp: string;
}
