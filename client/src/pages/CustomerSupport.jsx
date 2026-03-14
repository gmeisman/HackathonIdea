import { useEffect, useRef, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import { useAI } from '../hooks/useAI.js'
import { BASE_URL } from '../lib/api.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent: { strip: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200',          label: 'URGENT' },
  high:   { strip: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'HIGH' },
  medium: { strip: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'MEDIUM' },
  low:    { strip: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500 border-gray-200',       label: 'LOW' },
}

const STATUS_CONFIG = {
  open:     'bg-blue-100 text-blue-700 border border-blue-200',
  pending:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
  closed:   'bg-green-100 text-green-700 border border-green-200',
  resolved: 'bg-green-100 text-green-700 border border-green-200',
}

const SENTIMENT_ICONS = {
  frustrated:   { icon: '😤', label: 'Frustrated',   color: 'bg-orange-50 text-orange-600 border-orange-200' },
  angry:        { icon: '😠', label: 'Angry',         color: 'bg-red-50 text-red-600 border-red-200' },
  neutral:      { icon: '😐', label: 'Neutral',       color: 'bg-gray-50 text-gray-600 border-gray-200' },
  positive:     { icon: '😊', label: 'Positive',      color: 'bg-green-50 text-green-600 border-green-200' },
  disappointed: { icon: '😞', label: 'Disappointed',  color: 'bg-slate-50 text-slate-600 border-slate-200' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function postAudit(entry) {
  await fetch(`${BASE_URL}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: new Date().toISOString(), ...entry }),
  })
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-[70] bg-green-500 text-white px-5 py-3.5 rounded-xl shadow-xl shadow-green-500/20 flex items-center gap-3 max-w-sm">
      <span className="text-lg leading-none shrink-0">✓</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="text-white/70 hover:text-white transition shrink-0 text-sm">✕</button>
    </div>
  )
}

// ─── Post Reply Modal ─────────────────────────────────────────────────────────

function PostReplyModal({ ticket, initialDraft, onClose, onPosted }) {
  const { response, loading: regenerating, ask } = useAI()
  const [draftText, setDraftText] = useState(initialDraft || '')
  const [posting, setPosting]     = useState(false)
  const [error, setError]         = useState(null)
  const prevRespRef = useRef(null)
  const textareaRef = useRef(null)

  // When Sil regenerates, update the draft text
  useEffect(() => {
    if (response && response !== prevRespRef.current) {
      prevRespRef.current = response
      setDraftText(response)
    }
  }, [response])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px` }
  }, [draftText])

  function regenerate() {
    ask(
      `Draft a professional, empathetic customer support reply for this ticket: "${ticket.subject}". Customer message: "${ticket.messages[0]?.text}". Keep it concise and solution-focused.`,
      { ticket },
      'support'
    )
  }

  async function postReply() {
    if (!draftText.trim()) return
    setPosting(true)
    setError(null)
    try {
      const res        = await fetch(`${BASE_URL}/api/support/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:     'resolved',
          reply:      draftText.trim(),
          resolvedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const updated = await res.json()

      await postAudit({
        actionType: 'support-reply',
        item:       `${ticket.id} (${ticket.customer})`,
        sku:        null,
        amount:     0,
        reasoning:  `Reply posted for ticket: "${ticket.subject}". Draft: "${draftText.slice(0, 100)}${draftText.length > 100 ? '...' : ''}"`,
        status:     'approved',
      })

      onPosted(updated)
    } catch (err) {
      setError(err.message)
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <span className="text-white font-bold text-sm leading-none">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Post Support Reply</p>
            <p className="text-xs text-slate-400 truncate">{ticket.id} · {ticket.customer}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 shrink-0">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Subject context */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Ticket</p>
            <p className="text-sm text-gray-700 font-medium">{ticket.subject}</p>
          </div>

          {/* Editable draft */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Reply draft</label>
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-40 transition font-medium"
              >
                {regenerating ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>✦ Regenerate</>
                )}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={6}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-gray-50 resize-none leading-relaxed"
              placeholder="Edit the reply before posting…"
            />
            <p className="text-xs text-gray-400 mt-1">{draftText.length} characters · Edit before posting if needed</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={postReply}
              disabled={posting || regenerating || !draftText.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 transition shadow-sm shadow-blue-500/20"
            >
              {posting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting…
                </>
              ) : (
                <>✓ Post Reply</>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Ticket card ─────────────────────────────────────────────────────────────

function TicketCard({ ticket, onTicketUpdated, onShowToast }) {
  const { response, loading, ask } = useAI()
  const [draft, setDraft]           = useState(null)
  const [showModal, setShowModal]   = useState(false)
  const prevRespRef = useRef(null)

  const priority  = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low
  const sentiment = SENTIMENT_ICONS[ticket.sentiment]
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed'

  async function draftReply() {
    await ask(
      `Draft a professional, empathetic customer support reply for this ticket: "${ticket.subject}". Customer message: "${ticket.messages[0]?.text}". Keep it concise and solution-focused.`,
      { ticket },
      'support'
    )
  }

  useEffect(() => {
    if (response && response !== prevRespRef.current) {
      prevRespRef.current = response
      setDraft(response)
      postAudit({
        actionType: 'support-reply',
        item: `${ticket.id} (${ticket.customer})`,
        sku: null, amount: 0,
        reasoning: `Sil drafted reply for ticket: "${ticket.subject}"`,
        status: 'auto-executed',
      })
    }
  }, [response])

  function handlePosted(updatedTicket) {
    setShowModal(false)
    onTicketUpdated(updatedTicket)
    onShowToast(`Reply posted — ${ticket.customer}'s ticket resolved ✓`)
  }

  return (
    <>
      {showModal && (
        <PostReplyModal
          ticket={ticket}
          initialDraft={draft}
          onClose={() => setShowModal(false)}
          onPosted={handlePosted}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
        {/* Priority strip */}
        <div className={`h-1.5 ${priority.strip}`} />

        <div className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  {ticket.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open}`}>
                  {ticket.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${priority.badge}`}>
                  {priority.label}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm leading-snug">{ticket.subject}</p>
              <p className="text-xs text-gray-400 mt-1">{ticket.customer} · {ticket.date}</p>
            </div>

            {sentiment && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium shrink-0 ${sentiment.color}`}>
                <span className="text-base leading-none">{sentiment.icon}</span>
                <span className="hidden sm:block">{sentiment.label}</span>
              </div>
            )}
          </div>

          {/* Customer message */}
          {ticket.messages[0] && (
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">Customer Message</p>
              <p className="text-sm text-gray-700 leading-relaxed">"{ticket.messages[0].text}"</p>
            </div>
          )}

          {/* Sil draft reply */}
          {draft && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-violet-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold leading-none">S</span>
                </div>
                <p className="text-xs text-blue-600 font-semibold">Sil Draft Reply</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{draft}</p>
            </div>
          )}

          {/* Resolved reply preview */}
          {isResolved && ticket.reply && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3.5">
              <p className="text-xs text-green-600 font-semibold mb-1">✓ Reply Posted</p>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{ticket.reply}</p>
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {!isResolved && (
              <>
                <button
                  onClick={draftReply}
                  disabled={loading}
                  className="flex items-center gap-2 text-xs bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-700 disabled:opacity-40 transition font-medium"
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Drafting…
                    </>
                  ) : (
                    <>✦ {draft ? 'Re-draft' : 'Sil Draft Reply'}</>
                  )}
                </button>

                {draft && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 text-xs bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition font-medium shadow-sm shadow-blue-500/20"
                  >
                    ✓ Post Reply
                  </button>
                )}
              </>
            )}

            {isResolved && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Resolved
              </span>
            )}

            <span className="text-xs text-gray-400 ml-auto">
              {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Customer Support page ────────────────────────────────────────────────────

export default function CustomerSupport() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter]   = useState('all')
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    fetch(`${BASE_URL}/api/support`).then((r) => r.json()).then(setTickets)
  }, [])

  function handleTicketUpdated(updatedTicket) {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)))
  }

  const filtered    = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)
  const openCount   = tickets.filter((t) => t.status === 'open').length
  const urgentCount = tickets.filter((t) => t.priority === 'urgent').length

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customer Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} total tickets</p>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {urgentCount} urgent
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full">
            {openCount} open
          </span>
        </div>
      </div>

      <AIPanel
        screen="support"
        contextData={{
          allData:      tickets,
          filteredData: filtered,
          activeFilters: { status: filter },
        }}
        defaultPrompt="Summarize open tickets by priority and sentiment. Which need immediate attention and what patterns do you see?"
        description="Sil can triage your support queue, spot patterns, and draft customer replies."
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'pending', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition ${
              filter === s
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({tickets.filter((t) => t.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ticket cards */}
      <div className="space-y-4">
        {filtered.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onTicketUpdated={handleTicketUpdated}
            onShowToast={(msg) => setToast(msg)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No {filter === 'all' ? '' : filter} tickets found.
          </div>
        )}
      </div>
    </div>
  )
}
