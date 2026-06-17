import React from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, containers, buttonStyles, getLabelColor, getProgressColor } from '../theme/colors.js'

const LABEL_COLORS = colors.labels

export default function HabitHeatmap() {
  const { getHabitHeatmapRows, getToday } = useLifeOS()
  const rows = getHabitHeatmapRows()

  // 🧪 Console logging for heatmap debugging
  React.useEffect(() => {
    if (rows.length > 0) {
      console.log('📊 [HEATMAP] Current test date:', getToday())
      console.log('📊 [HEATMAP] Tracking', rows.length, 'habits')

      rows.forEach((row) => {
        const completedDays = row.completion.filter((c) => c === 1).length
        const totalDays = row.completion.filter((c) => c !== -1).length
        const completedDates = row.dates.filter((d, idx) => row.completion[idx] === 1)
        console.log(`  • ${row.title}: ${completedDays}/${totalDays} days completed`, {
          habitId: row.habitId,
          isRecurring: row.isRecurring,
          dateRange: `${row.dates[0]} to ${row.dates[row.dates.length - 1]}`,
          totalDates: row.dates.length,
          completedDates: completedDates,
          fullCompletion: row.completion,
        })
      })
    } else {
      console.log('⚠️ [HEATMAP] No habit data! Checking store state...')
      // This will help debug why no rows are returned
      console.log('⚠️ Check if habits exist in tasks and are marked as category="habit"')
    }
  }, [rows, getToday])

  if (rows.length === 0) {
    return null
  }

  // Group dates by week and month for better visualization
  return (
    <div style={{ ...containers.section }}>
      <h3 style={{ ...typography.sectionHeader, margin: '0 0 10px 0' }}>
        📊 habit tracking
      </h3>

      {/* Heatmap Grid */}
      <div style={{ overflowX: 'auto', msOverflowStyle: 'scrollbar' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '10px',
            minWidth: 'fit-content',
          }}
        >
          {/* Header: Month/Week labels */}
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px', minWidth: '80px', fontWeight: 'bold', color: colors.text.secondary, fontSize: '10px', borderBottom: `1px solid ${colors.border}` }}>
                Habit
              </th>
              {rows[0].dates.map((d, idx) => {
                // Show month label every 30 days
                const showLabel = idx === 0 || idx % 30 === 0
                const date = new Date(d + 'T00:00:00')
                const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
                const year = showLabel ? date.getFullYear() : ''
                
                return (
                  <th
                    key={idx}
                    style={{
                      padding: '2px 1px',
                      textAlign: 'center',
                      fontSize: '7px',
                      color: colors.text.tertiary,
                      minWidth: '16px',
                      borderBottom: `1px solid ${colors.border}`,
                      fontWeight: showLabel ? 'bold' : 'normal',
                    }}
                    title={d}
                  >
                    {showLabel ? `${monthLabel} ${year}` : ''}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Rows: Each habit */}
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {/* Habit name */}
                <td
                  style={{
                    padding: '6px 8px',
                    textAlign: 'left',
                    fontWeight: '500',
                    color: colors.text.primary,
                    borderRight: `1px solid ${colors.border}`,
                    minWidth: '80px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    style={{
                      fontSize: '8px',
                      background: LABEL_COLORS[row.label] || colors.border,
                      color: colors.text.inverted,
                      padding: '2px 4px',
                      borderRadius: '3px',
                      marginRight: '4px',
                    }}
                  >
                    {row.label}
                  </span>
                  {row.title}
                </td>

                {/* Day cells */}
                {row.completion.map((completed, dayIdx) => {
                  // -1 means not applicable (for recurring habits on dates they don't occur)
                  if (completed === -1) {
                    return (
                      <td
                        key={dayIdx}
                        style={{
                          padding: '2px',
                          textAlign: 'center',
                          background: 'transparent',
                          border: 'none',
                          minWidth: '16px',
                          height: '16px',
                        }}
                      />
                    )
                  }

                  return (
                    <td
                      key={dayIdx}
                      style={{
                        padding: '2px',
                        textAlign: 'center',
                        background: completed ? colors.progress.high : colors.progress.low,
                        border: `1px solid ${colors.borderSubtle}`,
                        minWidth: '16px',
                        height: '16px',
                        cursor: 'default',
                        transition: 'all 0.2s ease',
                      }}
                      title={`${row.dates[dayIdx]}: ${completed ? '✓ Completed' : '⚠️ Skipped'}`}
                    >
                      {completed && (
                        <span style={{ fontSize: '7px', color: '#fff', fontWeight: 'bold', lineHeight: '1' }}>✓</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      {(() => {
        const totalApplicable = rows.reduce((sum, r) => sum + r.completion.filter((c) => c !== -1).length, 0)
        const totalCompleted = rows.reduce((sum, r) => sum + r.completion.filter((c) => c === 1).length, 0)
        const rate = totalApplicable > 0 ? Math.round((totalCompleted / totalApplicable) * 100) : 0
        return (
          <div style={{ marginTop: '8px', padding: '6px 8px', background: colors.subsurface, borderRadius: '6px', fontSize: '9px', color: colors.text.secondary }}>
            📈 {rows[0]?.dates.length} days tracked • {totalCompleted}/{totalApplicable} completed ({rate}%)
          </div>
        )
      })()}
    </div>
  )
}
