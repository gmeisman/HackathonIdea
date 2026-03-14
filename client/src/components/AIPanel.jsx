import { useEffect, useRef, useState } from 'react'
import { useAI } from '../hooks/useAI.js'

function SilAvatar({ size = 'sm' }) {
  const cls = size === 'md'
    ? 'w-9 h-9 text-sm rounded-xl shadow-lg shadow-blue-500/20'
    : 'w-7 h-7 text-xs rounded-lg shadow-md'
  return (
    <div className={`${cls} bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold leading-none">S</span>
    </div>
  )
}

export default function AIPanel({
  screen,
  contextData = {},
  defaultPrompt,
  suggestions = [],
  recentInsights = [],
  description = "Ask Sil questions about your store's performance.",
}) {
  const { response, loading, error, ask } = useAI()
  const [input, setInput]   = useState('')
  const [chat, setChat]     = useState([])
  const prevRespRef  = useRef(null)
  const prevErrRef   = useRef(null)
  const bottomRef    = useRef(null)

  // Fire default prompt on mount/screen change
  useEffect(() => {
    if (defaultPrompt) {
      ask(defaultPrompt, contextData, screen)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Append Sil response to chat
  useEffect(() => {
    if (response && response !== prevRespRef.current) {
      prevRespRef.current = response
      setChat((prev) => [...prev, { role: 'sil', text: response }])
    }
  }, [response])

  // Append error as Sil message
  useEffect(() => {
    if (error && error !== prevErrRef.current) {
      prevErrRef.current = error
      setChat((prev) => [...prev, { role: 'sil', text: error, isError: true }])
    }
  }, [error])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, loading])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const prompt = input.trim()
    setInput('')
    setChat((prev) => [...prev, { role: 'user', text: prompt }])
    ask(prompt, contextData, screen)
  }

  function handleSuggestion(text) {
    setChat((prev) => [...prev, { role: 'user', text }])
    ask(text, contextData, screen)
  }

  const showSuggestions = suggestions.length > 0 && chat.length === 0 && !loading

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-xl border border-slate-800/80">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <SilAvatar size="md" />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Sil</p>
            <p className="text-xs text-slate-400 capitalize leading-tight">{screen} assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full transition-colors ${loading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-slate-400">{loading ? 'thinking...' : 'online'}</span>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div
        className="flex-1 px-4 py-4 space-y-3 overflow-y-auto"
        style={{ minHeight: '220px', maxHeight: '320px' }}
      >
        {/* Welcome / description shown when no chat yet */}
        {chat.length === 0 && !loading && (
          <div className="flex items-start gap-2.5">
            <SilAvatar />
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[88%]">
              <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
            </div>
          </div>
        )}

        {/* Chat history */}
        {chat.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="bg-blue-500 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[88%] shadow-lg shadow-blue-500/20">
                <p className="text-white text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2.5">
              <SilAvatar />
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 max-w-[88%] ${
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

        {/* Loading dots */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <SilAvatar />
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips ─────────────────────────────────── */}
      {showSuggestions && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-all text-left leading-snug"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Recent insights ──────────────────────────────────── */}
      {recentInsights.length > 0 && chat.length === 0 && !loading && (
        <div className="mx-4 mb-3 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
          <div className="px-4 py-2 border-b border-slate-700/50">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recent Insights</p>
          </div>
          <ul className="divide-y divide-slate-700/30">
            {recentInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-300 leading-snug">{insight.text}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{insight.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-1 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Sil..."
            className="flex-1 text-sm bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="text-sm bg-blue-500 text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium shrink-0 shadow-lg shadow-blue-500/20"
          >
            ↑
          </button>
        </form>
      </div>

    </div>
  )
}
