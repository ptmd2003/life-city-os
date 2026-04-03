import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, containers } from '../theme/colors.js'

const MOOD_LABELS = {
  1: 'Exhausted',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
}

/**
 * DailyCheckIn — Consolidated daily metrics in Notion-style layout
 * Combines: sleep times, mood, energy (compact, minimal spacing)
 */
export default function DailyCheckIn() {
  const { todayMood, setMood, sleep, setYesterdaySleepTime, setTodayWakeTime } = useLifeOS()
  const [tempSleepTime, setTempSleepTime] = useState(formatTimeValue(sleep.yesterdaySleepTime))
  const [tempWakeTime, setTempWakeTime] = useState(formatTimeValue(sleep.todayWakeTime))
  const [isEditingSleep, setIsEditingSleep] = useState(false)

  // Format ISO timestamp to HH:MM
  function formatTimeValue(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toTimeString().substring(0, 5)
  }

  const handleEnergyChange = (value) => {
    setMood(value, todayMood.mood, todayMood.note)
  }

  const handleMoodChange = (value) => {
    setMood(todayMood.energy, value, todayMood.note)
  }

  const handleSleepSave = () => {
    if (tempSleepTime) setYesterdaySleepTime(tempSleepTime)
    if (tempWakeTime) setTodayWakeTime(tempWakeTime)
  }

  return (
    <div style={{ ...containers.section, marginBottom: spacing.sectionMargin }}>
      {/* Header */}
      <h3 style={{ ...typography.sectionHeader, margin: '0 0 10px 0' }}>
        daily check-in
      </h3>

      {/* Sleep Times — Compact Inline */}
      {!isEditingSleep ? (
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'center',
            marginBottom: spacing.md,
            padding: '8px 10px',
            background: colors.subsurface,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          onClick={() => setIsEditingSleep(true)}
        >
          <span style={{ flex: 1, color: colors.text.secondary, fontWeight: '500' }}>sleep cycle</span>
          <span style={{ fontFamily: 'monospace', color: colors.text.primary, fontWeight: '600' }}>
            {formatTimeValue(sleep.yesterdaySleepTime) || '—'}
          </span>
          <span style={{ color: colors.text.tertiary }}>→</span>
          <span style={{ fontFamily: 'monospace', color: colors.text.primary, fontWeight: '600' }}>
            {formatTimeValue(sleep.todayWakeTime) || '—'}
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: spacing.md }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xs, marginBottom: spacing.xs }}>
            <input
              type="time"
              value={tempSleepTime}
              onChange={(e) => setTempSleepTime(e.target.value)}
              style={{
                padding: '6px 8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                background: colors.surface,
                color: colors.text.primary,
                boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
                boxSizing: 'border-box',
              }}
            />
            <input
              type="time"
              value={tempWakeTime}
              onChange={(e) => setTempWakeTime(e.target.value)}
              style={{
                padding: '6px 8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                background: colors.surface,
                color: colors.text.primary,
                boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <button
              onClick={() => {
                handleSleepSave()
                setIsEditingSleep(false)
              }}
              style={{
                flex: 1,
                padding: '6px',
                border: `1px solid ${colors.primary}`,
                background: colors.primary,
                color: colors.text.inverted,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              submit
            </button>
            <button
              onClick={() => setIsEditingSleep(false)}
              style={{
                flex: 1,
                padding: '6px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.text.primary,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* Mood + Energy — Ultra-Compact Inline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
        {/* Mood */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: colors.text.secondary }}>
            mood
          </label>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleMoodChange(value)}
                style={{
                  flex: 1,
                  padding: '5px',
                  border: `1.5px solid ${todayMood.mood === value ? colors.primary : colors.border}`,
                  background: todayMood.mood === value ? colors.primary : colors.surface,
                  color: todayMood.mood === value ? colors.text.inverted : colors.text.secondary,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '700',
                  transition: 'all 100ms ease',
                  lineHeight: '1',
                }}
                onMouseEnter={(e) => {
                  if (todayMood.mood !== value) {
                    e.target.style.borderColor = colors.primary
                    e.target.style.background = colors.subsurface
                  }
                }}
                onMouseLeave={(e) => {
                  if (todayMood.mood !== value) {
                    e.target.style.borderColor = colors.border
                    e.target.style.background = colors.surface
                  }
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: colors.text.secondary }}>
            energy
          </label>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleEnergyChange(value)}
                style={{
                  flex: 1,
                  padding: '5px',
                  border: `1.5px solid ${todayMood.energy === value ? colors.primary : colors.border}`,
                  background: todayMood.energy === value ? colors.primary : colors.surface,
                  color: todayMood.energy === value ? colors.text.inverted : colors.text.secondary,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '700',
                  transition: 'all 100ms ease',
                  lineHeight: '1',
                }}
                onMouseEnter={(e) => {
                  if (todayMood.energy !== value) {
                    e.target.style.borderColor = colors.primary
                    e.target.style.background = colors.subsurface
                  }
                }}
                onMouseLeave={(e) => {
                  if (todayMood.energy !== value) {
                    e.target.style.borderColor = colors.border
                    e.target.style.background = colors.surface
                  }
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
