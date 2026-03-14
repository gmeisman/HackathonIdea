import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard', icon: '⊞', end: true },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/listings',  label: 'Listings',  icon: '🛒' },
  { to: '/support',   label: 'Support',   icon: '🎫' },
  { to: '/reports',   label: 'Reports',   icon: '📈' },
  { to: '/ai',        label: 'Sil Chat',  icon: '✦' },
]

const SECONDARY_ITEMS = [
  { to: '/audit',    label: 'Audit Log', icon: '📋' },
  { to: '/settings', label: 'Settings',  icon: '⚙' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col
      transition-transform duration-200 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
    `}>
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
          <span className="text-white font-bold text-base leading-none">S</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">Sil Store</p>
          <p className="text-xs text-slate-400 leading-tight">AI Commerce Platform</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition lg:hidden p-1 shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── Primary nav ──────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Main
        </p>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <span className="w-5 text-center text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}

        <div className="pt-4 mt-3 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            System
          </p>
          {SECONDARY_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <span className="w-5 text-center text-base leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Sil status ───────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow shrink-0">
            <span className="text-white text-xs font-bold leading-none">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">Sil</p>
            <p className="text-xs text-slate-400 leading-tight">AI Assistant</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
