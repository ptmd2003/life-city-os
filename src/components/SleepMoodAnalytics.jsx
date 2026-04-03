import React, { useMemo } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, containers } from '../theme/colors.js'

/**
 * Sleep + Mood Analytics — Phase 1 Dashboard
 * Shows insights: average sleep, consistency, quality score, mood trends, correlations
 */
export default function SleepMoodAnalytics() {
  const { getToday, getHabitCompletionHistoryForDateRange } = useLifeOS()
  const store = useLifeOS()
  const today = getToday()

  // ────────────────────────────────────────────────────────────
  // EXTRACT SLEEP & MOOD DATA FOR LAST 7 DAYS
  // ────────────────────────────────────────────────────────────

  const analytics = useMemo(() => {
    const dayCount = 7
    const dates = []
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(today + 'T00:00:00')
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }

    // Stub sleep & mood data (would come from historical tracking)
    // For now, use today's values and simulate historical data
    const sleepData = dates.map((dateStr, idx) => ({
      date: dateStr,
      hours: 7 + Math.sin(idx / 2) * 1.5, // Simulate variation (7±1.5h)
      quality: Math.random() > 0.2 ? 'good' : 'poor', // 80% good
    }))

    const moodData = dates.map((dateStr, idx) => ({
      date: dateStr,
      energy: 3 + Math.random() * 2, // 3-5 scale
      mood: 3 + Math.random() * 2,   // 3-5 scale
    }))

    // Calculate insights
    const avgSleep = (sleepData.reduce((sum, d) => sum + d.hours, 0) / dayCount).toFixed(1)
    const consistencyStreak = sleepData.filter((d) => d.hours >= 7).length
    const sleepQualityScore = Math.round(
      (sleepData.filter((d) => d.quality === 'good').length / dayCount) * 100
    )

    const avgEnergy = (
      moodData.reduce((sum, d) => sum + d.energy, 0) / dayCount
    ).toFixed(1)
    const avgMood = (moodData.reduce((sum, d) => sum + d.mood, 0) / dayCount).toFixed(1)

    // Mood trend: compare first half to second half
    const firstHalf = moodData.slice(0, Math.floor(dayCount / 2))
    const secondHalf = moodData.slice(Math.floor(dayCount / 2))
    const moodTrend = (
      secondHalf.reduce((s, d) => s + d.mood, 0) / secondHalf.length -
      firstHalf.reduce((s, d) => s + d.mood, 0) / firstHalf.length
    ).toFixed(2)
    const moodTrendDirection = moodTrend > 0.2 ? 'up' : moodTrend < -0.2 ? 'down' : 'stable'

    // Sleep ↔ Mood Correlation (simplified: good sleep days = good mood days)
    const goodSleepGoodMoodDays = sleepData.filter(
      (sleep, idx) => sleep.hours >= 7 && moodData[idx].mood >= 3.5
    ).length
    const correlationPercent = Math.round((goodSleepGoodMoodDays / dayCount) * 100)

    return {
      dates,
      sleepData,
      moodData,
      avgSleep,
      consistencyStreak,
      sleepQualityScore,
      avgEnergy,
      avgMood,
      moodTrend,
      moodTrendDirection,
      correlationPercent,
    }
  }, [today])

  // ────────────────────────────────────────────────────────────
  // RENDER ANALYTICS CARDS
  // ────────────────────────────────────────────────────────────

  const cardStyle = {
    background: colors.surface,
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '12px',
    boxShadow: colors.shadow.sm,
    border: `1px solid ${colors.border}`,
  }

  const headerStyle = {
    ...typography.secondary,
    fontWeight: '600',
    marginBottom: '6px',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  }

  const metricStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: '12px',
    borderBottom: `1px solid ${colors.borderSubtle}`,
  }

  const metricLabelStyle = {
    color: colors.text.secondary,
    fontWeight: '500',
  }

  const metricValueStyle = {
    fontWeight: 'bold',
    fontSize: '13px',
    color: colors.text.primary,
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* ─── SLEEP INSIGHTS ─── */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          🌙 Sleep Insights (7 days)
        </div>

        <div style={metricStyle}>
          <span style={metricLabelStyle}>Average hours</span>
          <span style={metricValueStyle}>{analytics.avgSleep}h</span>
        </div>

        <div style={{ ...metricStyle, borderBottom: 'none' }}>
          <span style={metricLabelStyle}>Sleep streak (7h+)</span>
          <span style={metricValueStyle}>
            {analytics.consistencyStreak}/7 days
          </span>
        </div>

        <div style={{ ...metricStyle, borderBottom: 'none', marginTop: '4px' }}>
          <span style={metricLabelStyle}>Quality score</span>
          <span
            style={{
              ...metricValueStyle,
              color: analytics.sleepQualityScore >= 70 ? colors.success : colors.danger,
            }}
          >
            {analytics.sleepQualityScore}%
          </span>
        </div>
      </div>

      {/* ─── MOOD INSIGHTS ─── */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          😊 Mood Insights (7 days)
        </div>

        <div style={metricStyle}>
          <span style={metricLabelStyle}>Average energy</span>
          <span style={metricValueStyle}>{analytics.avgEnergy}/5</span>
        </div>

        <div style={metricStyle}>
          <span style={metricLabelStyle}>Average mood</span>
          <span style={metricValueStyle}>{analytics.avgMood}/5</span>
        </div>

        <div style={{ ...metricStyle, borderBottom: 'none' }}>
          <span style={metricLabelStyle}>Trend</span>
          <span
            style={{
              ...metricValueStyle,
              color:
                analytics.moodTrendDirection === 'up'
                  ? '#6aab7a'
                  : analytics.moodTrendDirection === 'down'
                    ? '#e07070'
                    : '#999',
            }}
          >
            {analytics.moodTrendDirection === 'up' && '↑ Improving'}
            {analytics.moodTrendDirection === 'down' && '↓ Declining'}
            {analytics.moodTrendDirection === 'stable' && '→ Stable'}
          </span>
        </div>
      </div>

      {/* ─── SLEEP ↔ MOOD CORRELATION ─── */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          🔗 Sleep × Mood Link
        </div>

        <div style={{ ...metricStyle, borderBottom: 'none' }}>
          <span style={metricLabelStyle}>Good sleep → Good mood</span>
          <span style={{ ...metricValueStyle, color: '#4a90e2' }}>
            {analytics.correlationPercent}%
          </span>
        </div>

        <div style={{ fontSize: '10px', color: '#999', marginTop: '6px', lineHeight: '1.3' }}>
          💡 Tip: Your mood improves{' '}
          {analytics.correlationPercent > 70
            ? 'significantly'
            : analytics.correlationPercent > 40
              ? 'often'
              : 'sometimes'}{' '}
          when you sleep 7+ hours.
        </div>
      </div>

      {/* ─── DEBUG INFO ─── */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '9px', color: '#bbb', padding: '8px', background: '#f9f9f9', borderRadius: '4px', marginTop: '8px' }}>
          📊 [DEBUG] Using 7-day rolling window. Simulated data for prototype.
        </div>
      )}
    </div>
  )
}
