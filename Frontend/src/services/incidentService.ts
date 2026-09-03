/**
 * Incident Service — handles persistent incident records,
 * fetching history, and requesting SRE RCA draft generation.
 * Operates with Supabase cloud when configured and falls back to local storage seamlessly.
 */
import { IncidentRecord } from '../data'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'incident_ai_mock_incident_records_v1'
const API_BASE = '' // Vite dev proxy to backend

const getMockIncidents = (): IncidentRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveMockIncidents = (items: IncidentRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to store mock incident records', e)
  }
}

export async function saveIncidentRecord(
  record: Omit<IncidentRecord, 'id' | 'created_at'>
): Promise<IncidentRecord> {
  const newRecord: IncidentRecord = {
    ...record,
    id: typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  }

  // 1. Attempt Supabase save if configured
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('incident_records')
        .insert([newRecord])
        .select()
        .single()

      if (!error && data) {
        return data as IncidentRecord
      }
    } catch (err) {
      console.warn('Supabase save incident failed, falling back to local store:', err)
    }
  }

  // 2. Also inform FastAPI backend in-memory registry
  try {
    await fetch(`${API_BASE}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    })
  } catch {}

  // 3. Fallback to LocalStorage
  const current = getMockIncidents()
  const updated = [newRecord, ...current.filter((i) => i.id !== newRecord.id)]
  saveMockIncidents(updated)
  return newRecord
}

export async function fetchIncidentRecords(userId?: string): Promise<IncidentRecord[]> {
  // 1. Attempt Supabase fetch
  if (supabase && isSupabaseConfigured) {
    try {
      let query = supabase
        .from('incident_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as IncidentRecord[]
      }
    } catch (err) {
      console.warn('Supabase fetch incidents failed, falling back:', err)
    }
  }

  // 2. Attempt Backend API fetch
  try {
    const res = await fetch(`${API_BASE}/api/incidents`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data as IncidentRecord[]
      }
    }
  } catch {}

  // 3. LocalStorage fallback
  return getMockIncidents()
}

export async function deleteIncidentRecord(incidentId: string): Promise<boolean> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('incident_records').delete().eq('id', incidentId)
    } catch {}
  }

  try {
    await fetch(`${API_BASE}/api/incidents/${incidentId}`, { method: 'DELETE' })
  } catch {}

  const current = getMockIncidents()
  const updated = current.filter((i) => i.id !== incidentId)
  saveMockIncidents(updated)
  return true
}

export async function generateRCADraftFromBackend(params: {
  sessionId?: string
  incidentTitle?: string
  severity?: string
  customNotes?: string
  nvidiaApiKey?: string
}): Promise<{
  incident_title: string
  severity: string
  executive_summary: string
  root_causes: any[]
  timeline: any[]
  recommendations: string[]
  rca_draft_markdown: string
  generated_at: string
}> {
  const res = await fetch(`${API_BASE}/api/incidents/generate-rca`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: params.sessionId,
      incident_title: params.incidentTitle,
      severity: params.severity || 'MAJOR',
      custom_notes: params.customNotes,
      nvidia_api_key: params.nvidiaApiKey,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to generate RCA draft from backend')
  }
  return await res.json()
}
