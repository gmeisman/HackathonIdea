import { useEffect, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import { useAI } from '../hooks/useAI.js'

const priorityColors = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const sentimentIcons = {
  frustrated: '😤',
  angry: '😠',
  neutral: '😐',
  positive: '😊',
  disappointed: '😞',
}

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
}

async function postAuditEntry(entry) {
  await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: new Date().toISOString(), ...entry }),
  })
}

function TicketCard({ ticket }) {
  const { response, loading, ask } = useAI()
  const [draft, setDraft] = useState(null)

  async function draftReply() {
    await ask(
      `Draft a professional, empathetic customer support reply for this ticket: "${ticket.subject}". Customer message: "${ticket.messages[0]?.text}". Keep it concise and solution-focused.`,
      { ticket },
      'support'
    )
  }

  useEffect(() => {
    if (response) {
      setDraft(response)
      postAuditEntry({
        actionType: 'support-reply',
        item: `${ticket.id} (${ticket.customer})`,
        sku: null,
        amount: 0,
        reasoning: `AI drafted reply for ticket: "${ticket.subject}"`,
        status: 'auto-executed',
      })
    }
  }, [response])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs text-gray-400">{ticket.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
              {ticket.status}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>
          <p className="font-medium text-gray-800 text-sm">{ticket.subject}</p>
          <p className="text-xs text-gray-500 mt-0.5">{ticket.customer} · {ticket.date}</p>
        </div>
        <span className="text-xl shrink-0" title={ticket.sentiment}>
          {sentimentIcons[ticket.sentiment] || '💬'}
        </span>
      </div>

      {ticket.messages[0] && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100 leading-relaxed">
          "{ticket.messages[0].text}"
        </p>
      )}

      {draft && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs text-indigo-500 font-medium mb-1">🤖 AI Draft Reply</p>
          <p className="text-sm text-gray-700 leading-relaxed">{draft}</p>
        </div>
      )}

      {ticket.status !== 'closed' && (
        <button
          onClick={draftReply}
          disabled={loading}
          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition"
        >
          {loading ? '⏳ Drafting...' : '🤖 Draft Reply'}
        </button>
      )}
    </div>
  )
}

export default function CustomerSupport() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/support')
      .then((r) => r.json())
      .then(setTickets)
  }, [])

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)
  const openCount = tickets.filter((t) => t.status === 'open').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Customer Support</h1>
        <span className="text-sm text-gray-500">{openCount} open tickets</span>
      </div>

      <AIPanel
        screen="support"
        contextData={{
          allData: tickets,
          filteredData: filtered,
          activeFilters: { status: filter },
        }}
        defaultPrompt="Summarize open tickets by priority and sentiment. Which need immediate attention and what patterns do you see?"
      />

      <div className="flex gap-2">
        {['all', 'open', 'pending', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  )
}
