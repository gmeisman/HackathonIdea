import { useState, useCallback } from 'react'
import { BASE_URL } from '../lib/api.js'

export function useAI() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ask = useCallback(async (prompt, context = {}, screen = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, screen }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setResponse(data.text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResponse(null)
    setError(null)
  }, [])

  return { response, loading, error, ask, reset }
}
