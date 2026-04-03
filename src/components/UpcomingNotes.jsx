import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, containers, buttonStyles, getLabelColor } from '../theme/colors.js'

const LABEL_COLORS = colors.labels

export default function UpcomingNotes() {
  const { getUpcomingTasks } = useLifeOS()
  const [isExpanded, setIsExpanded] = useState(false)
  const upcomingTasks = getUpcomingTasks()

  if (upcomingTasks.length === 0) {
    return null
  }

  // Group tasks by date
  const tasksByDate = {}
  upcomingTasks.forEach((task) => {
    if (!tasksByDate[task.dueDate]) {
      tasksByDate[task.dueDate] = []
    }
    tasksByDate[task.dueDate].push(task)
  })

  const sortedDates = Object.keys(tasksByDate).sort()

  return (
    <div style={containers.section}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          ...buttonStyles.collapse,
          marginBottom: isExpanded ? spacing.sm : '0',
        }}
        onMouseEnter={(e) => e.target.style.background = colors.subsurface}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        <span style={{ ...typography.sectionHeader, flex: 0.5 }}>📅 upcoming ({upcomingTasks.length})</span>
        <span style={{ fontSize: '11px' }}>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedDates.map((date) => {
            const dateObj = new Date(date)
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })

            return (
              <div key={date}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: colors.text.tertiary, marginBottom: '6px' }}>
                  {dayName} - {dateStr}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {tasksByDate[date].map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '8px 10px',
                        background: colors.subsurface,
                        borderLeft: `3px solid ${LABEL_COLORS[task.label] || colors.border}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ marginBottom: '4px', color: colors.text.primary, fontWeight: '500' }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            background: LABEL_COLORS[task.label] || colors.border,
                            color: colors.text.inverted,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {task.label}
                        </span>
                        <span style={{ fontSize: '9px', color: colors.text.tertiary }}>+{task.points}pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
