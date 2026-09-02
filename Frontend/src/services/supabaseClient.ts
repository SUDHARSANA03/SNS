import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface SavedErrorRecord {
  id: string
  user_id?: string
  session_id?: string
  log_id: string
  error_level: string
  message: string
  component?: string | null
  timestamp?: string | null
  summary?: string | null
  root_cause?: string | null
  notes?: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  role?: string
  avatar_url?: string
  created_at?: string
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'https://your-project.supabase.co' &&
  SUPABASE_ANON_KEY !== 'your-anon-key'
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// LocalStorage fallback store for offline/demo operation
const MOCK_STORAGE_KEY = 'incident_ai_mock_saved_errors_v1'
const MOCK_USER_KEY = 'incident_ai_mock_user_v1'

const getMockSavedErrors = (): SavedErrorRecord[] => {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveMockSavedErrors = (errors: SavedErrorRecord[]) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(errors))
  } catch (e) {
    console.error('Failed to write mock saved errors', e)
  }
}

// ── Database Operations ──

export async function saveUserErrorToSupabase(record: Omit<SavedErrorRecord, 'id' | 'created_at'>): Promise<SavedErrorRecord> {
  const newRecord: SavedErrorRecord = {
    ...record,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  }

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('user_saved_errors')
        .insert([newRecord])
        .select()
        .single()

      if (error) {
        console.warn('Supabase insert returned error, falling back to local store:', error.message)
      } else if (data) {
        return data as SavedErrorRecord
      }
    } catch (err) {
      console.warn('Supabase call failed, falling back to local mock:', err)
    }
  }

  // Fallback to local storage
  const current = getMockSavedErrors()
  const updated = [newRecord, ...current.filter((e) => !(e.log_id === newRecord.log_id && e.session_id === newRecord.session_id))]
  saveMockSavedErrors(updated)
  return newRecord
}

export async function fetchUserSavedErrors(userId?: string): Promise<SavedErrorRecord[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      let query = supabase
        .from('user_saved_errors')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
      if (error) {
        console.warn('Supabase fetch failed, using local mock:', error.message)
      } else if (data) {
        return data as SavedErrorRecord[]
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local mock:', err)
    }
  }

  return getMockSavedErrors()
}

export async function deleteSavedErrorFromSupabase(errorId: string): Promise<boolean> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('user_saved_errors')
        .delete()
        .eq('id', errorId)

      if (!error) return true
    } catch (err) {
      console.warn('Supabase delete failed, using local mock:', err)
    }
  }

  const current = getMockSavedErrors()
  const updated = current.filter((e) => e.id !== errorId)
  saveMockSavedErrors(updated)
  return true
}

// ── Auth Helpers ──

export function getStoredMockUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function setStoredMockUser(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(MOCK_USER_KEY)
    }
  } catch (e) {
    console.error('Failed to store mock user', e)
  }
}
