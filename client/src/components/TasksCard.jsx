import { useState } from 'react'

const TAG_STYLES = {
  Inventory: 'bg-orange-100 text-orange-700 border-orange-200',
  Support:   'bg-red-100 text-red-700 border-red-200',
  Pricing:   'bg-violet-100 text-violet-700 border-violet-200',
  Listings:  'bg-blue-100 text-blue-700 border-blue-200',
  Sil:       'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export default function TasksCard({ tasks = [] }) {
  const [checked, setChecked] = useState(() => new Set())

  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const remaining = tasks.filter((t) => !checked.has(t.id)).length
  const allDone   = remaining === 0 && tasks.length > 0

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs shrink-0 shadow-sm">
            ✓
          </span>
          <h2 className="font-semibold text-gray-800">Today's Tasks</h2>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          allDone ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {allDone ? 'All done!' : `${remaining} remaining`}
        </span>
      </div>

      {/* Task list */}
      {allDone ? (
        <div className="px-5 py-10 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-sm font-medium text-gray-700">You're all caught up!</p>
          <p className="text-xs text-gray-400 mt-1">Check back tomorrow for new tasks.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {tasks.map((task) => {
            const done     = checked.has(task.id)
            const tagStyle = TAG_STYLES[task.tag] || 'bg-gray-100 text-gray-600 border-gray-200'
            return (
              <li
                key={task.id}
                onClick={() => toggle(task.id)}
                className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                  done ? 'bg-gray-50/60' : 'hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <span className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  done ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'
                }`}>
                  {done && <span className="text-white text-xs leading-none">✓</span>}
                </span>

                {/* Icon + text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{task.icon}</span>
                    <p className={`text-sm leading-snug flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.text}
                    </p>
                  </div>
                </div>

                {/* Tag */}
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${tagStyle} ${done ? 'opacity-40' : ''}`}>
                  {task.tag}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
