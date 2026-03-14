import { useEffect, useState, useMemo } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import FilterBar from '../components/FilterBar.jsx'
import TasksCard from '../components/TasksCard.jsx'

// Fixed reference date matching the mock data so demo filters always work
const MOCK_TODAY = '2026-03-14'

const AI_SUGGESTIONS = [
  'Why did revenue change this month?',
  'Which products are underperforming?',
  "Summarize this week's orders.",
  'Which items need restocking soon?',
  'Are there any concerning support trends?',
]

const TODAY_TASKS = [
  { id: 1, icon: '📦', text: '2 listings are critically low on stock — reorder before weekend.', tag: 'Inventory' },
  { id: 2, icon: '🎫', text: '3 high-priority support tickets are waiting for a reply.', tag: 'Support' },
  { id: 3, icon: '🏷️', text: 'Consider discounting Monitor Stand — only 12 units sold in 30 days.', tag: 'Pricing' },
  { id: 4, icon: '🛒', text: 'Monitor Stand and USB-C Hub have no active eBay listings.', tag: 'Listings' },
  { id: 5, icon: '✦',  text: 'Ask AI to generate new descriptions for underperforming listings.', tag: 'AI' },
]

const AI_RECENT_INSIGHTS = [
  { text: 'Revenue up 12.4% MoM — driven by Keyboard and Mouse sales on eBay.', time: '2 min ago' },
  { text: 'USB-C Hub is critically low (4 units). Reorder of 100 units recommended.', time: '1h ago' },
  { text: '2 urgent support tickets need immediate attention today.', time: '3h ago' },
]

const RANGE_LABELS = {
  all:   'All time',
  today: 'Today',
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  month: 'This month',
}

function getCutoff(range) {
  const today = new Date(MOCK_TODAY)
  switch (range) {
    case 'today': return today
    case '7d':    return new Date('2026-03-08')
    case '30d':   return new Date('2026-02-13')
    case 'month': return new Date('2026-03-01')
    default:      return null
  }
}

function filterOrders(orders, range, channel) {
  const cutoff = getCutoff(range)
  return orders.filter((o) => {
    const matchDate    = !cutoff || new Date(o.date) >= cutoff
    const matchChannel = channel === 'All' || o.channel === channel
    return matchDate && matchChannel
  })
}

// ─── KPI card ────────────────────────────────────────────────────────────────

const STATUS_BADGES = {
  shipped:    { pill: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-400' },
  processing: { pill: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400' },
  delivered:  { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-400' },
  cancelled:  { pill: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400' },
}
const STATUS_OPTIONS = ['all', 'shipped', 'processing', 'delivered', 'cancelled']

const KPI_STYLES = {
  revenue:  { iconBg: 'bg-green-100',  iconText: 'text-green-600',  border: 'border-l-green-400',  spark: '#22c55e', icon: '💵' },
  orders:   { iconBg: 'bg-blue-100',   iconText: 'text-blue-600',   border: 'border-l-blue-400',   spark: '#3b82f6', icon: '📦' },
  listings: { iconBg: 'bg-violet-100', iconText: 'text-violet-600', border: 'border-l-violet-400', spark: '#8b5cf6', icon: '🏷️' },
  tickets:  { iconBg: 'bg-orange-100', iconText: 'text-orange-600', border: 'border-l-orange-400', spark: '#f97316', icon: '🎫' },
}

function Sparkline({ points, color }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const W = 80, H = 32, PAD = 2
  const coords = points
    .map((p, i) => {
      const x = PAD + (i / (points.length - 1)) * (W - PAD * 2)
      const y = PAD + (1 - (p - min) / range) * (H - PAD * 2)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-80">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KPICard({ label, sublabel, value, change, prefix = '', suffix = '', styleKey, trend = [] }) {
  const positive = change >= 0
  const s = KPI_STYLES[styleKey]
  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-100 border-l-4 ${s.border} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${s.iconBg} ${s.iconText}`}>
              {s.icon}
            </span>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
              {sublabel && <p className="text-xs text-gray-400 leading-tight">{sublabel}</p>}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 leading-none">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          <p className={`text-xs mt-1.5 font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
            {positive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs baseline
          </p>
        </div>
        {trend.length > 1 && (
          <div className="shrink-0 mt-1">
            <Sparkline points={trend} color={s.spark} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData]               = useState(null)
  const [range, setRange]             = useState('all')
  const [channel, setChannel]         = useState('All')
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
  }, [])

  const filteredOrders = useMemo(() => {
    if (!data) return []
    return filterOrders(data.recentActivity, range, channel)
  }, [data, range, channel])

  const tableOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return filteredOrders.filter((o) => {
      const matchSearch = !q || o.id.toLowerCase().includes(q) || o.product.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [filteredOrders, search, statusFilter])

  if (!data) return <p className="text-gray-400 p-4">Loading...</p>

  const { kpis, trends = {} } = data
  const isFiltered = range !== 'all' || channel !== 'All'

  // Revenue + Orders are derived from filtered orders when any filter is active
  const filteredRevenue = filteredOrders.reduce((s, o) => s + o.amount, 0)
  const baseRevenue     = data.recentActivity.reduce((s, o) => s + o.amount, 0)
  const revenueChange   = baseRevenue > 0 ? ((filteredRevenue - baseRevenue) / baseRevenue) * 100 : 0

  const filteredOrderCount = filteredOrders.length
  const baseOrderCount     = data.recentActivity.length
  const ordersChange       = baseOrderCount > 0 ? ((filteredOrderCount - baseOrderCount) / baseOrderCount) * 100 : 0

  const rangeLabel = RANGE_LABELS[range]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left column: filters + KPIs + orders ── */}
        <div className="lg:col-span-2 space-y-6">

          <FilterBar
            range={range}
            channel={channel}
            onRangeChange={setRange}
            onChannelChange={setChannel}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Revenue"
              sublabel={rangeLabel}
              value={isFiltered ? filteredRevenue : kpis.totalRevenue}
              change={isFiltered ? revenueChange : kpis.revenueChange}
              prefix="$"
              styleKey="revenue"
              trend={trends.revenue}
            />
            <KPICard
              label="Orders"
              sublabel={rangeLabel}
              value={isFiltered ? filteredOrderCount : kpis.totalOrders}
              change={isFiltered ? ordersChange : kpis.ordersChange}
              styleKey="orders"
              trend={trends.orders}
            />
            <KPICard
              label="Active Listings"
              sublabel="All time"
              value={kpis.activeListings}
              change={kpis.listingsChange}
              styleKey="listings"
              trend={trends.listings}
            />
            <KPICard
              label="Open Tickets"
              sublabel="All time"
              value={kpis.openTickets}
              change={kpis.ticketsChange}
              styleKey="tickets"
              trend={trends.tickets}
            />
          </div>

          <TasksCard tasks={TODAY_TASKS} />

          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

            {/* ── Toolbar ── */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold text-gray-800 mr-auto">Recent Orders</h2>
                <button
                  onClick={() => { setSearch(''); setStatusFilter('all') }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  View all →
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search order ID or product..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 placeholder:text-gray-400"
                  />
                </div>
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                {/* Result count */}
                <span className="text-xs text-gray-400 shrink-0">
                  {tableOrders.length} of {filteredOrders.length}
                  {isFiltered && <span className="text-indigo-400 ml-1">(filtered)</span>}
                </span>
              </div>
            </div>

            {/* ── Table ── */}
            {tableOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No orders match your search.</p>
                <button
                  onClick={() => { setSearch(''); setStatusFilter('all') }}
                  className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 transition"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tableOrders.map((order) => {
                    const badge = STATUS_BADGES[order.status] || { pill: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' }
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500 font-medium">{order.id}</td>
                        <td className="px-5 py-3.5 text-gray-800 font-medium">{order.product}</td>
                        <td className="px-5 py-3.5 text-gray-700 font-semibold">${order.amount.toFixed(2)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{order.channel}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{order.date}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>{/* end left column */}

        {/* ── Right column: AI Copilot ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <AIPanel
              screen="dashboard"
              contextData={{
                allData: { kpis, trends, orders: data.recentActivity },
                filteredData: filteredOrders,
                activeFilters: { range, channel },
              }}
              defaultPrompt="Summarize the store's health based on today's KPIs and recent activity. Highlight any concerns and quick wins."
              suggestions={AI_SUGGESTIONS}
              recentInsights={AI_RECENT_INSIGHTS}
            />
          </div>
        </div>

      </div>{/* end main grid */}
    </div>
  )
}
