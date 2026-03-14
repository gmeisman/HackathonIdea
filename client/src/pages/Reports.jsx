import { useEffect, useRef, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import { BASE_URL } from '../lib/api.js'

// ─── Report type config ───────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: 'sales-summary',           label: 'Sales Summary',               icon: '💰' },
  { value: 'inventory-health',        label: 'Inventory Health',            icon: '📦' },
  { value: 'support-overview',        label: 'Customer Support Overview',   icon: '🎫' },
  { value: 'listing-performance',     label: 'Listing Performance',         icon: '🛒' },
  { value: 'auto-listing-performance',label: 'Auto-Listing Performance',    icon: '🤖' },
  { value: 'full-overview',           label: 'Full Business Overview',      icon: '📊' },
]

const ENDPOINTS = {
  'sales-summary':            ['/api/reports', '/api/orders'],
  'inventory-health':         ['/api/inventory'],
  'support-overview':         ['/api/support'],
  'listing-performance':      ['/api/listings'],
  'auto-listing-performance': ['/api/listings/auto-listings', '/api/listings/market-trends', '/api/listings'],
  'full-overview':            ['/api/reports', '/api/inventory', '/api/support', '/api/listings', '/api/orders'],
}

const DATA_KEYS = {
  'sales-summary':            ['reports', 'orders'],
  'inventory-health':         ['inventory'],
  'support-overview':         ['support'],
  'listing-performance':      ['listings'],
  'auto-listing-performance': ['autoListings', 'marketTrends', 'listings'],
  'full-overview':            ['reports', 'inventory', 'support', 'listings', 'orders'],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchReportData(type) {
  const results = await Promise.all(ENDPOINTS[type].map((url) => fetch(`${BASE_URL}${url}`).then((r) => r.json())))
  return Object.fromEntries(DATA_KEYS[type].map((k, i) => [k, results[i]]))
}

function computeMetrics(type, data) {
  switch (type) {
    case 'sales-summary': {
      const { monthlyRevenue, topProducts, channelBreakdown } = data.reports
      const total  = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)
      const latest = monthlyRevenue[monthlyRevenue.length - 1]
      const prev   = monthlyRevenue[monthlyRevenue.length - 2]
      const growth = (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
      return [
        { label: '6-Month Revenue',  value: `$${total.toLocaleString()}` },
        { label: 'MoM Growth',       value: `${growth >= 0 ? '+' : ''}${growth}%` },
        { label: 'Top Channel',      value: channelBreakdown[0].channel },
        { label: 'Best Product',     value: topProducts[0].name.split(' ').slice(0, 2).join(' ') },
      ]
    }
    case 'inventory-health': {
      const items     = data.inventory
      const lowStock  = items.filter((i) => i.stock <= i.reorderPoint && i.stock > 0).length
      const outStock  = items.filter((i) => i.stock === 0).length
      const totalVal  = items.reduce((s, i) => s + i.stock * i.unitCost, 0)
      return [
        { label: 'Total SKUs',       value: items.length },
        { label: 'Low Stock',        value: lowStock },
        { label: 'Out of Stock',     value: outStock },
        { label: 'Inventory Value',  value: `$${totalVal.toLocaleString()}` },
      ]
    }
    case 'support-overview': {
      const tickets    = data.support
      const open       = tickets.filter((t) => t.status === 'open').length
      const closed     = tickets.filter((t) => t.status === 'closed').length
      const highPri    = tickets.filter((t) => t.priority === 'urgent' || t.priority === 'high').length
      const resRate    = closed > 0 ? Math.round((closed / tickets.length) * 100) : 0
      return [
        { label: 'Total Tickets',    value: tickets.length },
        { label: 'Open',             value: open },
        { label: 'High Priority',    value: highPri },
        { label: 'Resolution Rate',  value: `${resRate}%` },
      ]
    }
    case 'listing-performance': {
      const listings   = data.listings
      const onEbay     = listings.filter((l) => l.ebayStatus === 'active').length
      const onAmazon   = listings.filter((l) => l.amazonStatus === 'active').length
      const totalViews = listings.reduce((s, l) => s + l.views, 0)
      const totalSales = listings.reduce((s, l) => s + l.sales30d, 0)
      return [
        { label: 'Total Listings',   value: listings.length },
        { label: 'Active on eBay',   value: onEbay },
        { label: 'Active on Amazon', value: onAmazon },
        { label: 'Total Sales (30d)',  value: totalSales },
      ]
    }
    case 'auto-listing-performance': {
      const als      = data.autoListings || []
      const live     = als.filter((al) => al.status === 'live' || al.status === 'auto-posted').length
      const pending  = als.filter((al) => al.status === 'pending-approval').length
      const revenue  = als.reduce((s, al) => s + (al.revenue || 0), 0)
      const channels = als.reduce((acc, al) => {
        acc[al.channel] = (acc[al.channel] || 0) + (al.revenue || 0)
        return acc
      }, {})
      const bestChannel = Object.keys(channels).sort((a, b) => channels[b] - channels[a])[0] || 'N/A'
      return [
        { label: 'Total Auto-Listings', value: als.length },
        { label: 'Live / Auto-Posted',  value: live },
        { label: 'Pending Approval',    value: pending },
        { label: 'Revenue Generated',   value: `$${revenue.toLocaleString()}` },
      ]
    }
    case 'full-overview': {
      const { monthlyRevenue } = data.reports
      const total      = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)
      const lowStock   = data.inventory.filter((i) => i.stock <= i.reorderPoint).length
      const openTkts   = data.support.filter((t) => t.status === 'open').length
      const activeLst  = data.listings.filter((l) => l.ebayStatus === 'active' || l.amazonStatus === 'active').length
      return [
        { label: '6-Month Revenue',  value: `$${total.toLocaleString()}` },
        { label: 'Low Stock Items',  value: lowStock },
        { label: 'Open Tickets',     value: openTkts },
        { label: 'Active Listings',  value: activeLst },
      ]
    }
    default: return []
  }
}

function buildPrompt(type) {
  const label = REPORT_TYPES.find((r) => r.value === type).label
  if (type === 'auto-listing-performance') {
    return `You are generating a professional Auto-Listing Performance report for an ecommerce store manager. You have access to auto-listing decisions made by Sil (AI), market trend data, and current listing performance.

Analyze: total auto-listings created, revenue generated, channel performance (eBay vs Amazon), top trending categories Sil identified, and what listing strategies are working best.

Return ONLY a valid JSON object — no markdown, no extra text before or after — with this exact structure:
{"summary":"Write 2-3 paragraphs analyzing Sil's auto-listing performance: which channels are generating the most revenue, which product categories are trending and why, and the overall effectiveness of the autonomous listing strategy.","recommendations":["Specific actionable recommendation to improve auto-listing performance 1","Recommendation 2","Recommendation 3","Recommendation 4","Recommendation 5"]}`
  }
  return `You are generating a professional ${label} report for an ecommerce store manager. Analyze the provided data thoroughly.

Return ONLY a valid JSON object — no markdown, no extra text before or after — with this exact structure:
{"summary":"Write 2-3 paragraphs of specific, data-driven business analysis covering trends, anomalies, and overall health.","recommendations":["Specific actionable recommendation 1","Specific actionable recommendation 2","Specific actionable recommendation 3","Specific actionable recommendation 4","Specific actionable recommendation 5"]}`
}

function parseAIResponse(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const match   = cleaned.match(/\{[\s\S]*\}/)
  if (match) return JSON.parse(match[0])
  throw new Error('No JSON object found in response')
}

function exportPDF(report) {
  const metricsHTML = report.metrics.map((m) => `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px">
      <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px">${m.label}</p>
      <p style="font-size:22px;font-weight:700;color:#111827;margin:0">${m.value}</p>
    </div>`).join('')

  const recsHTML = report.recommendations.map((r, i) => `
    <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start">
      <span style="width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;line-height:24px;text-align:center">${i + 1}</span>
      <span style="color:#374151;line-height:1.6">${r}</span>
    </div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:48px;color:#111827;max-width:900px;margin:0 auto}
    h1{font-size:26px;font-weight:700;margin:0 0 4px}
    .sub{color:#6b7280;font-size:13px;margin:0 0 36px}
    .section{margin-bottom:36px}
    .section-title{font-size:15px;font-weight:600;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:0 0 16px}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
    .summary{line-height:1.75;color:#374151;white-space:pre-wrap;font-size:14px}
    .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
    @media print{body{padding:24px}@page{margin:1cm}}
  </style>
  </head><body>
  <h1>${report.icon} ${report.title}</h1>
  <p class="sub">Generated ${report.generatedAt} · Sil Store Platform</p>
  <div class="section">
    <p class="section-title">Key Metrics</p>
    <div class="metrics">${metricsHTML}</div>
  </div>
  <div class="section">
    <p class="section-title">Analysis</p>
    <p class="summary">${report.summary.replace(/\n/g, '<br>')}</p>
  </div>
  <div class="section">
    <p class="section-title">Recommendations</p>
    ${recsHTML}
  </div>
  <div class="footer">
    <span>Sil Store Platform — Confidential</span>
    <span>${report.title}</span>
  </div>
  </body></html>`

  const win = window.open('', '_blank', 'width=960,height=720')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricChip({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function GeneratedReportCard({ report, onDismiss }) {
  const cardRef = useRef(null)
  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-md border border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{report.icon}</span>
            <h2 className="font-bold text-gray-800 text-lg">{report.title}</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Generated {report.generatedAt}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportPDF(report)}
            className="flex items-center gap-1.5 text-sm bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition font-medium shadow-sm shadow-blue-500/20"
          >
            ↓ Export as PDF
          </button>
          <button
            onClick={onDismiss}
            className="text-sm text-gray-400 hover:text-gray-600 px-2 py-2 transition"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Key metrics */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {report.metrics.map((m) => <MetricChip key={m.label} {...m} />)}
          </div>
        </div>

        {/* AI narrative */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Analysis</h3>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
          </div>
        </div>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recommendations</h3>
            <ol className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportLoadingCard({ label, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-indigo-100 px-6 py-10 flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-700">Generating {label}...</p>
        <p className="text-sm text-gray-400 mt-1">Sil is analyzing your store data</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

function BarChart({ data, valueKey, labelKey, color = 'bg-indigo-500' }) {
  const max = Math.max(...data.map((d) => d[valueKey]))
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item[labelKey]} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-12 shrink-0 text-right">{item[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item[valueKey] / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-20 shrink-0">
            {typeof item[valueKey] === 'number' && item[valueKey] > 1000
              ? `$${item[valueKey].toLocaleString()}`
              : item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Reports page ─────────────────────────────────────────────────────────────

export default function Reports() {
  const [data, setData]               = useState(null)
  const [marketTrends, setMarketTrends] = useState(null)
  const [selectedType, setSelectedType] = useState('sales-summary')
  const [generating, setGenerating]   = useState(false)
  const [generatedReport, setGenerated] = useState(null)
  const [reportError, setReportError] = useState(null)

  useEffect(() => {
    fetch(`${BASE_URL}/api/reports`).then((r) => r.json()).then(setData)
    fetch(`${BASE_URL}/api/listings/market-trends`).then((r) => r.json()).then(setMarketTrends)
  }, [])

  async function generateReport() {
    setGenerating(true)
    setGenerated(null)
    setReportError(null)

    try {
      const allData = await fetchReportData(selectedType)
      const metrics = computeMetrics(selectedType, allData)

      const res = await fetch(`${BASE_URL}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPrompt(selectedType),
          context: { allData, filteredData: allData, activeFilters: {} },
          screen: 'reports',
        }),
      })

      const aiData = await res.json()
      if (!res.ok) throw new Error(aiData.error || `Server error ${res.status}`)

      let parsed
      try {
        parsed = parseAIResponse(aiData.text)
      } catch {
        parsed = { summary: aiData.text, recommendations: [] }
      }

      const typeConfig = REPORT_TYPES.find((r) => r.value === selectedType)
      setGenerated({
        type:            selectedType,
        title:           typeConfig.label,
        icon:            typeConfig.icon,
        metrics,
        summary:         parsed.summary || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        generatedAt:     new Date().toLocaleString(),
      })
    } catch (err) {
      setReportError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (!data) return <p className="text-gray-400 p-4">Loading...</p>

  const { monthlyRevenue, topProducts, channelBreakdown } = data
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)
  const latestMonth  = monthlyRevenue[monthlyRevenue.length - 1]
  const prevMonth    = monthlyRevenue[monthlyRevenue.length - 2]
  const growth       = (((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1)

  const selectedConfig = REPORT_TYPES.find((r) => r.value === selectedType)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <span className="px-3 text-lg border-r border-gray-200 py-2">{selectedConfig.icon}</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm px-3 py-2 focus:outline-none bg-white cursor-pointer pr-8"
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 text-sm bg-blue-500 text-white px-5 py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition font-semibold shadow-sm shadow-blue-500/20"
          >
            {generating ? (
              <>
                <span className="animate-spin text-base">⏳</span> Generating...
              </>
            ) : (
              <>✦ Generate Report</>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">6-Month Revenue</p>
          <p className="text-2xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-800">${latestMonth.revenue.toLocaleString()}</p>
          <p className={`text-xs mt-1 font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% vs last month
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Top Product</p>
          <p className="text-lg font-bold text-gray-800 leading-tight">{topProducts[0].name}</p>
          <p className="text-xs text-gray-500 mt-1">{topProducts[0].units} units · ${topProducts[0].revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* ── AI Panel ── */}
      <AIPanel
        screen="reports"
        contextData={{ allData: data, filteredData: data, activeFilters: {} }}
        defaultPrompt="Analyze the revenue trends and top products. What are the key business insights and what should the seller focus on next quarter?"
      />

      {/* ── Generated report ── */}
      {generating && (
        <ReportLoadingCard label={selectedConfig.label} icon={selectedConfig.icon} />
      )}
      {reportError && !generating && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-600 flex items-start gap-2">
          <span>⚠️</span>
          <span>{reportError}</span>
        </div>
      )}
      {generatedReport && !generating && (
        <GeneratedReportCard
          report={generatedReport}
          onDismiss={() => setGenerated(null)}
        />
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Monthly Revenue</h2>
          <BarChart data={monthlyRevenue} valueKey="revenue" labelKey="month" color="bg-indigo-500" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top Products (30d Units)</h2>
          <BarChart
            data={topProducts.map((p) => ({ ...p, shortName: p.name.split(' ').slice(0, 2).join(' ') }))}
            valueKey="units"
            labelKey="shortName"
            color="bg-violet-500"
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Sales by Channel</h2>
          <div className="space-y-3">
            {channelBreakdown.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16 shrink-0">{c.channel}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-10 shrink-0">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-listing activity chart placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Auto-Listing Activity</h2>
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg font-medium">Sil Engine</span>
          </div>
          <BarChart
            data={[
              { day: 'Mon',  listings: 1 },
              { day: 'Tue',  listings: 2 },
              { day: 'Wed',  listings: 0 },
              { day: 'Thu',  listings: 3 },
              { day: 'Fri',  listings: 1 },
              { day: 'Sat',  listings: 2 },
              { day: 'Sun',  listings: 3 },
            ]}
            valueKey="listings"
            labelKey="day"
            color="bg-blue-500"
          />
          <p className="text-xs text-gray-400 mt-3 text-center">Auto-listings created per day (this week)</p>
        </div>
      </div>

      {/* ── Listing Intelligence ── */}
      {marketTrends && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Listing Intelligence</h2>
              <p className="text-xs text-slate-400">Market trend analysis by Sil · Updated {marketTrends.lastUpdated}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Category trend grid */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category Demand Trends</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {marketTrends.categories.map((cat) => {
                  const trendUp    = cat.trend === 'up'
                  const trendDown  = cat.trend === 'down'
                  const borderCls  = trendUp ? 'border-green-200 bg-green-50' : trendDown ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'
                  const badgeCls   = trendUp ? 'bg-green-100 text-green-700' : trendDown ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  const trendLabel = trendUp ? `▲ +${cat.weeklyGrowth}%` : trendDown ? `▼ ${cat.weeklyGrowth}%` : `● +${cat.weeklyGrowth}%`
                  return (
                    <div key={cat.name} className={`rounded-xl border p-4 ${borderCls}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{trendLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-white/80 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${trendUp ? 'bg-green-500' : trendDown ? 'bg-red-400' : 'bg-blue-400'}`}
                            style={{ width: `${(cat.demandScore / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{cat.demandScore}/10</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">{cat.insight}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Channel insights + hot products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel insights */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Channel Insights</h3>
                <div className="space-y-3">
                  {Object.entries(marketTrends.channelInsights).map(([channel, info]) => (
                    <div key={channel} className={`rounded-xl border p-4 ${channel === 'eBay' ? 'border-yellow-200 bg-yellow-50' : 'border-orange-100 bg-orange-50'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={`font-bold text-sm ${channel === 'eBay' ? 'text-yellow-800' : 'text-orange-800'}`}>{channel}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${channel === 'eBay' ? 'bg-yellow-200 text-yellow-800' : 'bg-orange-200 text-orange-800'}`}>
                          {info.avgSellThroughRate}% sell-through
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1.5">Best for: {info.bestCategories.join(', ')}</p>
                      <p className="text-xs text-gray-500 italic">💡 {info.tipOfWeek}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hot products */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🔥 Trending Products</h3>
                <div className="space-y-2">
                  {marketTrends.hotProducts.map((hp) => (
                    <div key={`${hp.sku}-${hp.channel}`} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg shrink-0">
                        🔥
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{hp.sku}</p>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${hp.channel === 'eBay' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                            {hp.channel}
                          </span>
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            {hp.demandBoost}x boost
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{hp.reasonForTrend}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-listing stats summary */}
            <div className="bg-slate-900 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{marketTrends.autoListingStats.totalThisPeriod}</p>
                <p className="text-xs text-slate-400 mt-0.5">Auto-listings this period</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">${marketTrends.autoListingStats.revenueGenerated.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">Revenue generated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{marketTrends.autoListingStats.bestChannel}</p>
                <p className="text-xs text-slate-400 mt-0.5">Best performing channel</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">{marketTrends.autoListingStats.avgTimeToFirstSale}</p>
                <p className="text-xs text-slate-400 mt-0.5">Avg time to first sale</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
