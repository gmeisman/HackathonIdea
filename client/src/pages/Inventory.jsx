import { useEffect, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'

function StockBadge({ stock, reorderPoint }) {
  if (stock === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of stock</span>
  if (stock <= reorderPoint) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Low stock</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">In stock</span>
}

export default function Inventory() {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(setItems)
  }, [])

  const atRisk = items.filter((i) => i.stock <= i.reorderPoint)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <span className="text-sm text-gray-500">{items.length} SKUs · {atRisk.length} need reorder</span>
      </div>

      <AIPanel
        screen="inventory"
        contextData={{
          allData: items,
          filteredData: items,
          activeFilters: {},
        }}
        defaultPrompt="Identify which items are at risk of stockout. Rank reorder priorities and explain the business impact of each."
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-5 py-3 text-left">SKU</th>
              <th className="px-5 py-3 text-left">Product</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-right">Stock</th>
              <th className="px-5 py-3 text-right">Reorder At</th>
              <th className="px-5 py-3 text-right">Cost</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-50 ${item.stock <= item.reorderPoint ? 'bg-orange-50/30' : ''}`}>
                <td className="px-5 py-3 font-mono text-gray-500 text-xs">{item.sku}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{item.name}</td>
                <td className="px-5 py-3 text-gray-500">{item.category}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-700">{item.stock}</td>
                <td className="px-5 py-3 text-right text-gray-500">{item.reorderPoint}</td>
                <td className="px-5 py-3 text-right text-gray-500">${item.unitCost.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-gray-700">${item.sellPrice.toFixed(2)}</td>
                <td className="px-5 py-3">
                  <StockBadge stock={item.stock} reorderPoint={item.reorderPoint} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
