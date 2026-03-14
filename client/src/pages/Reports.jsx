import { useEffect, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'

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

export default function Reports() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then(setData)
  }, [])

  if (!data) return <p className="text-gray-400 p-4">Loading...</p>

  const { monthlyRevenue, topProducts, channelBreakdown } = data
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)
  const latestMonth = monthlyRevenue[monthlyRevenue.length - 1]
  const prevMonth = monthlyRevenue[monthlyRevenue.length - 2]
  const growth = (((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Reports</h1>

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

      <AIPanel
        screen="reports"
        contextData={{
          allData: data,
          filteredData: data,
          activeFilters: {},
        }}
        defaultPrompt="Analyze the revenue trends and top products. What are the key business insights and what should the seller focus on next quarter?"
      />

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
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-10 shrink-0">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
