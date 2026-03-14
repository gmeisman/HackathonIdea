import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import Listings from './pages/Listings.jsx'
import AIInteraction from './pages/AIInteraction.jsx'
import CustomerSupport from './pages/CustomerSupport.jsx'
import Reports from './pages/Reports.jsx'
import AutonomySettings from './pages/AutonomySettings.jsx'
import AuditLog from './pages/AuditLog.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/ai" element={<AIInteraction />} />
          <Route path="/support" element={<CustomerSupport />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<AutonomySettings />} />
          <Route path="/audit" element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  )
}
