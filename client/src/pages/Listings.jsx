import { useEffect, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import { useAI } from '../hooks/useAI.js'

function StatusPill({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {status}
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

function ListingCard({ listing }) {
  const { response, loading, ask } = useAI()
  const [generated, setGenerated] = useState(listing.description)
  const [posting, setPosting]     = useState({ ebay: false, amazon: false })

  async function generateDescription() {
    await ask(
      `Write a compelling 2-sentence product listing description for: "${listing.name}". Be specific, highlight benefits, and use persuasive language.`,
      { product: listing },
      'listings'
    )
  }

  useEffect(() => {
    if (response) setGenerated(response)
  }, [response])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800">{listing.name}</p>
          <p className="text-xs text-gray-400 font-mono">{listing.sku}</p>
        </div>
        <p className="text-lg font-bold text-indigo-700 shrink-0">${listing.price.toFixed(2)}</p>
      </div>

      <div className="flex gap-4 text-sm text-gray-500">
        <span>👁 {listing.views.toLocaleString()} views</span>
        <span>📦 {listing.sales30d} sold / 30d</span>
      </div>

      <div className="flex gap-2 items-center text-xs">
        <span className="text-gray-500">eBay:</span>
        <StatusPill status={listing.ebayStatus} />
        <span className="text-gray-500 ml-2">Amazon:</span>
        <StatusPill status={listing.amazonStatus} />
      </div>

      {generated && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100 leading-relaxed">
          {generated}
        </p>
      )}

      <div className="flex gap-2 pt-1 flex-wrap">
        <button
          onClick={generateDescription}
          disabled={loading}
          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition"
        >
          {loading ? '⏳ Generating...' : '🤖 AI Description'}
        </button>
        <button
          disabled={posting.ebay}
          onClick={async () => {
            setPosting((p) => ({ ...p, ebay: true }))
            await postAuditEntry({
              actionType: 'listing-post',
              item: listing.name,
              sku: listing.sku,
              amount: 0,
              reasoning: `User posted ${listing.name} to eBay. AI-assisted listing with generated description.`,
              status: 'auto-executed',
            })
            setPosting((p) => ({ ...p, ebay: false }))
          }}
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
        >
          {posting.ebay ? '⏳' : 'Post to eBay'}
        </button>
        <button
          disabled={posting.amazon}
          onClick={async () => {
            setPosting((p) => ({ ...p, amazon: true }))
            await postAuditEntry({
              actionType: 'listing-post',
              item: listing.name,
              sku: listing.sku,
              amount: 0,
              reasoning: `User posted ${listing.name} to Amazon. AI-assisted listing with generated description.`,
              status: 'auto-executed',
            })
            setPosting((p) => ({ ...p, amazon: false }))
          }}
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
        >
          {posting.amazon ? '⏳' : 'Post to Amazon'}
        </button>
      </div>
    </div>
  )
}

export default function Listings() {
  const [listings, setListings] = useState([])

  useEffect(() => {
    fetch('/api/listings')
      .then((r) => r.json())
      .then(setListings)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Listings</h1>

      <AIPanel
        screen="listings"
        contextData={{
          allData: listings,
          filteredData: listings,
          activeFilters: {},
        }}
        defaultPrompt="Which listings have the strongest performance and which need improvement? Identify opportunities to optimize titles, descriptions, or pricing."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
