import { useEffect, useState, useMemo } from 'react'

const ACTION_TYPES = ['all', 'reorder', 'listing-post', 'support-reply', 'price-update']

const ACTION_LABELS = {
  'reorder':       'Reorder',
  'listing-post':  'Listing Post',
  'support-reply': 'Support Reply',
  'price-update':  'Price Update',
}

const ACTION_ICONS = {
  'reorder':       '📦',
  'listing-post':  '🛒',
  'support-reply': '🎫',
  'price-update':  '🏷️',
}

const STATUS_STYLES = {
  'auto-executed':    { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Auto-executed' },
  'pending-approval': { pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   label: 'Pending Approval' },
  'approved':         { pill: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-400',    label: 'Approved' },
  'rejected':         { pill: 'bg-red-50 text-red-600 border-red-200',              dot: 'bg-red-400',     label: 'Rejected' },
  'failed':           { pill: 'bg-gray-100 text-gray-600 border-gray-200',          dot: 'bg-gray-400',    label: 'Failed' },
}

function escapeCSV(val) {
  const s = val === null || val === undefined ? '' : String(val)
  return `"${s.replace(/"/g, '""')}"`
}

function formatTS(ts) {
  const d = new Date(ts)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AuditLog() {
  const [entries, setEntries]           = useState([])
  const [actionFilter, setActionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter]     = useState('')

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then(setEntries)
  }, [])

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchAction = actionFilter === 'all' || e.actionType === actionFilter
      const matchStatus = statusFilter === 'all' || e.status === statusFilter
      const matchDate   = !dateFilter || e.timestamp.startsWith(dateFilter)
      return matchAction && matchStatus && matchDate
    })
  }, [entries, actionFilter, statusFilter, dateFilter])

  async function updateStatus(id, newStatus) {
    const res = await fetch(`/api/audit/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const updated = await res.json()
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
  }

  function exportCSV() {
    const headers = ['ID', 'Timestamp', 'Action Type', 'Item', 'SKU', 'Amount', 'Reasoning', 'Status', 'Error']
    const rows = filteredEntries.map((e) => [
      escapeCSV(e.id),
      escapeCSV(e.timestamp),
      escapeCSV(ACTION_LABELS[e.actionType] || e.actionType),
      escapeCSV(e.item),
      escapeCSV(e.sku),
      e.amount > 0 ? `$${e.amount.toFixed(2)}` : '—',
      escapeCSV(e.reasoning),
      escapeCSV(STATUS_STYLES[e.status]?.label || e.status),
      escapeCSV(e.error || ''),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pendingCount = entries.filter((e) => e.status === 'pending-approval').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">All autonomous and AI-assisted actions taken on your store.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-sm font-medium bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
              {pendingCount} pending approval
            </span>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm transition font-medium"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Filter</span>
        <div className="h-4 border-r border-gray-200" />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All action types' : ACTION_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_STYLES).map(([val, s]) => (
            <option key={val} value={val}>{s.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {(actionFilter !== 'all' || statusFilter !== 'all' || dateFilter) && (
          <button
            onClick={() => { setActionFilter('all'); setStatusFilter('all'); setDateFilter('') }}
            className="ml-auto text-xs text-gray-400 hover:text-red-400 transition"
          >
            ✕ Clear
          </button>
        )}

        <span className="text-xs text-gray-400 ml-auto shrink-0">
          {filteredEntries.length} of {entries.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No entries match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Reasoning</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEntries.map((entry) => {
                  const statusStyle = STATUS_STYLES[entry.status] || STATUS_STYLES['failed']
                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${entry.status === 'pending-approval' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-mono text-gray-500">{formatTS(entry.timestamp)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{entry.id}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{ACTION_ICONS[entry.actionType] || '•'}</span>
                          <span className="text-xs font-medium text-gray-700">{ACTION_LABELS[entry.actionType] || entry.actionType}</span>
                        </div>
                        {entry.sku && <p className="text-xs text-gray-400 font-mono mt-0.5">{entry.sku}</p>}
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <p className="text-sm text-gray-800 font-medium leading-snug">{entry.item}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {entry.amount > 0
                          ? <span className="text-sm font-semibold text-gray-700">${entry.amount.toLocaleString()}</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <p className="text-xs text-gray-600 leading-snug line-clamp-2" title={entry.reasoning}>
                          {entry.reasoning}
                        </p>
                        {entry.error && (
                          <p className="text-xs text-red-500 mt-1">⚠ {entry.error}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dot}`} />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {entry.status === 'pending-approval' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => updateStatus(entry.id, 'approved')}
                              className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition font-medium"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => updateStatus(entry.id, 'rejected')}
                              className="text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-200 transition font-medium"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
