import { NavLink } from 'react-router-dom'

const PRIMARY_LINKS = [
  { to: '/',          label: 'Dashboard' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/listings',  label: 'Listings' },
  { to: '/ai',        label: 'Sil Chat' },
  { to: '/support',   label: 'Support' },
  { to: '/reports',   label: 'Reports' },
]

const SECONDARY_LINKS = [
  { to: '/audit',    label: '📋 Audit' },
  { to: '/settings', label: '⚙ Settings' },
]

export default function Navbar() {
  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 max-w-7xl flex items-center h-14 gap-1 overflow-x-auto">
        <span className="font-bold text-lg shrink-0 mr-3">🛒 Sil Store</span>

        {/* Primary nav */}
        {PRIMARY_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-900 text-white'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
              }`
            }
          >
            {label}
          </NavLink>
        ))}

        {/* Divider */}
        <span className="mx-2 h-5 border-l border-indigo-500 shrink-0" />

        {/* Secondary nav */}
        {SECONDARY_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-900 text-white'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-600'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
