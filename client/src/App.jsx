import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import Listings from './pages/Listings.jsx'
import AIInteraction from './pages/AIInteraction.jsx'
import CustomerSupport from './pages/CustomerSupport.jsx'
import Reports from './pages/Reports.jsx'
import AutonomySettings from './pages/AutonomySettings.jsx'
import AuditLog from './pages/AuditLog.jsx'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-slate-900 text-white px-4 h-14 flex items-center gap-3 shadow-md shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-300 hover:text-white text-xl transition p-1 leading-none"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">S</span>
            </div>
            <span className="font-bold text-white text-sm">Sil Store</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/listings"  element={<Listings />} />
            <Route path="/ai"        element={<AIInteraction />} />
            <Route path="/support"   element={<CustomerSupport />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/settings"  element={<AutonomySettings />} />
            <Route path="/audit"     element={<AuditLog />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
