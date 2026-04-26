// /shared/types/user.types.ts

export interface User {
    id: string;
    created_at: string;
    updated_at: string;
}

export interface Settings {
    id: string;
    user_id: string;
    timezone: string;
    reminder_enabled: boolean;
    reminder_hour: number;
    created_at: string;
    updated_at: string;
}

export type SettingsInsert = {
    id?: string;
    user_id: string;
    timezone?: string;
    reminder_enabled?: boolean;
    reminder_hour?: number;
    created_at?: string;
    updated_at?: string;
};

export type SettingsUpdate = Partial<Omit<Settings, 'id' | 'user_id'>>;
