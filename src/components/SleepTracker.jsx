import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, buttonStyles, containers } from '../theme/colors.js'

export default function SleepTracker() {
  const { sleep, setYesterdaySleepTime, setTodayWakeTime } = useLifeOS()
  
  // Format ISO timestamp to HH:MM
  const formatTimeValue = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toTimeString().substring(0, 5)
  }

  // Extract hour from time string (HH:MM)
  const getHourFromTimeString = (timeStr) => {
    if (!timeStr) return null
    const [hours] = timeStr.split(':').map(Number)
    return hours
  }

  // Get color based on sleep time (later than 23:00 = warning, else success)
  const getSleepTimeColor = () => {
    const hour = getHourFromTimeString(formatTimeValue(sleep.yesterdaySleepTime))
    if (hour === null) return colors.text.secondary
    return hour >= 23 ? colors.warning : colors.success
  }

  // Get color based on wake time (later than 07:00 = warning, else success)
  const getWakeTimeColor = () => {
    const hour = getHourFromTimeString(formatTimeValue(sleep.todayWakeTime))
    if (hour === null) return colors.text.secondary
    return hour > 7 ? colors.warning : colors.success
  }

  // State for form inputs
  const [tempSleepTime, setTempSleepTime] = useState(formatTimeValue(sleep.yesterdaySleepTime))
  const [tempWakeTime, setTempWakeTime] = useState(formatTimeValue(sleep.todayWakeTime))
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate sleep duration
  const calculateSleepHours = () => {
    if (!sleep.yesterdaySleepTime || !sleep.todayWakeTime) return null
    
    const sleepDate = new Date(sleep.yesterdaySleepTime)
    const wakeDate = new Date(sleep.todayWakeTime)
    const diffMs = wakeDate - sleepDate
    const hours = (diffMs / (1000 * 60 * 60)).toFixed(1)
    return hours
  }

  const sleepHours = calculateSleepHours()
  const currentSleepTime = formatTimeValue(sleep.yesterdaySleepTime)
  const currentWakeTime = formatTimeValue(sleep.todayWakeTime)

  const handleSave = () => {
    if (tempSleepTime) {
      setYesterdaySleepTime(tempSleepTime)
    }
    if (tempWakeTime) {
      setTodayWakeTime(tempWakeTime)
    }
    setIsExpanded(false)
  }

  return (
    <div>
      {!isExpanded ? (
        <div
          onClick={() => { setIsExpanded(true); setTempSleepTime(currentSleepTime); setTempWakeTime(currentWakeTime) }}
          style={{
            cursor: 'pointer',
            padding: spacing.containerPadding,
            background: colors.surface,
            borderRadius: '12px',
            boxShadow: colors.shadow.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            ...typography.collapsedContent,
            marginBottom: spacing.sectionMargin,
            border: `1px solid ${colors.border}`,
          }}
          title="Click to edit sleep cycle"
        >
          <span style={{ fontSize: '12px', fontWeight: '600', color: colors.primary }}>💤 sleep cycle</span>
          <span style={{ color: getSleepTimeColor() }}>{currentSleepTime || '—'}</span>
          <span style={{ color: colors.text.secondary }}>→</span>
          <span style={{ color: getWakeTimeColor() }}>{currentWakeTime || '—'}</span>
          {sleepHours && (
            <>
              <span style={{ color: colors.text.secondary }}>•</span>
              <span style={{ color: '#4a90e2' }}>{sleepHours}h</span>
            </>
          )}
        </div>
      ) : (
        <div style={containers.section}>
          <h3 style={{ ...typography.sectionHeader, marginBottom: spacing.sm }}>edit sleep cycle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginBottom: spacing.sm }}>
            <div>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px', color: colors.text.primary, fontWeight: 'bold' }}>
                Sleep Yesterday
              </label>
              <input
                type="time"
                value={tempSleepTime}
                onChange={(e) => setTempSleepTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  background: colors.surface,
                  color: colors.text.primary,
                  boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px', color: colors.text.primary, fontWeight: 'bold' }}>
                Wake Today
              </label>
              <input
                type="time"
                value={tempWakeTime}
                onChange={(e) => setTempWakeTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  background: colors.surface,
                  color: colors.text.primary,
                  boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                ...buttonStyles.primary,
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              save
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                flex: 1,
                ...buttonStyles.secondary,
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
