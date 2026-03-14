import { useEffect, useState } from 'react'
import AIPanel from '../components/AIPanel.jsx'
import { BASE_URL } from '../lib/api.js'

const AUTONOMY_MODES = [
  {
    value: 'full-auto',
    label: 'Full Auto',
    icon: '⚡',
    description: 'Sil executes all actions instantly. No approval needed for any action.',
    risk: 'High autonomy',
    riskColor: 'text-red-500',
  },
  {
    value: 'semi-auto',
    label: 'Semi-Auto',
    icon: '⚖️',
    description: 'Small actions auto-execute. Actions above your threshold queue for approval.',
    risk: 'Balanced',
    riskColor: 'text-amber-500',
  },
  {
    value: 'manual',
    label: 'Manual',
    icon: '🔒',
    description: 'Every Sil suggestion requires your explicit approval before executing.',
    risk: 'Full control',
    riskColor: 'text-green-600',
  },
]

const NOTIFICATION_OPTIONS = [
  { value: 'all',              label: 'Every auto action',     description: 'Get notified whenever Sil executes anything.' },
  { value: 'approvals-needed', label: 'Approvals needed only', description: 'Only notify when an action is waiting for your sign-off.' },
  { value: 'failures',         label: 'Failures only',         description: 'Only notify when a Sil action fails.' },
]

const CATEGORIES = ['Audio', 'Accessories', 'Peripherals', 'Video', 'Furniture']

const SETTINGS_SUGGESTIONS = [
  'What does my current Semi-Auto setup mean in practice?',
  'What are the risks of switching to Full Auto?',
  'Is my $50 auto-approve threshold appropriate?',
  'How should I configure per-category overrides for safety?',
]

const DEFAULT_SETTINGS = {
  autonomyMode: 'semi-auto',
  autoApproveThreshold: 50,
  maxSingleOrderValue: 500,
  reorderTrigger: 10,
  categoryOverrides: { Audio: 'semi-auto', Accessories: 'full-auto', Peripherals: 'semi-auto', Video: 'manual', Furniture: 'manual' },
  notificationPreference: 'approvals-needed',
  emergencyPause: false,
}

export default function AutonomySettings() {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    fetch(`${BASE_URL}/api/settings`)
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS))
  }, [])

  function set(patch) { setSettings((prev) => ({ ...prev, ...patch })) }

  function setCategoryOverride(cat, value) {
    setSettings((prev) => ({
      ...prev,
      categoryOverrides: { ...prev.categoryOverrides, [cat]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!settings) return <p className="text-gray-400 p-4">Loading settings...</p>

  const inputCls = 'flex-1 px-3 py-2 text-sm focus:outline-none'
  const wrapCls  = 'flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-300'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Autonomy Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Control how much Sil can act on your behalf without asking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: settings ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Emergency Pause */}
          <div className={`rounded-2xl border-2 p-5 transition-colors ${
            settings.emergencyPause ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚨</span>
                  <h2 className="font-bold text-gray-800">Emergency Pause</h2>
                  {settings.emergencyPause && (
                    <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">ACTIVE</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {settings.emergencyPause
                    ? 'All autonomous actions are frozen. No Sil actions will execute until this is lifted.'
                    : 'System is active. Sil can execute actions within your configured limits.'}
                </p>
              </div>
              <button
                onClick={() => set({ emergencyPause: !settings.emergencyPause })}
                className={`relative inline-flex w-14 h-7 rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${
                  settings.emergencyPause ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.emergencyPause ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Global Autonomy Mode */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Global Autonomy Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AUTONOMY_MODES.map((mode) => {
                const active = settings.autonomyMode === mode.value
                return (
                  <button
                    key={mode.value}
                    onClick={() => set({ autonomyMode: mode.value })}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{mode.icon}</span>
                      <span className={`text-xs font-semibold ${mode.riskColor}`}>{mode.risk}</span>
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${active ? 'text-blue-700' : 'text-gray-700'}`}>{mode.label}</p>
                    <p className="text-xs text-gray-500 leading-snug">{mode.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Thresholds */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Thresholds</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Auto-approve below</label>
                <div className={wrapCls}>
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">$</span>
                  <input type="number" min="0" value={settings.autoApproveThreshold}
                    onChange={(e) => set({ autoApproveThreshold: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Orders under this amount execute automatically.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max single order cap</label>
                <div className={wrapCls}>
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">$</span>
                  <input type="number" min="0" value={settings.maxSingleOrderValue}
                    onChange={(e) => set({ maxSingleOrderValue: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Hard limit — never exceeded regardless of other settings.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reorder trigger</label>
                <div className={wrapCls}>
                  <input type="number" min="0" value={settings.reorderTrigger}
                    onChange={(e) => set({ reorderTrigger: Number(e.target.value) })}
                    className={inputCls} />
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-200">units</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Min stock level that triggers an automatic reorder.</p>
              </div>
            </div>
          </div>

          {/* Per-Category Overrides */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-800">Per-Category Overrides</h2>
              <p className="text-xs text-gray-400 mt-0.5">Overrides the global mode for specific inventory categories.</p>
            </div>
            <div className="divide-y divide-gray-50">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium text-gray-700">{cat}</span>
                  <select
                    value={settings.categoryOverrides[cat] || 'semi-auto'}
                    onChange={(e) => setCategoryOverride(cat, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="full-auto">Full Auto</option>
                    <option value="semi-auto">Semi-Auto</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Notification Preferences</h2>
            <div className="space-y-2">
              {NOTIFICATION_OPTIONS.map((opt) => {
                const active = settings.notificationPreference === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      active ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="notification"
                      value={opt.value}
                      checked={active}
                      onChange={() => set({ notificationPreference: opt.value })}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 shadow-blue-500/20'
            }`}
          >
            {saved ? '✓ Settings saved' : saving ? 'Saving...' : 'Save Settings'}
          </button>

        </div>

        {/* ── Right: Sil ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <AIPanel
              screen="settings"
              contextData={{ allData: settings, filteredData: settings, activeFilters: {} }}
              description="Sil will explain what your current autonomy configuration means in plain English, and flag any risks."
              defaultPrompt="Explain what the current autonomy configuration means in practice. What actions will execute automatically, what will need approval, and are there any risks with this setup the user should know about?"
              suggestions={SETTINGS_SUGGESTIONS}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
