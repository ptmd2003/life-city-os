import React, { useEffect, useState } from 'react'
import TaskForm from './TaskForm'
import TaskChecklist from './TaskChecklist'
import DailyCheckIn from './DailyCheckIn'
import UpcomingNotes from './UpcomingNotes'
import HabitHeatmap from './HabitHeatmap'
import SleepMoodAnalytics from './SleepMoodAnalytics'
import CalendarView from './CalendarView'
import UndoRedoController from './UndoRedoController'
import UndoRedoButtons from './UndoRedoButtons'
import { SeasonSystem } from '../game/world/SeasonSystem.js'
import { useCityStore } from '../stores/useCityStore'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, containers } from '../theme/colors.js'
import '../styles/LifeOSSidebar.css'

export default function LifeOSSidebar() {
  const { currentTime, timePeriod, seasonName, updateTime, showAnalyticsPanel, setShowAnalyticsPanel } = useCityStore()
  const { testDateOffset, setTestDate, resetTestDate, getToday } = useLifeOS()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [seasonDisplay, setSeasonDisplay] = useState(SeasonSystem.getSeasonTheme().name)

  // Update time every second + poll season changes every 100ms
  useEffect(() => {
    updateTime()
    const interval = setInterval(() => {
      updateTime()
      setSeasonDisplay(SeasonSystem.getSeasonTheme().name)
    }, 100)
    return () => clearInterval(interval)
  }, [updateTime])

  const handleSeasonClick = () => {
    SeasonSystem.cycleTestSeason()
    setSeasonDisplay(SeasonSystem.getSeasonTheme().name)
  }

  const timeString = `${String(currentTime.hour).padStart(2, '0')}:${String(currentTime.minute).padStart(2, '0')}`

  return (
    <div className="life-os-panel">
      {/* Keyboard Shortcuts Handler */}
      <UndoRedoController />

      {/* Panel Header — Dynamic title based on view */}
      <div className="panel-header">
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          {showAnalyticsPanel ? '📊 insights' : 'life os'}
        </h2>
        <div className="header-buttons">
          <UndoRedoButtons />
          <button
            onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
            title={showAnalyticsPanel ? 'back to life os' : 'toggle insights'}
            className={`storage-toggle-btn ${showAnalyticsPanel ? 'active' : ''}`}
          >
            📊
          </button>
        </div>
      </div>

      {/* VIEW 1: Life OS (Tasks, Check-in, Calendar) */}
      {!showAnalyticsPanel && (
        <>
          {/* Time Display Status Bar + Season Test Button */}
          <div className="life-os-card" style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
              <span className="life-os-data">{timeString}</span>
              <span style={{ color: colors.border }}>•</span>
              <span>{new Date(getToday() + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span style={{ color: colors.border }}>•</span>
              <span style={{ color: colors.primary, fontWeight: 600 }}>{timePeriod}</span>
            </div>
            <button
              onClick={handleSeasonClick}
              title="cycle test season (also: press G in game)"
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '6px 8px',
                background: colors.border,
                color: colors.primary,
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = colors.primary}
              onMouseLeave={(e) => e.target.style.background = colors.border}
            >
              🌍 {seasonDisplay}
            </button>
          </div>

          {/* Test Date Picker (dev only) */}
          <div className="life-os-card">
            <div className="life-os-form-group">
              <label className="life-os-label" style={{ fontSize: '11px' }}>test date dev</label>
              <input
                type="date"
                value={getToday()}
                onChange={(e) => setTestDate(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>
            <button
              onClick={() => resetTestDate()}
              className="life-os-btn-primary full-width"
              title="reset to today"
              style={{ fontSize: '11px', padding: '6px' }}
            >
              reset
            </button>
          </div>

          {/* Daily Check-in */}
          <DailyCheckIn />

          {/* Today's Focus (Checklist) */}
          <div style={{ ...containers.section }}>
            <h3 style={{ ...typography.sectionHeader, margin: '0 0 12px 0' }}>today's focus</h3>
            <TaskChecklist />
          </div>

          {/* Add Task Button */}
          {showTaskForm ? (
            <TaskForm onClose={() => setShowTaskForm(false)} />
          ) : (
            <button
              onClick={() => setShowTaskForm(true)}
              className="life-os-btn-primary full-width"
            >
              + add task
            </button>
          )}

          {/* Planning Section */}
          <CalendarView onDateSelect={setSelectedDate} />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Date Modal */}
          {selectedDate && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: colors.darkOverlay,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setSelectedDate(null)}
            >
              <div
                className="ds-card ds-floating"
                style={{
                  maxWidth: '400px',
                  width: '90%',
                  position: 'relative',
                  border: `2px solid var(--matcha-core)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="ds-header" style={{ marginBottom: 'var(--space-md)' }}>
                  <h2 className="ds-subsection-title" style={{ margin: 0 }}>
                    📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h2>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="ds-btn-tertiary"
                    style={{ padding: '4px 8px', fontSize: '16px' }}
                  >
                    ✕
                  </button>
                </div>

                <div className="ds-section" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="ds-caption" style={{ marginBottom: 'var(--space-sm)' }}>type:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
                    {['task', 'habit', 'event'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setShowTaskForm(true)
                          setSelectedDate(null)
                        }}
                        className="ds-btn-secondary ds-btn-small"
                      >
                        {cat === 'task' ? '✓ task' : cat === 'habit' ? '🔄 habit' : '📌 event'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDate(null)}
                  className="ds-btn-tertiary ds-w-full"
                  style={{ padding: '10px' }}
                >
                  close
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Analytics (Insights, Heatmap, Sleep/Mood) */}
      {showAnalyticsPanel && (
        <>
          <UpcomingNotes />
          <HabitHeatmap />
          <SleepMoodAnalytics />
          <div style={{ flex: 1 }} />
        </>
      )}
    </div>
  )
}
