import { useState, useRef, useEffect } from 'react'
import { BASE_URL } from '../lib/api.js'

const SUGGESTED_PROMPTS = [
  'Which products should I restock this week?',
  'What are my best-selling products this month?',
  'Summarize open customer support tickets',
  'Which listings are underperforming and why?',
  'Give me a financial summary of the store',
]

function SilAvatar({ size = 'md' }) {
  const cls = size === 'lg'
    ? 'w-12 h-12 text-base rounded-2xl shadow-xl shadow-blue-500/20'
    : 'w-9 h-9 text-sm rounded-xl shadow-lg shadow-blue-500/20'
  return (
    <div className={`${cls} bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold leading-none">S</span>
    </div>
  )
}

export default function AIInteraction() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm Sil, your AI store assistant. I have access to your full store data — inventory, orders, listings, and support tickets. What would you like to know?" },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(prompt) {
    if (!prompt.trim() || loading) return
    setMessages((prev) => [...prev, { role: 'user', text: prompt }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: { note: 'Full store context available via /api endpoints' },
          screen: 'ai-interaction',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ ${err.message}`, isError: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[800px]">

      {/* Page title */}
      <div className="mb-4 flex items-center gap-3">
        <SilAvatar size="lg" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sil Chat</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Online · Full Store Access</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-xl border border-slate-800/80">

        {/* Messages */}
        <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto">
          {messages.map((msg, i) =>
            msg.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="bg-blue-500 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl shadow-lg shadow-blue-500/20">
                  <p className="text-white text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-3">
                <SilAvatar />
                <div className={`rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl ${
                  msg.isError ? 'bg-red-900/40 border border-red-700/40' : 'bg-slate-800'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.isError ? 'text-red-300' : 'text-slate-200'
                  }`}>
                    {msg.text}
                  </p>
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex items-start gap-3">
              <SilAvatar />
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="flex gap-1 items-center h-5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div className="px-5 py-3 border-t border-slate-800 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-2">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sil anything about your store..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-40 transition font-semibold text-sm shadow-lg shadow-blue-500/20"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
