import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail, User, Shield, ArrowRight, Sparkles, CheckCircle, Database, Key, Check, Zap, Laptop, ShieldCheck } from 'lucide-react'
import { InteractiveBackground } from '../../components/ui/InteractiveBackground'
import { Footer } from '../../components/common/Footer'
import { useAuth } from '../../context/AuthContext'

interface MockAccount {
  id: string
  name: string
  role: string
  email: string
  pass: string
  avatarBg: string
  badgeText: string
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'sre_lead',
    name: 'Alex Morgan',
    role: 'Lead SRE Architect',
    email: 'lead.sre@incident-ai.internal',
    pass: 'DevOps@2026!',
    avatarBg: 'linear-gradient(135deg, #C77DFF, #7B2CBF)',
    badgeText: 'COMMANDER',
  },
  {
    id: 'sec_ops',
    name: 'Elena Rostova',
    role: 'Security Incident Responder',
    email: 'secops@incident-ai.internal',
    pass: 'SecOps#Root99',
    avatarBg: 'linear-gradient(135deg, #9D4EDD, #3A0CA3)',
    badgeText: 'SECURITY',
  },
  {
    id: 'devops_eng',
    name: 'Marcus Chen',
    role: 'Cloud Infrastructure Lead',
    email: 'cloud.lead@incident-ai.internal',
    pass: 'Cloud*Cluster77',
    avatarBg: 'linear-gradient(135deg, #E879F9, #C77DFF)',
    badgeText: 'INFRA',
  },
]

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const [mode, setMode] = useState<'signin' | 'signup'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('DevOps / SRE Engineer')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedMockId, setSelectedMockId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const mockSectionRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const { login, signup, isSupabaseLive } = useAuth()

  const handleApplyMock = (account: MockAccount) => {
    setSelectedMockId(account.id)
    setEmail(account.email)
    setPassword(account.pass)
    setFullName(account.name)
    setRole(account.role)
    setMode('signin')
    setErrorMsg('')
    setSuccessMsg(`Mock credentials applied: ${account.name} (${account.role})`)

    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }

  const handleInstantLogin = async (account: MockAccount) => {
    handleApplyMock(account)
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await login(account.email, account.pass)
      if (res.success) {
        setSuccessMsg(`Logged in as ${account.name}!`)
        setTimeout(() => {
          navigate('/console', { state: { view: 'profile' } })
        }, 600)
      } else {
        setErrorMsg(res.error || 'Login failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsLoading(true)

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }

    try {
      if (mode === 'signin') {
        const res = await login(email, password)
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.')
        } else {
          setSuccessMsg('Successfully logged in!')
          setTimeout(() => {
            navigate('/console', { state: { view: 'profile' } })
          }, 700)
        }
      } else {
        const res = await signup(email, password, fullName, role)
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.')
        } else {
          setSuccessMsg('Account created successfully!')
          setTimeout(() => {
            navigate('/console', { state: { view: 'profile' } })
          }, 800)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToMock = () => {
    if (mockSectionRef.current) {
      mockSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const copyCreds = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0A0810] text-[#F5F1FA] flex flex-col selection:bg-[#C77DFF]/25 selection:text-white relative font-serif-luxury overflow-x-hidden">
      {/* Cinematic Interactive Particle Canvas */}
      <InteractiveBackground />

      {/* Top Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-30 border-b border-[#3A2E52]/60 bg-[#0A0810]/85 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-neutral-950 border border-[#C77DFF]/50 flex items-center justify-center text-[#C77DFF] font-mono font-bold shadow-[0_0_15px_rgba(199,125,255,0.35)]">
            AI
          </div>
          <div>
            <div className="font-bold tracking-wider text-sm font-mono text-white flex items-center gap-2">
              <span>INCIDENT AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C77DFF]/15 text-[#C77DFF] border border-[#C77DFF]/35 font-semibold">
                SECURITY
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-sans block tracking-widest uppercase">
              Autonomous Incident Triage
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15111F] border border-[#3A2E52] text-xs font-mono text-neutral-300">
            <Database className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Supabase: rdzvgewdqqnnhhredsxk</span>
          </div>

          <button
            onClick={scrollToMock}
            className="px-3.5 py-2 rounded-xl bg-[#C77DFF]/15 border border-[#C77DFF]/40 text-xs font-mono text-[#C77DFF] hover:bg-[#C77DFF]/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Mock Credentials</span>
          </button>

          <button
            onClick={() => navigate('/console', { state: { view: 'profile' } })}
            className="px-4 py-2 rounded-xl bg-[#15111F]/90 border border-[#3A2E52] hover:border-[#C77DFF]/60 text-xs font-mono text-neutral-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Console Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Two-Column Auth & Mock Credentials Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Login / Sign Up Form Card (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#C77DFF]/30 via-[#9D4EDD]/20 to-[#E879F9]/30 blur-xl opacity-70"></div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative rounded-3xl border border-[#3A2E52]/90 bg-[#120E1E]/90 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl"
              >
                {/* Badge */}
                <div className="flex justify-between items-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-[#C77DFF]/35 text-xs text-[#C77DFF] shadow-[0_0_12px_rgba(199,125,255,0.2)]">
                    <Sparkles className="w-3.5 h-3.5 text-[#E879F9] animate-pulse" />
                    <span className="font-mono text-[11px] uppercase tracking-wider">
                      {mode === 'signin' ? 'Investigator Access' : 'Create Investigator Profile'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400">
                    Supabase Auth Enabled
                  </span>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <h1 className="text-3xl font-black text-white tracking-tight font-serif-luxury">
                    {mode === 'signin' ? 'Investigator Sign In' : 'Join Incident AI'}
                  </h1>
                  <p className="text-neutral-400 text-xs mt-1.5 font-sans">
                    {mode === 'signin'
                      ? 'Authenticate with Supabase credentials or select from the mock presets.'
                      : 'Register your investigator profile to persist error telemetry in Supabase.'}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-black/50 border border-[#3A2E52]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setErrorMsg('')
                      setSuccessMsg('')
                    }}
                    className={`py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-gradient-to-r from-[#C77DFF] to-[#A855F7] text-black shadow-[0_0_15px_rgba(199,125,255,0.4)]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup')
                      setErrorMsg('')
                      setSuccessMsg('')
                    }}
                    className={`py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-gradient-to-r from-[#C77DFF] to-[#A855F7] text-black shadow-[0_0_15px_rgba(199,125,255,0.4)]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    SIGN UP
                  </button>
                </div>

                {/* Notifications */}
                {errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-sans">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-sans flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {mode === 'signup' && (
                      <motion.div
                        key="signup-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div>
                          <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                            Full Name / Callout
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-[#A098B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              placeholder="Alex Morgan"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-[#3A2E52] focus:border-[#C77DFF] text-white text-sm outline-none transition-colors font-sans placeholder-neutral-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                            Operational Role
                          </label>
                          <div className="relative">
                            <Shield className="w-4 h-4 text-[#A098B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <select
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-[#3A2E52] focus:border-[#C77DFF] text-white text-sm outline-none transition-colors font-sans"
                            >
                              <option value="DevOps / SRE Engineer" className="bg-[#120E1E] text-white">
                                DevOps / SRE Engineer
                              </option>
                              <option value="Security Incident Responder" className="bg-[#120E1E] text-white">
                                Security Incident Responder
                              </option>
                              <option value="Cloud Infrastructure Lead" className="bg-[#120E1E] text-white">
                                Cloud Infrastructure Lead
                              </option>
                              <option value="Backend Software Engineer" className="bg-[#120E1E] text-white">
                                Backend Software Engineer
                              </option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#A098B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        ref={emailInputRef}
                        type="email"
                        required
                        placeholder="engineer@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-[#3A2E52] focus:border-[#C77DFF] text-white text-sm outline-none transition-colors font-sans placeholder-neutral-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#A098B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-[#3A2E52] focus:border-[#C77DFF] text-white text-sm outline-none transition-colors font-sans placeholder-neutral-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-[#C77DFF] via-[#A855F7] to-[#E879F9] text-black font-mono font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(199,125,255,0.35)] hover:shadow-[0_0_30px_rgba(199,125,255,0.6)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>PROCESSING...</span>
                      </span>
                    ) : (
                      <>
                        <span>{mode === 'signin' ? 'SIGN IN WITH CREDENTIALS' : 'CREATE PROFILE'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Bottom switcher */}
                <div className="mt-6 pt-6 border-t border-[#3A2E52]/60 text-center">
                  <p className="text-xs text-neutral-400 font-sans">
                    {mode === 'signin' ? "Don't have an investigator account?" : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin')
                        setErrorMsg('')
                        setSuccessMsg('')
                      }}
                      className="text-[#C77DFF] hover:underline font-mono font-semibold ml-1 cursor-pointer"
                    >
                      {mode === 'signin' ? 'Sign up now' : 'Sign in here'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT COLUMN: Mock Credentials Card (5 Cols) */}
          <div className="lg:col-span-5" ref={mockSectionRef}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="rounded-3xl border border-[#3A2E52] bg-[#15111F]/80 p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#C77DFF]/15 border border-[#C77DFF]/35 flex items-center justify-center text-[#C77DFF]">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-serif-luxury flex items-center gap-2">
                      <span>Mock Credentials</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#C77DFF]/20 text-[#E879F9] font-mono font-bold">
                        1-CLICK
                      </span>
                    </h2>
                    <span className="text-[11px] text-neutral-400 font-sans">
                      Select any account to auto-fill or log in instantly
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock accounts list */}
              <div className="space-y-3.5">
                {MOCK_ACCOUNTS.map((acc) => {
                  const isSelected = selectedMockId === acc.id
                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-[#C77DFF] bg-[#231538]/90 shadow-[0_0_20px_rgba(199,125,255,0.25)]'
                          : 'border-[#3A2E52]/80 bg-[#0E0B16]/80 hover:border-[#C77DFF]/50 hover:bg-[#1C152B]/60'
                      }`}
                      onClick={() => handleApplyMock(acc)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-black font-mono shadow-sm"
                            style={{ background: acc.avatarBg }}
                          >
                            {acc.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-sans flex items-center gap-2">
                              <span>{acc.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-[#C77DFF] font-mono font-bold border border-[#C77DFF]/30">
                                {acc.badgeText}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-sans block">
                              {acc.role}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#C77DFF] animate-pulse"></span>
                        )}
                      </div>

                      {/* Credentials display */}
                      <div className="mt-3 p-2.5 rounded-xl bg-black/60 border border-[#2D2242] space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between items-center text-neutral-300">
                          <span className="text-neutral-500">Email:</span>
                          <span className="text-[#E879F9] font-medium">{acc.email}</span>
                        </div>
                        <div className="flex justify-between items-center text-neutral-300">
                          <span className="text-neutral-500">Pass:</span>
                          <span className="text-neutral-300">{acc.pass}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApplyMock(acc)
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#2A1F40] hover:bg-[#3A2E58] border border-[#C77DFF]/30 text-neutral-200 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-[#C77DFF]" />
                          <span>Auto-Fill</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInstantLogin(acc)
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#C77DFF] to-[#A855F7] text-black text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(199,125,255,0.3)] cursor-pointer"
                        >
                          <Zap className="w-3 h-3 fill-black" />
                          <span>Fast Login</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Supabase connection details box */}
              <div className="p-4 rounded-2xl bg-black/50 border border-[#3A2E52]/80 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <Database className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>Supabase Backend</span>
                  </span>
                  <span className="text-[#34D399] font-bold">● Active</span>
                </div>
                <div className="text-[11px] text-neutral-400 break-all">
                  <b>Host:</b> https://rdzvgewdqqnnhhredsxk.supabase.co
                </div>
                <div className="text-[10px] text-neutral-500">
                  Saved error history and user profiles sync directly to this instance.
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Dark Footer */}
      <Footer theme="dark" />
    </div>
  )
}
