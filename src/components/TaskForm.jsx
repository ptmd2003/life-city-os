import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, buttonStyles, containers } from '../theme/colors.js'

const LABELS = ['Work', 'Health', 'Finance', 'Learning', 'Mind']
const CATEGORIES = ['task', 'habit', 'event']
const RECURRING_COLORS = colors.recurring

export default function TaskForm({ onClose }) {
  const { addTask } = useLifeOS()

  const [title, setTitle] = useState('')
  const [label, setLabel] = useState('Work')
  const [category, setCategory] = useState('task')
  const [points, setPoints] = useState(3)
  const [recurring, setRecurring] = useState(null)
  const [daysOut, setDaysOut] = useState(0) // 0 = today, 1 = tomorrow, etc.
  const [endDate, setEndDate] = useState(null) // End date for recurring tasks
  const [hasTimer, setHasTimer] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(30)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Task title required')
      return
    }

    if (recurring && !endDate) {
      alert('Recurring tasks require an end date')
      return
    }

    // Calculate due date
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysOut)
    const dueDateString = dueDate.toISOString().split('T')[0]

    console.log(`📝 [TASKFORM] Submitting task: "${title}" for ${dueDateString}`)
    
    addTask({
      title: title.trim(),
      label,
      category,
      points: parseInt(points) || 0,
      recurring,
      dueDate: dueDateString,
      endDate: recurring ? endDate : null,
      timer: hasTimer ? timerMinutes : null,
    })

    setTitle('')
    setLabel('Work')
    setCategory('task')
    setPoints(3)
    setRecurring(null)
    setDaysOut(0)
    setEndDate(null)
    setHasTimer(false)
    setTimerMinutes(30)

    console.log(`📝 [TASKFORM] Calling onClose()`)
    onClose?.()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: colors.surface,
        borderRadius: '12px',
        padding: spacing.containerPadding,
        boxShadow: colors.shadow.sm,
        marginBottom: spacing.sectionMargin,
        fontSize: '12px',
      }}
    >
      <h3 style={{ ...typography.sectionHeader, margin: '0 0 10px', fontSize: '13px', fontWeight: 'bold' }}>
        ➕ Add New Task
      </h3>

      {/* Title */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: colors.text.primary, fontWeight: 'bold' }}>
          Task Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Morning run, 2h deep work..."
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontFamily: 'inherit',
            fontSize: '13px',
            boxSizing: 'border-box',
            background: colors.surface,
            color: colors.text.primary,
            boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
          }}
        />
      </div>

      {/* Row 1: Label + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: colors.text.primary, fontWeight: 'bold' }}>
            Label
          </label>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'Noto Sans JP', sans-serif",
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          >
            {LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: colors.text.primary, fontWeight: 'bold' }}>
            Type
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'Noto Sans JP', sans-serif",
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Points + Days Out */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: colors.text.primary, fontWeight: 'bold' }}>
            Points
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'Noto Sans JP', sans-serif",
              boxSizing: 'border-box',
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: colors.text.primary, fontWeight: 'bold' }}>
            When
          </label>
          <select
            value={daysOut}
            onChange={(e) => setDaysOut(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'Noto Sans JP', sans-serif",
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          >
            <option value={0}>Today</option>
            <option value={1}>Tomorrow</option>
            <option value={2}>In 2 days</option>
            <option value={3}>In 3 days</option>
            <option value={7}>Next week</option>
          </select>
        </div>
      </div>

      {/* Recurring */}
      <div style={{ marginBottom: '10px' }}>
        <select
          value={recurring || ''}
          onChange={(e) => setRecurring(e.target.value || null)}
          style={{
            padding: '8px 10px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: colors.text.primary,
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
            background: colors.surface,
            boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
          }}
        >
          <option value="">📅 No repeat</option>
          <option value="daily">📅 Daily</option>
          <option value="weekly">📅 Weekly</option>
          <option value="bi-weekly">📅 Bi-weekly</option>
          <option value="monthly">📅 Monthly</option>
          <option value="quarterly">📅 Quarterly</option>
        </select>
      </div>

      {/* End Date (only for recurring tasks) */}
      {recurring && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: colors.text.primary, fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
            🏁 Recurrence End Date
          </label>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value || null)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'Noto Sans JP', sans-serif",
              boxSizing: 'border-box',
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          />
          <span style={{ fontSize: '11px', color: colors.text.tertiary, display: 'block', marginTop: '4px' }}>
            Task will repeat until this date (inclusive)
          </span>
        </div>
      )}

      {/* Timer */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.text.primary, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasTimer}
            onChange={(e) => setHasTimer(e.target.checked)}
          />
          <span style={{ fontWeight: 'bold' }}>Add timer</span>
        </label>
        {hasTimer && (
          <div style={{ marginTop: '6px' }}>
            <input
              type="number"
              min="1"
              max="480"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: "'Noto Sans JP', sans-serif",
                boxSizing: 'border-box',
                background: colors.surface,
                color: colors.text.primary,
                boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
              }}
            />
            <span style={{ fontSize: '11px', color: colors.text.tertiary }}>{timerMinutes} minutes</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: spacing.sm }}>  
        <button
          type="submit"
          style={{
            flex: 1,
            ...buttonStyles.primary,
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          ✓ Add Task
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            ...buttonStyles.secondary,
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
