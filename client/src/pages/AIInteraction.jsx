import { useState, useRef, useEffect } from 'react'
import { useAI } from '../hooks/useAI.js'

const SUGGESTED_PROMPTS = [
  'Which products should I restock this week?',
  'What are my best-selling products this month?',
  'Summarize open customer support tickets',
  'Which listings are underperforming and why?',
  'Give me a financial summary of the store',
]

export default function AIInteraction() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I have access to your store data — inventory, orders, listings, and support tickets. What would you like to know?' },
  ])
  const [input, setInput] = useState('')
  const { loading, ask } = useAI()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(prompt) {
    if (!prompt.trim() || loading) return
    const userMsg = { role: 'user', text: prompt }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const storeContext = { note: 'Full store context available via /api endpoints' }

    // Inline fetch so we can append streamed response to messages
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: storeContext, screen: 'ai-interaction' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ ${err.message}`, isError: true }])
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">AI Interaction</h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : msg.isError
                  ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                  : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm text-indigo-500 text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="text-xs border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 disabled:opacity-40 transition"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your store..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition font-medium text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
