import { useEffect, useState } from 'react'
import { useAI } from '../hooks/useAI.js'

export default function AIPanel({
  screen,
  contextData = {},
  defaultPrompt,
  suggestions = [],
  recentInsights = [],
  description = 'Ask questions about your store\'s performance, anomalies, and opportunities.',
}) {
  const { response, loading, error, ask } = useAI()
  const [input, setInput] = useState('')

  useEffect(() => {
    if (defaultPrompt) {
      ask(defaultPrompt, contextData, screen)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    ask(input.trim(), contextData, screen)
    setInput('')
  }

  function handleSuggestion(text) {
    ask(text, contextData, screen)
  }

  const showSuggestions = suggestions.length > 0 && !response && !loading && !error

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-indigo-100 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-sm leading-none">✦</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm leading-tight">AI Copilot</h3>
              <span className="text-xs text-indigo-400 font-medium">{screen}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs text-gray-400">{loading ? 'thinking' : 'ready'}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>

      {/* ── Suggestion chips ────────────────────────────────── */}
      {showSuggestions && (
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 hover:border-indigo-300 transition text-left leading-snug"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Response area ───────────────────────────────────── */}
      <div className={`px-5 flex-1 ${showSuggestions ? 'pt-1 pb-4' : 'py-4'}`}>
        {loading && (
          <div className="flex items-center gap-3 text-indigo-500 text-sm bg-indigo-50 rounded-xl px-4 py-3">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>Analyzing your store data...</span>
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {response && !loading && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {response}
          </div>
        )}
        {!loading && !response && !error && suggestions.length === 0 && (
          <p className="text-gray-400 text-sm italic">Ask the AI a question about this data.</p>
        )}
      </div>

      {/* ── Recent insights ─────────────────────────────────── */}
      {recentInsights.length > 0 && (
        <div className="mx-5 mb-4 border border-gray-100 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Insights</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {recentInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{insight.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{insight.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────── */}
      <div className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your store..."
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-gray-50 placeholder:text-gray-400 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium shrink-0"
          >
            Ask →
          </button>
        </form>
      </div>

    </div>
  )
}
