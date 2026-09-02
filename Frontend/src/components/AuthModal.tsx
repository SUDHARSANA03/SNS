import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    loginUser,
  } = useSession()

  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('SRE Engineer')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthModalOpen) return null

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      const displayName = email ? email.split('@')[0] : 'SRE Engineer'
      loginUser({
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        email: email || 'engineer@incident-ai.com',
        role: role || 'SRE Engineer',
      })
      setIsSubmitting(false)
      navigate('/console')
    }, 400)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      loginUser({
        name: name || 'SRE Engineer',
        email: email || 'new.user@incident-ai.com',
        role: role || 'SRE Engineer',
      })
      setIsSubmitting(false)
      navigate('/console')
    }, 400)
  }

  const handleDemoLogin = () => {
    loginUser({
      name: 'Arjun Patel',
      email: 'arjun.patel@incident-ai.com',
      role: 'Lead SRE Engineer',
    })
    navigate('/console')
  }

  return (
    <div className="process-overlay">
      <div className="log-modal auth-modal reveal-up in-view">
        <div className="modal-top">
          <div className="modal-title-wrap">
            <span className="modal-kicker">INCIDENT AI AUTHENTICATION</span>
            <h2>{authModalMode === 'login' ? 'Sign In to Console' : 'Create New Account'}</h2>
            <p className="modal-desc">
              {authModalMode === 'login'
                ? 'Enter your credentials to access the incident triage command center.'
                : 'Register a new engineering profile to start autonomous log monitoring.'}
            </p>
          </div>
          <button className="process-close" onClick={closeAuthModal} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${authModalMode === 'login' ? 'active' : ''}`}
            onClick={() => openAuthModal('login')}
          >
            🔒 Sign In
          </button>
          <button
            type="button"
            className={`modal-tab ${authModalMode === 'signup' ? 'active' : ''}`}
            onClick={() => openAuthModal('signup')}
          >
            ✨ Sign Up (New User)
          </button>
        </div>

        {/* LOGIN FORM */}
        {authModalMode === 'login' && (
          <form className="tab-content" onSubmit={handleSignIn}>
            <div className="auth-input-group">
              <label className="auth-label">Work Email Address</label>
              <input
                type="email"
                required
                className="feed-search auth-field"
                placeholder="engineer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                required
                className="feed-search auth-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-toggle-row">
              <span className="auth-toggle-text">
                New to Incident AI?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => openAuthModal('signup')}
                >
                  Create an account →
                </button>
              </span>
            </div>

            <div className="modal-actions auth-actions">
              <button
                type="button"
                className="btn sm"
                onClick={handleDemoLogin}
                title="Quick login for instant testing"
              >
                ⚡ Instant Demo Login
              </button>
              <button
                type="submit"
                className="btn primary lg glow"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In →'}
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {authModalMode === 'signup' && (
          <form className="tab-content" onSubmit={handleSignUp}>
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                required
                className="feed-search auth-field"
                placeholder="Arjun Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Work Email Address</label>
              <input
                type="email"
                required
                className="feed-search auth-field"
                placeholder="engineer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                required
                className="feed-search auth-field"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Engineering Role / Title</label>
              <select
                className="feed-search auth-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="SRE Engineer">SRE Engineer</option>
                <option value="DevOps Lead">DevOps Lead</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="System Administrator">System Administrator</option>
              </select>
            </div>

            <div className="auth-toggle-row">
              <span className="auth-toggle-text">
                Already registered?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => openAuthModal('login')}
                >
                  Log In →
                </button>
              </span>
            </div>

            <div className="modal-actions auth-actions">
              <button
                type="button"
                className="btn"
                onClick={closeAuthModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary lg glow"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account & Enter →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
