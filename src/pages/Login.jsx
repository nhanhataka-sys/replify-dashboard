import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, MessageSquareText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login({ onNeedSignup }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, AuthContext's onAuthStateChange fires and AppShell handles routing
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <MessageSquareText size={22} color="#080C0A" strokeWidth={2.5} />
          </div>
          <span style={styles.logoText}>Replify</span>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your dashboard</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <Mail size={16} color="#4B5563" style={styles.inputIcon} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} color="#4B5563" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...styles.input, paddingRight: '42px' }}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { ...styles.inputBlur, paddingRight: '42px' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                {showPassword
                  ? <EyeOff size={16} color="#4B5563" />
                  : <Eye size={16} color="#4B5563" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.submitBtn, ...styles.submitBtnDisabled } : styles.submitBtn}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <button type="button" onClick={onNeedSignup} style={styles.switchLink}>
            Get started
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#080C0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#0F1410',
    border: '1px solid #1C2B1F',
    borderRadius: '16px',
    padding: '40px 36px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    backgroundColor: '#00E676',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: '-0.3px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#F9FAFB',
    margin: '0 0 6px 0',
  },
  sub: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 28px 0',
  },
  errorBox: {
    backgroundColor: '#2A0A0A',
    border: '1px solid #7F1D1D',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '13px',
    color: '#FCA5A5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#9CA3AF',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '13px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    backgroundColor: '#141A16',
    border: '1px solid #1C2B1F',
    borderRadius: '8px',
    padding: '10px 12px 10px 38px',
    fontSize: '14px',
    color: '#F9FAFB',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputFocus: {
    borderColor: '#00E676',
  },
  inputBlur: {
    borderColor: '#1C2B1F',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    marginTop: '6px',
    width: '100%',
    backgroundColor: '#00E676',
    color: '#080C0A',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  switchText: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#6B7280',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#00E676',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
  },
}
