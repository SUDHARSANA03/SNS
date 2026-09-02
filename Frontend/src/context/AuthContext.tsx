import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  supabase,
  isSupabaseConfigured,
  UserProfile,
  SavedErrorRecord,
  saveUserErrorToSupabase,
  fetchUserSavedErrors,
  deleteSavedErrorFromSupabase,
  getStoredMockUser,
  setStoredMockUser,
} from '../services/supabaseClient'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isSupabaseLive: boolean
  savedErrors: SavedErrorRecord[]
  isLoadingErrors: boolean
  notification: string | null
  clearNotification: () => void
  saveError: (data: {
    log_id: string
    error_level: string
    message: string
    component?: string | null
    timestamp?: string | null
    summary?: string | null
    root_cause?: string | null
    notes?: string | null
    session_id?: string
  }) => Promise<SavedErrorRecord>
  removeError: (errorId: string) => Promise<void>
  isErrorSaved: (logId: string, sessionId?: string) => boolean
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, pass: string, name?: string, role?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshErrors: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredMockUser())
  const [savedErrors, setSavedErrors] = useState<SavedErrorRecord[]>([])
  const [isLoadingErrors, setIsLoadingErrors] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr))
    }, 4000)
  }

  const clearNotification = () => setNotification(null)

  // Listen for Supabase auth state if configured
  useEffect(() => {
    if (supabase && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'Incident AI Investigator',
            created_at: session.user.created_at,
          }
          setUser(profile)
          setStoredMockUser(profile)
        }
      })

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'Incident AI Investigator',
            created_at: session.user.created_at,
          }
          setUser(profile)
          setStoredMockUser(profile)
        } else {
          setUser(null)
          setStoredMockUser(null)
        }
      })

      return () => {
        authListener?.subscription.unsubscribe()
      }
    }
  }, [])

  // Load saved errors on mount or user change
  const refreshErrors = useCallback(async () => {
    setIsLoadingErrors(true)
    try {
      const records = await fetchUserSavedErrors(user?.id)
      setSavedErrors(records)
    } finally {
      setIsLoadingErrors(false)
    }
  }, [user?.id])

  useEffect(() => {
    refreshErrors()
  }, [refreshErrors])

  const isErrorSaved = useCallback(
    (logId: string, sessionId?: string) => {
      return savedErrors.some((e) => e.log_id === logId && (!sessionId || e.session_id === sessionId))
    },
    [savedErrors]
  )

  const saveError = useCallback(
    async (data: {
      log_id: string
      error_level: string
      message: string
      component?: string | null
      timestamp?: string | null
      summary?: string | null
      root_cause?: string | null
      notes?: string | null
      session_id?: string
    }) => {
      const saved = await saveUserErrorToSupabase({
        user_id: user?.id,
        session_id: data.session_id,
        log_id: data.log_id,
        error_level: data.error_level,
        message: data.message,
        component: data.component,
        timestamp: data.timestamp,
        summary: data.summary,
        root_cause: data.root_cause,
        notes: data.notes,
      })

      setSavedErrors((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)])
      showToast(`⭐ Error [${data.log_id}] successfully saved to your Profile!`)
      return saved
    },
    [user?.id]
  )

  const removeError = useCallback(async (errorId: string) => {
    await deleteSavedErrorFromSupabase(errorId)
    setSavedErrors((prev) => prev.filter((e) => e.id !== errorId))
    showToast('Error removed from profile history.')
  }, [])

  const login = async (email: string, pass: string) => {
    const isMock = email.endsWith('.internal') || email.includes('mock') || email.includes('sre') || email.includes('secops')

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      })

      if (!error && data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'Incident AI Investigator',
          created_at: data.user.created_at,
        }
        setUser(profile)
        setStoredMockUser(profile)
        showToast(`Welcome back, ${profile.full_name}!`)
        return { success: true }
      }

      // If it's a mock account, try auto-signing it up in Supabase
      if (isMock) {
        try {
          const signUpRes = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
              data: {
                full_name: email.includes('sre') ? 'Alex Morgan' : email.includes('sec') ? 'Elena Rostova' : 'Marcus Chen',
                role: email.includes('sec') ? 'Security Incident Responder' : 'Lead SRE Architect',
              },
            },
          })

          if (signUpRes.data?.user) {
            const profile: UserProfile = {
              id: signUpRes.data.user.id,
              email: signUpRes.data.user.email || email,
              full_name: signUpRes.data.user.user_metadata?.full_name || 'Investigator',
              role: signUpRes.data.user.user_metadata?.role || 'Lead SRE Architect',
              created_at: signUpRes.data.user.created_at,
            }
            setUser(profile)
            setStoredMockUser(profile)
            showToast(`Mock Profile Active (${profile.full_name})`)
            return { success: true }
          }
        } catch {
          // Fall through to mock session
        }

        // Seamless mock fallback for internal domain accounts
        const mockProfile: UserProfile = {
          id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          full_name: email.includes('sre') ? 'Alex Morgan' : email.includes('sec') ? 'Elena Rostova' : 'Marcus Chen',
          role: email.includes('sec') ? 'Security Incident Responder' : 'Lead SRE Architect',
          created_at: new Date().toISOString(),
        }
        setUser(mockProfile)
        setStoredMockUser(mockProfile)
        showToast(`Signed in with Mock Credentials (${mockProfile.full_name})`)
        return { success: true }
      }

      // If not a mock account, return real Supabase error
      if (error) return { success: false, error: error.message }
    }

    // Local sandbox login
    const localUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      full_name: email.split('@')[0].toUpperCase(),
      role: 'Site Reliability Engineer (SRE)',
      created_at: new Date().toISOString(),
    }
    setUser(localUser)
    setStoredMockUser(localUser)
    showToast(`Logged in as ${localUser.email}`)
    return { success: true }
  }

  const signup = async (email: string, pass: string, name?: string, role?: string) => {
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name || email.split('@')[0],
            role: role || 'Site Reliability Engineer (SRE)',
          },
        },
      })
      if (error) return { success: false, error: error.message }
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: name || email.split('@')[0],
          role: role || 'Site Reliability Engineer (SRE)',
          created_at: data.user.created_at,
        }
        setUser(profile)
        setStoredMockUser(profile)
        showToast(`Account created for ${profile.email}!`)
        return { success: true }
      }
    }

    // Local sandbox signup
    const localUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      full_name: name || email.split('@')[0],
      role: role || 'Incident Response Engineer',
      created_at: new Date().toISOString(),
    }
    setUser(localUser)
    setStoredMockUser(localUser)
    showToast(`Account created for ${localUser.email}`)
    return { success: true }
  }

  const logout = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setStoredMockUser(null)
    showToast('Signed out of Incident AI')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isSupabaseLive: isSupabaseConfigured,
        savedErrors,
        isLoadingErrors,
        notification,
        clearNotification,
        saveError,
        removeError,
        isErrorSaved,
        login,
        signup,
        logout,
        refreshErrors,
      }}
    >
      {children}
      {/* Toast Notification Banner */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(35, 20, 56, 0.95), rgba(16, 12, 28, 0.95))',
            border: '1px solid rgba(199, 125, 255, 0.5)',
            boxShadow: '0 10px 35px rgba(199, 125, 255, 0.3)',
            borderRadius: '14px',
            padding: '14px 20px',
            color: '#F5F1FA',
            fontSize: '13px',
            fontFamily: 'var(--font-mono, monospace)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(12px)',
            maxWidth: '420px',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <span style={{ color: '#E879F9', fontSize: '16px' }}>⚡</span>
          <span style={{ flex: 1 }}>{notification}</span>
          <button
            onClick={clearNotification}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A098B5',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
