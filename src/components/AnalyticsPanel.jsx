import React from 'react'
import UpcomingNotes from './UpcomingNotes'
import HabitHeatmap from './HabitHeatmap'
import SleepMoodAnalytics from './SleepMoodAnalytics'
import { useCityStore } from '../stores/useCityStore'
import { colors, typography, containers } from '../theme/colors.js'

/**
 * AnalyticsPanel — Right-side panel with productivity insights
 * Contains: Upcoming Notes, Habit Heatmap, Sleep/Mood Analytics
 * Slides in from the right, positioned after LifeOSSidebar
 */
export default function AnalyticsPanel() {
  const { showAnalyticsPanel } = useCityStore()

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '350px',
        background: colors.bg || '#1a1a2e',
        borderLeft: `1px solid ${colors.border}`,
        overflowY: 'auto',
        zIndex: 99,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transform: showAnalyticsPanel ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.primary }}>
          insights
        </h2>
      </div>

      {/* Analytics Sections */}
      <UpcomingNotes />
      <HabitHeatmap />
      <SleepMoodAnalytics />
    </div>
  )
}
