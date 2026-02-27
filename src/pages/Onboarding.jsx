import { useState } from 'react'
import axios from 'axios'
import {
  Mail, Lock, Eye, EyeOff, Building2, Clock, MapPin,
  Package, Smartphone, Plus, Trash2, CheckCircle2, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STEPS = [
  'Create account',
  'Business details',
  'Hours & location',
  'Catalogue',
  'WhatsApp',
]

const emptyProduct = () => ({ name: '', price: '', size: '', description: '' })

export default function Onboarding({ onComplete }) {
  const { signUp } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Step 0
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState(null)

  // Step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethods, setPaymentMethods] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [greetingMessage, setGreetingMessage] = useState('')
  const [awayMessage, setAwayMessage] = useState('')

  // Step 2
  const [businessHours, setBusinessHours] = useState('')
  const [location, setLocation] = useState('')

  // Step 3
  const [catalogue, setCatalogue] = useState([emptyProduct()])

  // Step 4
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  function updateProduct(index, field, value) {
    setCatalogue(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addProduct() {
    setCatalogue(prev => [...prev, emptyProduct()])
  }

  function removeProduct(index) {
    setCatalogue(prev => prev.filter((_, i) => i !== index))
  }

  async function handleStep0() {
    setLoading(true)
    setError(null)
    const { data, error: signUpError } = await signUp(email, password)
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    setUserId(data.user?.id)
    setLoading(false)
    setStep(1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        user_id: userId,
        name,
        description,
        payment_methods: paymentMethods,
        delivery_info: deliveryInfo,
        greeting_message: greetingMessage,
        away_message: awayMessage,
        business_hours: businessHours,
        location,
        phone_number_id: phoneNumberId,
        access_token: accessToken,
        whatsapp_number: whatsappNumber,
        catalogue: catalogue.filter(p => p.name.trim()),
      }
      const { data } = await axios.post(`${API_URL}/api/businesses/register`, payload)
      setStep(5)
      onComplete?.(data.business_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    setError(null)
    if (step === 0) { handleStep0(); return }
    if (step === 4) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  function handleBack() {
    setError(null)
    setStep(s => s - 1)
  }

  // ─── Success ────────────────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle2 size={52} color="#00E676" />
          <h1 style={{ ...styles.heading, marginTop: '20px' }}>You're all set!</h1>
          <p style={{ ...styles.sub, marginBottom: '0' }}>
            Your business is live. WhatsApp messages will now be handled automatically by Replify.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#080C0A' }}>R</span>
          </div>
          <span style={styles.logoText}>Replify</span>
        </div>

        {/* Progress bar */}
        <div style={styles.progressWrap}>
          {STEPS.map((label, i) => (
            <div key={i} style={styles.progressStep}>
              <div style={{
                ...styles.progressDot,
                backgroundColor: i < step ? '#00E676' : i === step ? '#00E676' : '#1C2B1F',
                border: i === step ? '2px solid #00E676' : '2px solid transparent',
                transform: i === step ? 'scale(1.25)' : 'scale(1)',
              }} />
              {i < STEPS.length - 1 && (
                <div style={{
                  ...styles.progressLine,
                  backgroundColor: i < step ? '#00E676' : '#1C2B1F',
                }} />
              )}
            </div>
          ))}
        </div>
        <p style={styles.stepLabel}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* ── Step 0: Create account ── */}
        {step === 0 && (
          <div style={styles.fields}>
            <Field label="Email" icon={<Mail size={15} color="#4B5563" />}>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
            <Field label="Password" icon={<Lock size={15} color="#4B5563" />}
              suffix={
                <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={15} color="#4B5563" /> : <Eye size={15} color="#4B5563" />}
                </button>
              }>
              <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} required
                style={{ ...styles.input, paddingRight: '40px' }}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
          </div>
        )}

        {/* ── Step 1: Business details ── */}
        {step === 1 && (
          <div style={styles.fields}>
            <Field label="Business name" icon={<Building2 size={15} color="#4B5563" />}>
              <input type="text" placeholder="e.g. Scented Bliss" value={name}
                onChange={e => setName(e.target.value)} style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
            <TextareaField label="Description" value={description} onChange={setDescription}
              placeholder="What do you sell or offer?" />
            <TextareaField label="Payment methods" value={paymentMethods} onChange={setPaymentMethods}
              placeholder="e.g. EFT, Cash, Card" rows={2} />
            <TextareaField label="Delivery info" value={deliveryInfo} onChange={setDeliveryInfo}
              placeholder="e.g. Free delivery over R500, 2–4 days" rows={2} />
            <TextareaField label="Greeting message" value={greetingMessage} onChange={setGreetingMessage}
              placeholder="First message customers see" />
            <TextareaField label="Away message" value={awayMessage} onChange={setAwayMessage}
              placeholder="Message when you're closed" />
          </div>
        )}

        {/* ── Step 2: Hours & location ── */}
        {step === 2 && (
          <div style={styles.fields}>
            <Field label="Business hours" icon={<Clock size={15} color="#4B5563" />}>
              <input type="text" placeholder="e.g. Mon–Fri 09:00–17:00" value={businessHours}
                onChange={e => setBusinessHours(e.target.value)} style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
            <Field label="Location" icon={<MapPin size={15} color="#4B5563" />}>
              <input type="text" placeholder="e.g. Cape Town, South Africa" value={location}
                onChange={e => setLocation(e.target.value)} style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
          </div>
        )}

        {/* ── Step 3: Catalogue ── */}
        {step === 3 && (
          <div style={styles.fields}>
            <div style={styles.catalogueHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={15} color="#00E676" />
                <span style={styles.label}>Products</span>
              </div>
              <button type="button" onClick={addProduct} style={styles.addBtn}>
                <Plus size={13} /> Add product
              </button>
            </div>
            {catalogue.map((product, i) => (
              <div key={i} style={styles.productCard}>
                <div style={styles.productCardHeader}>
                  <span style={{ ...styles.label, color: '#6B7280' }}>Product {i + 1}</span>
                  {catalogue.length > 1 && (
                    <button type="button" onClick={() => removeProduct(i)} style={styles.removeBtn}>
                      <Trash2 size={13} color="#EF4444" />
                    </button>
                  )}
                </div>
                <div style={styles.productGrid}>
                  <div style={styles.fieldGroup}>
                    <span style={styles.label}>Name</span>
                    <input style={styles.inputSm} placeholder="Product name" value={product.name}
                      onChange={e => updateProduct(i, 'name', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = '#00E676')}
                      onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
                  </div>
                  <div style={styles.fieldGroup}>
                    <span style={styles.label}>Price</span>
                    <input style={styles.inputSm} placeholder="e.g. R850" value={product.price}
                      onChange={e => updateProduct(i, 'price', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = '#00E676')}
                      onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
                  </div>
                  <div style={styles.fieldGroup}>
                    <span style={styles.label}>Size</span>
                    <input style={styles.inputSm} placeholder="e.g. 50ml" value={product.size}
                      onChange={e => updateProduct(i, 'size', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = '#00E676')}
                      onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
                  </div>
                  <div style={{ ...styles.fieldGroup, gridColumn: '1 / -1' }}>
                    <span style={styles.label}>Description</span>
                    <input style={styles.inputSm} placeholder="Short description" value={product.description}
                      onChange={e => updateProduct(i, 'description', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = '#00E676')}
                      onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 4: WhatsApp ── */}
        {step === 4 && (
          <div style={styles.fields}>
            <p style={{ ...styles.sub, marginBottom: '4px' }}>
              Find these in your Meta Developer app under <strong style={{ color: '#9CA3AF' }}>WhatsApp → API Setup</strong>.
            </p>
            <Field label="Phone Number ID" icon={<Smartphone size={15} color="#4B5563" />}>
              <input type="text" placeholder="e.g. 123456789" value={phoneNumberId}
                onChange={e => setPhoneNumberId(e.target.value)} style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
            <Field label="WhatsApp Number" icon={<Smartphone size={15} color="#4B5563" />}>
              <input type="text" placeholder="e.g. +27 81 234 5678" value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)} style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')} />
            </Field>
            <div style={styles.fieldGroup}>
              <span style={styles.label}>Access Token</span>
              <textarea
                placeholder="Paste your temporary or permanent access token"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                rows={3}
                style={styles.textarea}
                onFocus={e => (e.target.style.borderColor = '#00E676')}
                onBlur={e => (e.target.style.borderColor = '#1C2B1F')}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={styles.nav}>
          {step > 0 && (
            <button type="button" onClick={handleBack} style={styles.backBtn}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            style={{ ...styles.continueBtn, ...(loading ? styles.disabled : {}), marginLeft: step === 0 ? 'auto' : undefined }}
          >
            {loading ? 'Please wait…' : step === 4 ? 'Finish setup' : 'Continue'}
            {!loading && step < 4 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, icon, suffix, children }) {
  return (
    <div style={styles.fieldGroup}>
      <span style={styles.label}>{label}</span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && <span style={styles.inputIcon}>{icon}</span>}
        {children}
        {suffix}
      </div>
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={styles.fieldGroup}>
      <span style={styles.label}>{label}</span>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={styles.textarea}
        onFocus={e => (e.target.style.borderColor = '#00E676')}
        onBlur={e => (e.target.style.borderColor = '#1C2B1F')}
      />
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#080C0A',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '32px 24px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#0F1410',
    border: '1px solid #1C2B1F',
    borderRadius: '16px',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  logoIcon: {
    width: '34px',
    height: '34px',
    backgroundColor: '#00E676',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F9FAFB',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  progressStep: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  progressLine: {
    flex: 1,
    height: '2px',
    transition: 'background-color 0.2s',
  },
  stepLabel: {
    fontSize: '12px',
    color: '#6B7280',
    margin: '0 0 24px 0',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#F9FAFB',
    margin: '0 0 6px 0',
  },
  sub: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '0 0 20px 0',
    lineHeight: '1.6',
  },
  errorBox: {
    backgroundColor: '#2A0A0A',
    border: '1px solid #7F1D1D',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '16px',
  },
  errorText: {
    fontSize: '13px',
    color: '#FCA5A5',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '28px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
    display: 'flex',
  },
  input: {
    width: '100%',
    backgroundColor: '#141A16',
    border: '1px solid #1C2B1F',
    borderRadius: '8px',
    padding: '10px 12px 10px 36px',
    fontSize: '14px',
    color: '#F9FAFB',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputSm: {
    width: '100%',
    backgroundColor: '#141A16',
    border: '1px solid #1C2B1F',
    borderRadius: '7px',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#F9FAFB',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#141A16',
    border: '1px solid #1C2B1F',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#F9FAFB',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    lineHeight: '1.5',
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
  catalogueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'transparent',
    border: '1px solid #1C2B1F',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    color: '#00E676',
    cursor: 'pointer',
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#0A100C',
    border: '1px solid #1C2B1F',
    borderRadius: '10px',
    padding: '14px',
  },
  productCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: 'auto',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'transparent',
    border: '1px solid #1C2B1F',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontWeight: '500',
  },
  continueBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#00E676',
    color: '#080C0A',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}
