// /shared/types/pet.types.ts

export type PlatformType = 'github' | 'leetcode' | 'hackerrank' | 'custom';

export interface Pet {
    id: string;
    user_id: string;
    platform: PlatformType;
    xp: number;
    level: number;
    last_checkin_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CheckIn {
    id: string;
    user_id: string;
    pet_id: string;
    xp_awarded: number;
    created_at: string;
    updated_at: string;
}

export type PetInsert = {
    id?: string;
    user_id: string;
    platform: PlatformType;
    xp?: number;
    level?: number;
    last_checkin_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type PetUpdate = Partial<Omit<Pet, 'id' | 'user_id'>>;

export type CheckInInsert = {
    id?: string;
    user_id: string;
    pet_id: string;
    xp_awarded?: number;
    created_at?: string;
    updated_at?: string;
};

export type CheckInUpdate = Partial<Omit<CheckIn, 'id' | 'user_id' | 'pet_id'>>;
