import { createClient, type SupabaseClient } from '@supabase/supabase-js';


export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          condition_type: 'xp' | 'streak' | 'checkins';
          threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          condition_type: 'xp' | 'streak' | 'checkins';
          threshold: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          name: string;
          description: string;
          condition_type: 'xp' | 'streak' | 'checkins';
          threshold: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          pet_id: string;
          xp_awarded: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pet_id: string;
          xp_awarded?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          pet_id: string;
          xp_awarded: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          user_id: string;
          platform: 'github' | 'leetcode' | 'hackerrank' | 'custom';
          xp: number;
          level: number;
          last_checkin_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'github' | 'leetcode' | 'hackerrank' | 'custom';
          xp?: number;
          level?: number;
          last_checkin_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          platform: 'github' | 'leetcode' | 'hackerrank' | 'custom';
          xp: number;
          level: number;
          last_checkin_at: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          timezone: string;
          reminder_enabled: boolean;
          reminder_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          timezone?: string;
          reminder_enabled?: boolean;
          reminder_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          timezone: string;
          reminder_enabled: boolean;
          reminder_hour: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      achievement_condition_type: 'xp' | 'streak' | 'checkins';
      platform_type: 'github' | 'leetcode' | 'hackerrank' | 'custom';
    };
    CompositeTypes: Record<string, never>;
  };
};

export interface SupabaseEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
}

export type TypedSupabaseClient = SupabaseClient<Database>;

export type SupabaseClients = {
  supabaseAdmin: TypedSupabaseClient;
  supabasePublic: TypedSupabaseClient;
};

const requiredEnvKeys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'] as const;

function getRequiredEnvValue(env: SupabaseEnv, key: (typeof requiredEnvKeys)[number]): string {
  const value = env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function createSupabaseTypedClient(url: string, key: string): TypedSupabaseClient {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch,
    },
  });
}

export function createSupabaseClients(env: SupabaseEnv): SupabaseClients {
  const supabaseUrl = getRequiredEnvValue(env, 'SUPABASE_URL');
  const serviceRoleKey = getRequiredEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = getRequiredEnvValue(env, 'SUPABASE_ANON_KEY');

  const supabaseAdmin = createSupabaseTypedClient(supabaseUrl, serviceRoleKey);
  const supabasePublic = createSupabaseTypedClient(supabaseUrl, anonKey);

  return {
    supabaseAdmin,
    supabasePublic,
  };
}
