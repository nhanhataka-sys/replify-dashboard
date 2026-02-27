import { useEffect, useState } from 'react'
import axios from 'axios'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import { MessageSquareText } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Top-level shell — just provides auth context ─────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

// ── State machine ─────────────────────────────────────────────────────────────
// view: 'checking' | 'login' | 'onboarding' | 'dashboard'
function AppShell() {
  const { user, loading, signOut } = useAuth()
  const [view, setView] = useState('checking')
  const [businessId, setBusinessId] = useState(null)

  // When auth state resolves, determine which view to show
  useEffect(() => {
    if (loading) return  // still waiting for session check

    if (!user) {
      setView('login')
      return
    }

    // User is authenticated — look up their business
    setView('checking')
    axios
      .get(`${API}/api/businesses/me`, { params: { user_id: user.id } })
      .then(({ data }) => {
        setBusinessId(data.id)
        setView('dashboard')
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setView('onboarding')
        } else {
          // Network error etc. — still try onboarding rather than blank screen
          setView('onboarding')
        }
      })
  }, [user, loading])

  async function handleSignOut() {
    await signOut()
    setBusinessId(null)
    setView('login')
  }

  function handleOnboardingComplete(id) {
    setBusinessId(id)
    setView('dashboard')
  }

  // ── Views ──────────────────────────────────────────────────────────────────
  if (view === 'checking') return <LoadingScreen />

  if (view === 'login') {
    return (
      <Login onNeedSignup={() => setView('onboarding')} />
    )
  }

  if (view === 'onboarding') {
    return (
      <Onboarding onComplete={handleOnboardingComplete} />
    )
  }

  if (view === 'dashboard') {
    return (
      <Dashboard
        businessId={businessId}
        onSignOut={handleSignOut}
      />
    )
  }

  return null
}

// ── Loading screen ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={S.page}>
      <div style={S.inner}>
        <div style={S.logoIcon}>
          <MessageSquareText size={20} color="#080C0A" strokeWidth={2.5} />
        </div>
        <div style={S.spinner} />
      </div>
    </div>
  )
}

const S = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#080C0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#00E676',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #1C2B1F',
    borderTop: '2px solid #00E676',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

// Inject keyframe into document head once
if (!document.getElementById('replify-spin')) {
  const style = document.createElement('style')
  style.id = 'replify-spin'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}
