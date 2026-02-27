import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import {
  Bot, User, LogOut, RefreshCw, Send, MessageSquareText,
  CheckCircle2, AlertCircle, Clock, Users,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATUS_COLORS = {
  open: { bg: '#052E16', text: '#4ADE80', dot: '#22C55E' },
  needs_human: { bg: '#2A0A0A', text: '#FCA5A5', dot: '#EF4444' },
  resolved: { bg: '#111827', text: '#9CA3AF', dot: '#4B5563' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'needs_human', label: 'Urgent' },
  { key: 'resolved', label: 'Resolved' },
]

export default function Dashboard({ businessId, onSignOut }) {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({ total: 0, open: 0, needs_human: 0, resolved: 0 })
  const [filter, setFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // ── Fetch conversations ──────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const params = { business_id: businessId }
      if (filter !== 'all') params.status = filter
      const { data } = await axios.get(`${API}/api/conversations`, { params })
      setConversations(data)
    } catch (_) {}
  }, [businessId, filter])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/stats`, { params: { business_id: businessId } })
      setStats(data)
    } catch (_) {}
  }, [businessId])

  useEffect(() => {
    fetchConversations()
    fetchStats()
    const id = setInterval(() => { fetchConversations(); fetchStats() }, 10000)
    return () => clearInterval(id)
  }, [fetchConversations, fetchStats])

  // ── Fetch messages when conversation selected ────────────────────────────
  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true)
    axios.get(`${API}/api/conversations/${selected.id}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [selected])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await axios.post(`${API}/api/conversations/${selected.id}/reply`, { message: reply.trim() })
      setReply('')
      const { data } = await axios.get(`${API}/api/conversations/${selected.id}/messages`)
      setMessages(data)
      fetchConversations()
    } catch (_) {}
    setSending(false)
  }

  async function handleTakeover() {
    if (!selected) return
    await axios.post(`${API}/api/conversations/${selected.id}/takeover`)
    const updated = { ...selected, ai_handling: false, status: 'needs_human' }
    setSelected(updated)
    fetchConversations()
  }

  async function handleResolve() {
    if (!selected) return
    await axios.post(`${API}/api/conversations/${selected.id}/resolve`)
    const updated = { ...selected, status: 'resolved', ai_handling: false }
    setSelected(updated)
    fetchConversations()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function timeAgo(iso) {
    try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) }
    catch { return '' }
  }

  function StatusBadge({ status }) {
    const c = STATUS_COLORS[status] || STATUS_COLORS.resolved
    return (
      <span style={{ ...S.badge, backgroundColor: c.bg, color: c.text }}>
        <span style={{ ...S.badgeDot, backgroundColor: c.dot }} />
        {status === 'needs_human' ? 'Urgent' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.shell}>

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        {/* Brand + signout */}
        <div style={S.sideHead}>
          <div style={S.brand}>
            <div style={S.logoIcon}>
              <MessageSquareText size={16} color="#080C0A" strokeWidth={2.5} />
            </div>
            <span style={S.logoText}>Replify</span>
          </div>
          <button onClick={onSignOut} style={S.signOutBtn} title="Sign out">
            <LogOut size={16} color="#6B7280" />
          </button>
        </div>

        {/* Stats bar */}
        <div style={S.statsBar}>
          <StatBox icon={<Users size={13} color="#9CA3AF" />} label="Total" value={stats.total} />
          <StatBox icon={<CheckCircle2 size={13} color="#4ADE80" />} label="Open" value={stats.open} />
          <StatBox icon={<AlertCircle size={13} color="#EF4444" />} label="Urgent" value={stats.needs_human} />
          <StatBox icon={<Clock size={13} color="#6B7280" />} label="Done" value={stats.resolved} />
        </div>

        {/* Filter tabs */}
        <div style={S.filterRow}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ ...S.filterTab, ...(filter === f.key ? S.filterTabActive : {}) }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div style={S.convList}>
          {conversations.length === 0 && (
            <p style={S.emptyMsg}>No conversations yet</p>
          )}
          {conversations.map(conv => (
            <div key={conv.id}
              onClick={() => setSelected(conv)}
              style={{
                ...S.convItem,
                ...(selected?.id === conv.id ? S.convItemActive : {}),
              }}>
              <div style={S.convTop}>
                <span style={S.convNumber}>
                  {conv.customer_name || conv.customer_number}
                </span>
                <span style={S.convTime}>{timeAgo(conv.last_message_at)}</span>
              </div>
              <p style={S.convPreview}>{conv.last_message || '—'}</p>
              <div style={S.convMeta}>
                <StatusBadge status={conv.status} />
                {conv.ai_handling && (
                  <span style={S.aiChip}><Bot size={10} /> AI</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <main style={S.main}>
        {!selected ? (
          <div style={S.empty}>
            <MessageSquareText size={40} color="#1C2B1F" />
            <p style={{ color: '#374151', marginTop: '12px', fontSize: '14px' }}>
              Select a conversation
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={S.chatHeader}>
              <div style={S.chatHeaderLeft}>
                <div style={S.avatar}>
                  {(selected.customer_name || selected.customer_number).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={S.chatName}>
                    {selected.customer_name || selected.customer_number}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <StatusBadge status={selected.status} />
                    <span style={selected.ai_handling ? S.aiOn : S.aiOff}>
                      {selected.ai_handling ? <><Bot size={11} /> AI handling</> : <><User size={11} /> Human</>}
                    </span>
                  </div>
                </div>
              </div>
              <div style={S.chatActions}>
                {selected.status !== 'resolved' && selected.ai_handling && (
                  <button onClick={handleTakeover} style={S.takeoverBtn}>
                    Take Over
                  </button>
                )}
                {selected.status !== 'resolved' && (
                  <button onClick={handleResolve} style={S.resolveBtn}>
                    Resolve
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={S.msgArea}>
              {loadingMsgs && <p style={S.emptyMsg}>Loading…</p>}
              {messages.map(msg => (
                <Bubble key={msg.id} msg={msg} timeAgo={timeAgo} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {selected.status !== 'resolved' && (
              <div style={S.replyBox}>
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
                  style={S.replyInput}
                  rows={2}
                  onFocus={e => (e.target.style.borderColor = '#00E676')}
                  onBlur={e => (e.target.style.borderColor = '#1C2B1F')}
                />
                <button onClick={handleSend} disabled={sending || !reply.trim()} style={{
                  ...S.sendBtn,
                  ...(sending || !reply.trim() ? S.sendBtnDisabled : {}),
                }}>
                  <Send size={16} />
                </button>
              </div>
            )}
            {selected.status === 'resolved' && (
              <div style={S.resolvedBanner}>
                <CheckCircle2 size={14} color="#4B5563" /> Conversation resolved
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ icon, label, value }) {
  return (
    <div style={S.statBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        {icon}
        <span style={S.statLabel}>{label}</span>
      </div>
      <span style={S.statValue}>{value}</span>
    </div>
  )
}

function Bubble({ msg, timeAgo }) {
  const isCustomer = msg.role === 'user'
  const isAgent = msg.role === 'human_agent'
  const isAI = msg.role === 'assistant'

  const bubbleStyle = {
    ...S.bubble,
    ...(isCustomer ? S.bubbleCustomer : {}),
    ...(isAI ? S.bubbleAI : {}),
    ...(isAgent ? S.bubbleAgent : {}),
    alignSelf: isCustomer ? 'flex-start' : 'flex-end',
  }

  const roleLabel = isCustomer ? 'Customer' : isAI ? 'AI' : 'You'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignSelf: isCustomer ? 'flex-start' : 'flex-end', maxWidth: '70%' }}>
      <span style={{ ...S.roleLabel, textAlign: isCustomer ? 'left' : 'right' }}>{roleLabel}</span>
      <div style={bubbleStyle}>
        <p style={S.bubbleText}>{msg.content}</p>
      </div>
      <span style={{ ...S.msgTime, textAlign: isCustomer ? 'left' : 'right' }}>
        {timeAgo(msg.created_at)}
      </span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  shell: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#080C0A',
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: 'hidden',
  },
  sidebar: {
    width: '300px',
    flexShrink: 0,
    backgroundColor: '#0A100C',
    borderRight: '1px solid #1C2B1F',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sideHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    borderBottom: '1px solid #1C2B1F',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: {
    width: '28px', height: '28px', backgroundColor: '#00E676',
    borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '15px', fontWeight: '700', color: '#F9FAFB' },
  signOutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px', borderRadius: '6px', display: 'flex',
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    backgroundColor: '#1C2B1F',
    borderBottom: '1px solid #1C2B1F',
  },
  statBox: {
    backgroundColor: '#0A100C',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: { fontSize: '10px', color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: '18px', fontWeight: '700', color: '#F9FAFB' },
  filterRow: {
    display: 'flex',
    padding: '10px 12px',
    gap: '4px',
    borderBottom: '1px solid #1C2B1F',
  },
  filterTab: {
    flex: 1,
    padding: '5px 0',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6B7280',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  filterTabActive: {
    backgroundColor: '#0F2417',
    color: '#00E676',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
  },
  emptyMsg: {
    textAlign: 'center',
    color: '#374151',
    fontSize: '13px',
    padding: '32px 16px',
  },
  convItem: {
    padding: '12px 14px',
    borderBottom: '1px solid #0F1812',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  convItemActive: {
    backgroundColor: '#0F2417',
    borderLeft: '3px solid #00E676',
    paddingLeft: '11px',
  },
  convTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
  },
  convNumber: { fontSize: '13px', fontWeight: '600', color: '#F9FAFB' },
  convTime: { fontSize: '11px', color: '#4B5563' },
  convPreview: {
    fontSize: '12px',
    color: '#6B7280',
    margin: '0 0 6px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  convMeta: { display: 'flex', alignItems: 'center', gap: '6px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: '600', padding: '2px 7px',
    borderRadius: '999px',
  },
  badgeDot: { width: '5px', height: '5px', borderRadius: '50%' },
  aiChip: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', color: '#60A5FA', backgroundColor: '#0C1A2E',
    padding: '2px 6px', borderRadius: '999px', fontWeight: '600',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#080C0A',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #1C2B1F',
    backgroundColor: '#0A100C',
    flexShrink: 0,
  },
  chatHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    backgroundColor: '#0F2417', color: '#00E676',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', flexShrink: 0,
  },
  chatName: { fontSize: '14px', fontWeight: '600', color: '#F9FAFB' },
  aiOn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', color: '#60A5FA', fontWeight: '500',
  },
  aiOff: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', color: '#F97316', fontWeight: '500',
  },
  chatActions: { display: 'flex', gap: '8px' },
  takeoverBtn: {
    padding: '7px 14px', fontSize: '12px', fontWeight: '700',
    backgroundColor: '#431407', color: '#F97316',
    border: '1px solid #7C2D12', borderRadius: '7px', cursor: 'pointer',
  },
  resolveBtn: {
    padding: '7px 14px', fontSize: '12px', fontWeight: '700',
    backgroundColor: '#052E16', color: '#4ADE80',
    border: '1px solid #166534', borderRadius: '7px', cursor: 'pointer',
  },
  msgArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: '12px',
    maxWidth: '100%',
  },
  bubbleCustomer: {
    backgroundColor: '#141A16',
    border: '1px solid #1C2B1F',
    borderBottomLeftRadius: '4px',
  },
  bubbleAI: {
    backgroundColor: '#0C1A2E',
    border: '1px solid #1E3A5F',
    borderBottomRightRadius: '4px',
  },
  bubbleAgent: {
    backgroundColor: '#1C0F00',
    border: '1px solid #7C2D12',
    borderBottomRightRadius: '4px',
  },
  bubbleText: {
    fontSize: '13px', color: '#E5E7EB', margin: 0,
    lineHeight: '1.6', whiteSpace: 'pre-wrap',
  },
  roleLabel: { fontSize: '10px', color: '#4B5563', fontWeight: '600', marginBottom: '3px' },
  msgTime: { fontSize: '10px', color: '#374151', marginTop: '3px' },
  replyBox: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #1C2B1F',
    backgroundColor: '#0A100C',
    flexShrink: 0,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#141A16',
    border: '1px solid #1C2B1F',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#F9FAFB',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    transition: 'border-color 0.15s',
  },
  sendBtn: {
    width: '38px', height: '38px', flexShrink: 0,
    backgroundColor: '#00E676', border: 'none', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#080C0A',
  },
  sendBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  resolvedBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', backgroundColor: '#0A100C',
    borderTop: '1px solid #1C2B1F',
    fontSize: '13px', color: '#4B5563', fontWeight: '500',
    flexShrink: 0,
  },
}
