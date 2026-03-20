import { useCityStore } from '../stores/useCityStore'

const DISTRICTS = [
  { key: 'health',    emoji: '❤️',  label: 'Health Core',      color: '#e07070' },
  { key: 'knowledge', emoji: '📚',  label: 'Knowledge Tower',  color: '#9888b0' },
  { key: 'garden',    emoji: '🌿',  label: 'Garden Park',      color: '#6aab7a' },
]

export default function Sidebar() {
  const { districts, logActivity, groundPaintMode, setGroundPaintMode } = useCityStore()

  return (
    <div style={{
      width: '320px', background: '#f8f2e8', padding: '24px',
      display: 'flex', flexDirection: 'column', gap: '16px',
      fontFamily: 'Georgia, serif', overflowY: 'auto'
    }}>
      {/* Header with Edit Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#c4673a', margin: 0, fontSize: '20px' }}>🏙️ Life City OS</h1>
        <button
          onClick={() => setGroundPaintMode(!groundPaintMode)}
          title="Toggle Edit Mode (Ground Painter)"
          style={{
            background: groundPaintMode ? '#6aab7a' : '#e0e0e0',
            color: groundPaintMode ? '#fff' : '#666',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: groundPaintMode ? '0 0 12px rgba(106, 171, 122, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🖌️
        </button>
      </div>

      {DISTRICTS.map(({ key, emoji, label, color }) => {
        const { xp, level, streak } = districts[key]
        const progress = (xp % 100)
        return (
          <div key={key} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color, margin: '0 0 4px', fontSize: '14px' }}>{emoji} {label}</h3>
            <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#c4673a', margin: '0 0 4px' }}>Lv.{level} — {xp} XP</p>
            
            {/* Progress bar */}
            <div style={{ background: '#f0ebe3', borderRadius: '4px', height: '6px', margin: '8px 0' }}>
              <div style={{ width: `${progress}%`, background: color, borderRadius: '4px', height: '100%', transition: 'width 0.4s ease' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#999' }}>🔥 {streak} day streak</span>
              <button onClick={() => logActivity(key)} style={{
                background: '#c4673a', color: 'white', border: 'none',
                borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px'
              }}>
                + Log
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
