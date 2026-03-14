import { useEffect, useRef, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import { useAI } from '../hooks/useAI.js'

const PRODUCT_ICONS = {
  'WH-001': '🎧', 'KB-001': '⌨️', 'GM-001': '🖱️',
  'WC-001': '📷', 'MS-001': '🖥️', 'UC-001': '🔌',
  'SB-001': '🔊', 'CC-001': '🔋',
}

const PRODUCT_GRADIENTS = [
  'from-blue-50 to-indigo-100',
  'from-violet-50 to-purple-100',
  'from-emerald-50 to-teal-100',
  'from-amber-50 to-orange-100',
  'from-pink-50 to-rose-100',
  'from-cyan-50 to-blue-100',
]

const STATUS_CONFIG = {
  'auto-posted':      { label: 'Auto-Posted',      bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'pending-approval': { label: 'Pending Approval',  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'live':             { label: 'Live',               bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  'rejected':         { label: 'Rejected',           bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
}

const TREND_COLORS = {
  up:     'text-green-600',
  stable: 'text-blue-500',
  down:   'text-red-500',
}

const TREND_ICONS = { up: '▲', stable: '●', down: '▼' }

function getMockRating(sku) {
  const hash = sku.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return (3.8 + (hash % 12) / 10).toFixed(1)
}

function StarRating({ rating }) {
  const full = Math.floor(parseFloat(rating))
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm leading-none ${i <= full ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-xs text-gray-400 ml-1.5">({rating})</span>
    </div>
  )
}

function ChannelBadge({ channel, status }) {
  if (status !== 'active') return null
  const styles = channel === 'eBay'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-orange-100 text-orange-800 border-orange-200'
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${styles}`}>
      {channel}
    </span>
  )
}

function AutoChannelBadge({ channel }) {
  const styles = channel === 'eBay'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-orange-100 text-orange-800 border-orange-200'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${styles}`}>
      {channel}
    </span>
  )
}

async function postAuditEntry(entry) {
  await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: new Date().toISOString(), ...entry }),
  })
}

// ── AutoListingCard ───────────────────────────────────────────────────────────

function AutoListingCard({ listing, onUpdated }) {
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy]         = useState(false)
  const cfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG['pending-approval']
  const icon = PRODUCT_ICONS[listing.sku] || '📦'
  const trendColor = TREND_COLORS[listing.trendData?.trend] || 'text-gray-500'
  const trendIcon  = TREND_ICONS[listing.trendData?.trend]  || '●'
  const growthAbs  = Math.abs(listing.trendData?.weeklyGrowth || 0)

  async function handleApprove() {
    setBusy(true)
    const res = await fetch(`/api/listings/auto-listings/${listing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'live' }),
    })
    if (res.ok) {
      await postAuditEntry({
        actionType: 'auto-listing-approved',
        item: listing.productName,
        sku: listing.sku,
        amount: listing.recommendedPrice,
        reasoning: `User approved Sil auto-listing for ${listing.productName} on ${listing.channel} at $${listing.recommendedPrice}.`,
        status: 'auto-executed',
        channel: listing.channel,
      })
      onUpdated()
    }
    setBusy(false)
  }

  async function handleReject() {
    setBusy(true)
    const res = await fetch(`/api/listings/auto-listings/${listing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    if (res.ok) onUpdated()
    setBusy(false)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md
      ${listing.status === 'pending-approval' ? 'border-amber-200' : listing.status === 'live' ? 'border-green-200' : 'border-gray-100'}`}>
      {/* Status strip */}
      <div className={`h-1.5 w-full ${cfg.dot}`} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm leading-snug truncate">{listing.productName}</p>
              <p className="text-xs text-gray-400 font-mono">{listing.sku}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <AutoChannelBadge channel={listing.channel} />
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Price + trend */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">${listing.recommendedPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Sil recommended price</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${trendColor}`}>
              {trendIcon} {growthAbs}% WoW
            </p>
            <p className="text-xs text-gray-400">{listing.trendData?.category} · {listing.trendData?.demandScore}/10</p>
          </div>
        </div>

        {/* Revenue (if live) */}
        {listing.revenue > 0 && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <span className="text-green-500 text-sm">💰</span>
            <p className="text-sm font-semibold text-green-700">${listing.revenue.toLocaleString()} revenue generated</p>
          </div>
        )}

        {/* Sil's reasoning (expandable) */}
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium transition"
          >
            <span className="w-4 h-4 rounded bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">S</span>
            Sil's reasoning
            <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
          </button>
          {expanded && (
            <p className="mt-2 text-xs text-gray-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 leading-relaxed">
              {listing.silReasoning}
            </p>
          )}
        </div>

        {/* Actions for pending-approval */}
        {listing.status === 'pending-approval' && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApprove}
              disabled={busy}
              className="flex-1 text-xs bg-green-500 text-white px-3 py-2 rounded-xl hover:bg-green-600 disabled:opacity-40 transition font-semibold shadow-sm"
            >
              {busy ? '⏳' : '✓ Approve & Post'}
            </button>
            <button
              onClick={handleReject}
              disabled={busy}
              className="text-xs border border-gray-200 text-gray-500 px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition font-medium"
            >
              Reject
            </button>
          </div>
        )}

        {/* Created at */}
        <p className="text-xs text-gray-300">
          {new Date(listing.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// ── SilAutoListingsSection ────────────────────────────────────────────────────

function SilAutoListingsSection({ autoListings, onRefresh }) {
  const [evaluating, setEvaluating] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const pending  = autoListings.filter((al) => al.status === 'pending-approval').length
  const live     = autoListings.filter((al) => al.status === 'live').length
  const posted   = autoListings.filter((al) => al.status === 'auto-posted').length
  const active   = autoListings.filter((al) => al.status !== 'rejected')

  async function runEvaluate() {
    setEvaluating(true)
    setLastResult(null)
    try {
      const res  = await fetch('/api/listings/auto-evaluate', { method: 'POST' })
      const data = await res.json()
      setLastResult(data.evaluated)
      onRefresh()
    } catch {
      setLastResult(-1)
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-blue-500/25">
            S
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base">Sil Auto-Listings</h2>
            <p className="text-xs text-gray-400">
              {active.length} active · {pending > 0 && <span className="text-amber-600 font-medium">{pending} pending approval · </span>}
              {live} live · {posted} auto-posted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastResult !== null && lastResult >= 0 && (
            <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
              {lastResult === 0 ? 'No new candidates found' : `✓ ${lastResult} new listing${lastResult !== 1 ? 's' : ''} created`}
            </span>
          )}
          <button
            onClick={runEvaluate}
            disabled={evaluating}
            className="flex items-center gap-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition font-semibold shadow-sm shadow-blue-500/20"
          >
            {evaluating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>✦ Run Auto-Evaluate</>
            )}
          </button>
        </div>
      </div>

      {/* Cards */}
      {active.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-10 text-center">
          <p className="text-3xl mb-2">🤖</p>
          <p className="font-medium text-gray-600">No auto-listings yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Run Auto-Evaluate" to let Sil scan your inventory and market trends.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((al) => (
            <AutoListingCard key={al.id} listing={al} onUpdated={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── ListingCard ───────────────────────────────────────────────────────────────

function ListingCard({ listing, idx }) {
  const { response, loading, ask } = useAI()
  const [generated, setGenerated]   = useState(listing.description)
  const [posting, setPosting]       = useState({ ebay: false, amazon: false })
  const rating   = getMockRating(listing.sku)
  const gradient = PRODUCT_GRADIENTS[idx % PRODUCT_GRADIENTS.length]
  const icon     = PRODUCT_ICONS[listing.sku] || '📦'

  useEffect(() => {
    if (response) setGenerated(response)
  }, [response])

  async function generateDescription() {
    await ask(
      `Write a compelling 2-sentence product listing description for: "${listing.name}". Be specific, highlight benefits, and use persuasive language.`,
      { product: listing },
      'listings'
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className={`bg-gradient-to-br ${gradient} h-44 flex items-center justify-center relative`}>
        <span className="text-6xl">{icon}</span>
        <div className="absolute top-3 left-3 flex gap-2">
          <ChannelBadge channel="eBay"   status={listing.ebayStatus} />
          <ChannelBadge channel="Amazon" status={listing.amazonStatus} />
        </div>
        {listing.ebayStatus !== 'active' && listing.amazonStatus !== 'active' && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg">
              Inactive
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm leading-snug">{listing.name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{listing.sku}</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-bold text-gray-900">${listing.price.toFixed(2)}</p>
          <StarRating rating={rating} />
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>👁 {listing.views.toLocaleString()} views</span>
          <span>📦 {listing.sales30d} sold/30d</span>
        </div>
        {generated && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed">
            {generated}
          </p>
        )}
        <div className="flex gap-2 pt-1 flex-wrap mt-auto">
          <button
            onClick={generateDescription}
            disabled={loading}
            className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-40 transition shadow-sm shadow-blue-500/20 font-medium"
          >
            {loading ? '⏳ Generating...' : '🤖 Sil Description'}
          </button>
          <button
            disabled={posting.ebay}
            onClick={async () => {
              setPosting((p) => ({ ...p, ebay: true }))
              await postAuditEntry({
                actionType: 'listing-post', item: listing.name, sku: listing.sku, amount: 0,
                reasoning: `User posted ${listing.name} to eBay. Sil-assisted listing with generated description.`,
                status: 'auto-executed',
              })
              setPosting((p) => ({ ...p, ebay: false }))
            }}
            className="text-xs border border-yellow-200 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg hover:bg-yellow-100 disabled:opacity-40 transition font-medium"
          >
            {posting.ebay ? '⏳' : 'Post to eBay'}
          </button>
          <button
            disabled={posting.amazon}
            onClick={async () => {
              setPosting((p) => ({ ...p, amazon: true }))
              await postAuditEntry({
                actionType: 'listing-post', item: listing.name, sku: listing.sku, amount: 0,
                reasoning: `User posted ${listing.name} to Amazon. Sil-assisted listing with generated description.`,
                status: 'auto-executed',
              })
              setPosting((p) => ({ ...p, amazon: false }))
            }}
            className="text-xs border border-orange-200 bg-orange-50 text-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition font-medium"
          >
            {posting.amazon ? '⏳' : 'Post to Amazon'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Listings() {
  const [listings, setListings]         = useState([])
  const [autoListings, setAutoListings] = useState([])

  function loadAll() {
    fetch('/api/listings').then((r) => r.json()).then(setListings)
    fetch('/api/listings/auto-listings').then((r) => r.json()).then(setAutoListings)
  }

  useEffect(() => { loadAll() }, [])

  const activeCount = listings.filter((l) => l.ebayStatus === 'active' || l.amazonStatus === 'active').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{listings.length} products · {activeCount} active</p>
        </div>
      </div>

      {/* Sil Auto-Listings section */}
      <SilAutoListingsSection autoListings={autoListings} onRefresh={loadAll} />

      <AIPanel
        screen="listings"
        contextData={{ allData: listings, filteredData: listings, activeFilters: {} }}
        defaultPrompt="Which listings have the strongest performance and which need improvement? Identify opportunities to optimize titles, descriptions, or pricing."
        description="Sil can review your listings, suggest description improvements, and identify pricing opportunities."
      />

      {/* All listings grid */}
      <div>
        <h2 className="font-bold text-gray-700 mb-4">All Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, idx) => (
            <ListingCard key={listing.id} listing={listing} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}
