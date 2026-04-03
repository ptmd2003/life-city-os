import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, buttonStyles, containers, getLabelColor, getRecurringColor } from '../theme/colors.js'
import '../styles/CalendarView.css'

const LABEL_COLORS = colors.labels

const RECURRING_COLORS = colors.recurring

/**
 * CalendarView — Google Calendar-style month view with year/month navigation (2026-2030)
 */
export default function CalendarView({ onDateSelect }) {
  const { tasks, getToday, shouldRecurOnDate, recurringTaskCompletions } = useLifeOS()
  const [displayDate, setDisplayDate] = useState(new Date(getToday() + 'T00:00:00'))
  const [selectedDate, setSelectedDate] = useState(null)
  const [showYearPicker, setShowYearPicker] = useState(false)

  // Year range: 2026-2030
  const YEARS = [2026, 2027, 2028, 2029, 2030]

  // Group tasks by date — including recurring task instances
  const tasksByDate = {}
  
  // Add non-recurring tasks and task templates
  tasks.forEach((task) => {
    if (!tasksByDate[task.dueDate]) {
      tasksByDate[task.dueDate] = []
    }
    tasksByDate[task.dueDate].push(task)
  })

  // Helper: Format date as YYYY-MM-DD in local timezone (not UTC)
  const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // For each day in the calendar range, add recurring task instances
  // We'll generate instances for a 14-month window (previous month through next 12 months from displayDate)
  const generateRecurringInstances = () => {
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth()
    
    // Generate date range for instances
    const rangeStart = new Date(year, month, 1)
    rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay()) // Start from Sunday
    
    const rangeEnd = new Date(year, month + 1, 0)
    rangeEnd.setDate(rangeEnd.getDate() + (6 - rangeEnd.getDay())) // End on Saturday
    
    // For each recurring task, generate instances for dates in range
    tasks.forEach((task) => {
      if (task.recurring) {
        const current = new Date(rangeStart)
        while (current <= rangeEnd) {
          const dateStr = formatLocalDate(current)
          
          if (shouldRecurOnDate(task, dateStr)) {
            if (!tasksByDate[dateStr]) {
              tasksByDate[dateStr] = []
            }
            
            // Create a recurring instance for this date
            // (Don't duplicate if the task already has this exact dueDate)
            if (task.dueDate !== dateStr) {
              const instance = {
                ...task,
                _instanceDate: dateStr, // Track the instance date separately
                _originalId: task.id, // Store original ID for actions
                isRecurringInstance: true,
              }
              
              // Check if instance already exists
              const exists = tasksByDate[dateStr].some((t) => t._originalId === task.id && t._instanceDate === dateStr)
              if (!exists) {
                tasksByDate[dateStr].push(instance)
              }
            }
          }
          
          current.setDate(current.getDate() + 1)
        }
      }
    })
  }

  generateRecurringInstances()

  if (tasks.length === 0) {
    return null
  }

  // Get calendar days for the displayed month
  const getCalendarDays = () => {
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth()

    // First day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Days from previous month to fill the grid
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    // Generate 42 days (6 weeks × 7 days)
    const days = []
    const current = new Date(startDate)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const days = getCalendarDays()
  const currentYear = displayDate.getFullYear()
  const currentMonth = displayDate.getMonth()
  const monthName = displayDate.toLocaleDateString('en-US', { month: 'long' })
  const today = getToday()

  const handlePrevMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleYearChange = (year) => {
    setDisplayDate(new Date(year, currentMonth, 1))
  }

  return (
    <div style={{ ...containers.section }}>
      <h3 style={{ ...typography.sectionHeader, margin: '0 0 12px 0' }}>
        📅 calendar
      </h3>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
        <button
          onClick={handlePrevMonth}
          className="calendar-nav-button life-os-btn-primary"
          style={{
            background: colors.primary,
            border: 'none',
            borderRadius: '10px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: colors.text.inverted,
            fontFamily: "'Noto Sans JP', sans-serif",
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          ← Prev
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <button
            onClick={() => setShowYearPicker(!showYearPicker)}
            className="calendar-month-button"
            style={{ 
              fontSize: '14px', 
              fontWeight: '700',
              fontFamily: "'Zen Maru Gothic', sans-serif",
              color: colors.primary,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              background: showYearPicker ? colors.subsurface : colors.surface,
              border: `1px solid ${showYearPicker ? colors.primary : colors.border}`,
              textTransform: 'lowercase',
              letterSpacing: '0.2px',
            }}
          >
            {monthName} {currentYear}
          </button>
          
          {showYearPicker && (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
              marginTop: spacing.md,
              padding: spacing.containerPadding,
              background: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              boxShadow: colors.shadow.sm,
              zIndex: 10,
            }}>
              {/* Months Grid (3x4) */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: colors.text.tertiary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  month
                </div>
                <div className="month-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.sm }}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mon, idx) => (
                    <button
                      key={mon}
                      className="month-button"
                      onClick={() => {
                        setDisplayDate(new Date(currentYear, idx, 1))
                      }}
                      style={{
                        background: idx === currentMonth ? colors.primary : colors.subsurface,
                        color: idx === currentMonth ? colors.text.inverted : colors.text.primary,
                        border: idx === currentMonth ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 8px',
                        fontSize: '12px',
                        fontWeight: idx === currentMonth ? '700' : '500',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {mon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Years Row */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: colors.text.tertiary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  year
                </div>
                <div className="month-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      className="year-button"
                      onClick={() => {
                        handleYearChange(year)
                        setShowYearPicker(false)
                      }}
                      style={{
                        background: year === currentYear ? colors.primary : colors.subsurface,
                        color: year === currentYear ? colors.text.inverted : colors.text.primary,
                        border: year === currentYear ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 8px',
                        fontSize: '12px',
                        fontWeight: year === currentYear ? '700' : '500',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="calendar-nav-button life-os-btn-primary"
          style={{
            background: colors.primary,
            border: 'none',
            borderRadius: '10px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: colors.text.inverted,
            fontFamily: "'Noto Sans JP', sans-serif",
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-container" style={{ marginBottom: '12px' }}>
        {/* Day headers */}
        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="calendar-day-header"
              style={{
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '10px',
                color: colors.primary,
                padding: '8px 4px',
                borderBottom: `2px solid ${colors.primary}`,
                opacity: 1,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {days.map((day, idx) => {
            const dateStr = formatLocalDate(day)
            const isCurrentMonth = day.getMonth() === currentMonth
            const isToday = dateStr === today
            const dayTasks = tasksByDate[dateStr] || []
            const completedTasks = dayTasks.filter((t) => t.completed).length
            const isSelected = selectedDate === dateStr

            return (
              <button
                key={idx}
                className="calendar-day-button"
                onClick={() => {
                  setSelectedDate(isSelected ? null : dateStr)
                }}
                style={{
                  aspectRatio: '1',
                  padding: '6px 4px',
                  border: isToday ? `2px solid ${colors.primary}` : isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
                  borderRadius: '10px',
                  background: isToday ? colors.info : isSelected ? colors.subsurface : isCurrentMonth ? colors.surface : colors.subsurface,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  fontSize: '10px',
                  color: isCurrentMonth ? colors.text.primary : colors.text.tertiary,
                  fontWeight: isToday ? '600' : '400',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isToday || isSelected ? colors.shadow.sm : colors.shadow.xs,
                }}
              >
                {/* Date number */}
                <span style={{ fontWeight: isToday ? 'bold' : 'normal', marginBottom: '2px' }}>
                  {day.getDate()}
                </span>

                {/* Task indicator dots */}
                {dayTasks.length > 0 && (
                  <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', fontSize: '6px' }}>
                    {dayTasks.map((task, i) => (
                      <span
                        key={i}
                        style={{
                          width: '3px',
                          height: '3px',
                          borderRadius: '50%',
                          background: LABEL_COLORS[task.label] || '#999',
                          opacity: task.completed ? 0.4 : 1,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Task count */}
                {dayTasks.length > 0 && (
                  <span
                    style={{
                      fontSize: '8px',
                      color: colors.text.tertiary,
                      marginTop: '1px',
                    }}
                  >
                    {completedTasks}/{dayTasks.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Tasks Detail */}
      {selectedDate && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }}>
          <div style={{ ...typography.secondary, color: colors.primary, marginBottom: spacing.sm, fontWeight: '700', fontSize: '13px' }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>

          {(tasksByDate[selectedDate] || []).length === 0 ? (
            <div style={{ fontSize: '11px', color: colors.text.tertiary, marginBottom: spacing.sm }}>No tasks</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {(tasksByDate[selectedDate] || []).map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: spacing.sm,
                    background: task.completed ? colors.subsurface : colors.surface,
                    borderLeft: `3px solid ${LABEL_COLORS[task.label] || colors.border}`,
                    borderRadius: '8px',
                    opacity: task.completed ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    {(() => {
                      // For recurring instances, check completion in recurringTaskCompletions
                      const isRecurringInstance = task.isRecurringInstance
                      const instanceKey = isRecurringInstance ? `${task._originalId}-${task._instanceDate}` : null
                      const isCompleted = isRecurringInstance 
                        ? recurringTaskCompletions[instanceKey] 
                        : task.completed
                      
                      return (
                        <input
                          type="checkbox"
                          checked={isCompleted || false}
                          onChange={() => {
                            if (isRecurringInstance) {
                              useLifeOS.getState().toggleTask(task._originalId, task._instanceDate)
                            } else {
                              useLifeOS.getState().toggleTask(task.id)
                            }
                          }}
                          style={{ marginTop: '3px', cursor: 'pointer' }}
                        />
                      )
                    })()}
                    <div style={{ flex: 1 }}>
                      {(() => {
                        const isRecurringInstance = task.isRecurringInstance
                        const instanceKey = isRecurringInstance ? `${task._originalId}-${task._instanceDate}` : null
                        const isCompleted = isRecurringInstance 
                          ? recurringTaskCompletions[instanceKey]
                          : task.completed
                        
                        return (
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: '500',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              color: isCompleted ? '#999' : '#333',
                            }}
                          >
                            {task.title}
                          </div>
                        )
                      })()}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px', fontSize: '9px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: LABEL_COLORS[task.label] || '#ccc',
                            color: '#fff',
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}
                        >
                          {task.label}
                        </span>
                        {task.recurring && (
                          <span
                            style={{
                              background: RECURRING_COLORS[task.recurring] || '#999',
                              color: '#fff',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              fontWeight: 'bold',
                            }}
                          >
                            {task.recurring}
                          </span>
                        )}
                        <span style={{ color: '#999' }}>+{task.points}pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Task Button for Selected Date */}
          {onDateSelect && (
            <button
              onClick={() => onDateSelect(selectedDate)}
              className="life-os-btn-primary"
              style={{
                width: '100%',
                padding: '8px',
                background: colors.primary,
                color: colors.text.inverted,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: "'Noto Sans JP', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              + Add Task
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', fontSize: '9px', color: '#999' }}>
        📊 {Object.keys(tasksByDate).length} dates with tasks • {tasks.length} total
      </div>
    </div>
  )
}
