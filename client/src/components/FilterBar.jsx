const DATE_RANGES = [
  { value: 'all',   label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d',    label: 'Last 7 days' },
  { value: '30d',   label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
]

const CHANNELS = ['All', 'eBay', 'Amazon', 'Direct']

export default function FilterBar({ range, channel, onRangeChange, onChannelChange }) {
  const isFiltered = range !== 'all' || channel !== 'All'

  return (
    <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Filter</span>
      <div className="h-4 border-r border-gray-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0">Date range</label>
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white cursor-pointer"
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="h-4 border-r border-gray-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">Channel</span>
        <div className="flex gap-1">
          {CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => onChannelChange(c)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                channel === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isFiltered && (
        <button
          onClick={() => { onRangeChange('all'); onChannelChange('All') }}
          className="ml-auto text-xs text-gray-400 hover:text-red-400 transition flex items-center gap-1"
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  )
}
