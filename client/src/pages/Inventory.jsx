import { useEffect, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'

// ─── Static maps ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  Audio: '🎧', Accessories: '🔌', Peripherals: '⌨️',
  Video: '📹', Furniture: '🪑', Storage: '💾', Networking: '📡',
}

const CATEGORY_GRADIENTS = {
  Audio:       'from-violet-100 to-purple-50',
  Accessories: 'from-blue-100 to-cyan-50',
  Peripherals: 'from-indigo-100 to-blue-50',
  Video:       'from-pink-100 to-rose-50',
  Furniture:   'from-amber-100 to-yellow-50',
  Storage:     'from-slate-100 to-gray-50',
  Networking:  'from-teal-100 to-emerald-50',
}

function stockBarColor(stock, reorderPoint) {
  if (stock === 0) return 'bg-red-500'
  if (stock <= reorderPoint) return 'bg-amber-400'
  return 'bg-green-500'
}

function StockBadge({ stock, reorderPoint }) {
  if (stock === 0) return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Out of stock</span>
  )
  if (stock <= reorderPoint) return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Low stock</span>
  )
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">In stock</span>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function postAudit(entry) {
  await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: new Date().toISOString(), ...entry }),
  })
}

function parseShipmentResponse(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const match   = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse Sil response')
  return JSON.parse(match[0])
}

// ─── Shipment Request Modal ───────────────────────────────────────────────────

function ShipmentRequestModal({ item, onClose }) {
  const defaultRequest = item.stock === 0
    ? `We're completely out of ${item.name} (${item.sku}). Order emergency restocking.`
    : `Restock ${item.name} (${item.sku}). Currently ${item.stock} units — below reorder point of ${item.reorderPoint}.`

  const [step, setStep]           = useState('input')   // input | interpreting | preview | submitting | done | auto-done
  const [request, setRequest]     = useState(defaultRequest)
  const [orderDetails, setDetails] = useState(null)
  const [autoApprove, setAutoApprove] = useState(false)
  const [error, setError]         = useState(null)

  async function interpretRequest() {
    if (!request.trim()) return
    setStep('interpreting')
    setError(null)

    try {
      const prompt = `Interpret this inventory restock request and return a structured order.

Item: ${JSON.stringify({ name: item.name, sku: item.sku, stock: item.stock, reorderPoint: item.reorderPoint, unitCost: item.unitCost, category: item.category })}
User request: "${request}"

Return ONLY valid JSON — no markdown, no extra text:
{"quantity":<number>,"supplier":"<supplier name>","unitCost":<number>,"totalCost":<number>,"reasoning":"<1-2 sentence explanation>"}

Rules: use the known unitCost of ${item.unitCost}. If quantity is unspecified, use 3× the reorderPoint (${item.reorderPoint * 3}). If supplier is unspecified, use "Primary Supplier". totalCost = quantity × unitCost.`

      const res  = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: { item }, screen: 'inventory' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)

      const parsed = parseShipmentResponse(data.text)
      setDetails(parsed)

      // Check autonomy settings
      const settingsRes = await fetch('/api/settings')
      const settings    = await settingsRes.json()
      const shouldAuto  =
        settings.autonomyMode === 'full-auto' ||
        (settings.autonomyMode === 'semi-auto' && parsed.totalCost <= settings.autoApproveThreshold)

      setAutoApprove(shouldAuto)

      if (shouldAuto) {
        await executeOrder(parsed, true)
      } else {
        setStep('preview')
      }
    } catch (err) {
      setError(err.message)
      setStep('input')
    }
  }

  async function executeOrder(details, isAuto = false) {
    setStep('submitting')
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer:  details.supplier,
          product:   item.name,
          sku:       item.sku,
          amount:    details.totalCost,
          quantity:  details.quantity,
          type:      'restock',
          channel:   'Supplier',
        }),
      })
      await postAudit({
        actionType: 'reorder',
        item:       item.name,
        sku:        item.sku,
        amount:     details.totalCost,
        reasoning:  details.reasoning,
        status:     isAuto ? 'auto-executed' : 'approved',
      })
      setStep(isAuto ? 'auto-done' : 'done')
    } catch (err) {
      setError(err.message)
      setStep('preview')
    }
  }

  // Auto-close done state after 2.5 s
  useEffect(() => {
    if (step === 'done' || step === 'auto-done') {
      const t = setTimeout(onClose, 2500)
      return () => clearTimeout(t)
    }
  }, [step, onClose])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <span className="text-white font-bold text-sm leading-none">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Request Shipment</p>
            <p className="text-xs text-slate-400 truncate">{item.name} · {item.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 shrink-0">✕</button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* ── Input step ── */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe what you need
                </label>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-gray-50 resize-none placeholder:text-gray-400 leading-relaxed"
                  placeholder="e.g. Order 50 more units from the cheapest supplier…"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Sil will interpret your request and fill in the order details.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={interpretRequest}
                  disabled={!request.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 transition shadow-sm shadow-blue-500/20"
                >
                  <span className="text-base leading-none">✦</span> Interpret with Sil
                </button>
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Interpreting step ── */}
          {step === 'interpreting' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Sil is interpreting your request…</p>
                <p className="text-sm text-gray-400 mt-1">Calculating quantities and costs</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Preview step ── */}
          {step === 'preview' && orderDetails && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Preview</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">Quantity</p>
                    <p className="text-lg font-bold text-gray-800">{orderDetails.quantity} units</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">Unit Cost</p>
                    <p className="text-lg font-bold text-gray-800">${orderDetails.unitCost?.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">Supplier</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{orderDetails.supplier}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100 bg-blue-50">
                    <p className="text-xs text-blue-500">Total Cost</p>
                    <p className="text-lg font-bold text-blue-700">${orderDetails.totalCost?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Sil's Reasoning</p>
                  <p className="text-xs text-gray-600 leading-snug">{orderDetails.reasoning}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => executeOrder(orderDetails, false)}
                  className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition shadow-sm shadow-green-500/20"
                >
                  ✓ Confirm Order
                </button>
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Edit
                </button>
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-100 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Submitting step ── */}
          {step === 'submitting' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="font-semibold text-gray-700">Placing order…</p>
            </div>
          )}

          {/* ── Done / Auto-done step ── */}
          {(step === 'done' || step === 'auto-done') && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <div>
                <p className="font-bold text-gray-800">
                  {step === 'auto-done' ? 'Auto-approved & Placed!' : 'Order Placed!'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {step === 'auto-done'
                    ? 'Below auto-approve threshold — executed automatically.'
                    : `Restock order for ${orderDetails?.quantity} units logged to Audit.`}
                </p>
              </div>
              {step === 'auto-done' && (
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
                  Auto-executed · Audit logged
                </span>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Inventory card ───────────────────────────────────────────────────────────

function InventoryCard({ item, onRequestShipment }) {
  const maxStock = item.reorderPoint * 5 || 100
  const pct      = Math.min(100, Math.round((item.stock / maxStock) * 100))
  const barColor = stockBarColor(item.stock, item.reorderPoint)
  const gradient = CATEGORY_GRADIENTS[item.category] || 'from-gray-100 to-gray-50'
  const catIcon  = CATEGORY_ICONS[item.category] || '📦'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Thumbnail */}
      <div className={`bg-gradient-to-br ${gradient} h-36 flex items-center justify-center relative`}>
        <span className="text-5xl">{catIcon}</span>
        <div className="absolute top-3 right-3">
          <StockBadge stock={item.stock} reorderPoint={item.reorderPoint} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Name + SKU */}
        <div>
          <p className="font-semibold text-gray-800 text-sm leading-snug">{item.name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>
        </div>

        {/* Stock progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Stock level</span>
            <span className="text-xs font-semibold text-gray-700">{item.stock} units</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Reorder at {item.reorderPoint} units</p>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400">Cost</p>
            <p className="text-sm font-semibold text-gray-700">${item.unitCost.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Sell price</p>
            <p className="text-sm font-bold text-gray-900">${item.sellPrice.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Margin</p>
            <p className="text-sm font-semibold text-green-600">
              {Math.round(((item.sellPrice - item.unitCost) / item.sellPrice) * 100)}%
            </p>
          </div>
        </div>

        {/* Request Shipment button */}
        <button
          onClick={onRequestShipment}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition shadow-sm ${
            item.stock <= item.reorderPoint
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20'
          }`}
        >
          <span>📦</span>
          {item.stock <= item.reorderPoint ? 'Urgent: Request Shipment' : 'Request Shipment'}
        </button>
      </div>
    </div>
  )
}

// ─── Inventory page ───────────────────────────────────────────────────────────

export default function Inventory() {
  const [items, setItems]           = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetch('/api/inventory').then((r) => r.json()).then(setItems)
  }, [])

  const atRisk   = items.filter((i) => i.stock <= i.reorderPoint)
  const outStock = items.filter((i) => i.stock === 0)

  return (
    <div className="space-y-6">

      {/* Shipment request modal */}
      {selectedItem && (
        <ShipmentRequestModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} SKUs total</p>
        </div>
        <div className="flex items-center gap-3">
          {outStock.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {outStock.length} out of stock
            </span>
          )}
          {atRisk.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              {atRisk.length} need reorder
            </span>
          )}
        </div>
      </div>

      {/* Sil panel */}
      <AIPanel
        screen="inventory"
        contextData={{ allData: items, filteredData: items, activeFilters: {} }}
        defaultPrompt="Identify which items are at risk of stockout. Rank reorder priorities and explain the business impact of each."
        description="Sil can analyze your stock levels, flag reorder risks, and help you place restocking orders."
      />

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <InventoryCard
            key={item.id}
            item={item}
            onRequestShipment={() => setSelectedItem(item)}
          />
        ))}
      </div>
    </div>
  )
}
