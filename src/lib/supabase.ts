import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 允许在构建时 env 未设置（构建时会 fallback 到 mock）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return supabase
}

export function hasSupabaseConfig() {
  return !!(supabaseUrl && supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          status: string
          tag_set: any
          inferred_config: any
          script: any
          shots: any
          master_cut: any
          variants: any
          story_structure: any
          cost_spent: number
          estimated_cost_remaining: number
          last_entered_stage: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      assets: {
        Row: {
          id: string
          project_id: string
          kind: 'scene' | 'character' | 'prop'
          name: string
          description: string
          image_url: string | null
          public_id: string | null
          status: string
          approved_by_user: boolean
          metadata: any
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          credits: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
  }
}
