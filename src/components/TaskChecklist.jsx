import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, buttonStyles, containers, getLabelColor, getRecurringColor, getProgressColor } from '../theme/colors.js'

const LABEL_COLORS = colors.labels

const RECURRING_COLORS = colors.recurring

const LABELS = ['Work', 'Health', 'Finance', 'Learning', 'Mind']
const CATEGORIES = ['task', 'habit', 'event']
const RECURRING_OPTIONS = ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly']

/**
 * TaskRow — Compact task item display
 */
function TaskRow({ task, editingTaskId, setEditingTaskId, submitted, toggleTask, deleteTask }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '6px 8px',
        background: task.completed ? colors.subsurface : colors.surface,
        borderLeft: `2px solid ${task.completed ? colors.border : colors.primary}`,
        borderRadius: '3px',
        transition: 'all 0.2s ease',
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => !submitted && toggleTask(task.id)}
        disabled={submitted}
        style={{
          width: '16px',
          height: '16px',
          cursor: submitted ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          marginTop: '2px',
          opacity: submitted ? 0.5 : 1,
        }}
      />

      {/* Task content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '500',
            color: task.completed ? colors.text.tertiary : colors.text.primary,
            textDecoration: task.completed ? 'line-through' : 'none',
            marginBottom: '3px',
            lineHeight: '1.3',
          }}
        >
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '9px',
              background: getLabelColor(task.label),
              color: colors.text.inverted,
              padding: '2px 5px',
              borderRadius: '2px',
              fontWeight: '500',
            }}
          >
            {task.label}
          </span>
          {task.recurring && (
            <span
              style={{
                fontSize: '8px',
                background: getRecurringColor(task.recurring),
                color: colors.text.inverted,
                padding: '2px 5px',
                borderRadius: '2px',
                fontWeight: 'bold',
              }}
            >
              {task.recurring}
            </span>
          )}
          <span style={{ fontSize: '8px', color: colors.text.tertiary }}>
            +{task.points}
          </span>
        </div>
      </div>

      {/* Button container: Edit & Delete */}
      <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginTop: '2px' }}>
        {/* Edit button */}
        {!submitted && (
          <button
            onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
            style={{
              background: 'none',
              border: 'none',
              color: editingTaskId === task.id ? colors.primary : colors.border,
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 4px',
              transition: 'color 0.2s ease',
            }}
            title="Edit task"
          >
            ✎
          </button>
        )}

        {/* Delete button */}
        {!submitted && (
          <button
            onClick={() => {
              if (window.confirm('Delete this task?')) {
                deleteTask(task.id)
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.border,
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 4px',
              transition: 'color 0.2s ease',
            }}
            title="Delete task"
            onMouseEnter={(e) => (e.target.style.color = colors.danger)}
            onMouseLeave={(e) => (e.target.style.color = colors.border)}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * EditTaskForm — full form to edit all task properties
 */
function EditTaskForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title)
  const [label, setLabel] = useState(task.label)
  const [category, setCategory] = useState(task.category || 'task')
  const [points, setPoints] = useState(task.points)
  const [recurring, setRecurring] = useState(task.recurring || '')
  const [endDate, setEndDate] = useState(task.endDate || '')
  const [hasTimer, setHasTimer] = useState(task.timer ? true : false)
  const [timerMinutes, setTimerMinutes] = useState(task.timer || 30)

  const handleSave = () => {
    if (!title.trim()) {
      alert('Task title required')
      return
    }

    if (recurring && !endDate) {
      alert('Recurring tasks require an end date')
      return
    }

    onSave({
      title: title.trim(),
      label,
      category,
      points: parseInt(points) || 0,
      recurring: recurring || null,
      endDate: recurring ? endDate : null,
      timer: hasTimer ? parseInt(timerMinutes) : null,
    })
  }

  return (
    <div style={{ ...containers.section }}>
      <h3 style={{ ...typography.sectionHeader, marginBottom: '8px' }}>edit task</h3>

      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          style={{
            width: '100%',
            padding: '8px 10px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '12px',
            boxSizing: 'border-box',
            marginBottom: '8px',
            fontFamily: "'Noto Sans JP', sans-serif",
            background: colors.surface,
            color: colors.text.primary,
            boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
          }}
        />

        {/* Label + Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
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

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
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

        {/* Points */}
        <div style={{ marginBottom: '6px' }}>
          <input
            type="number"
            min="0"
            max="100"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Points"
            style={{
              padding: '8px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              width: '100%',
              fontFamily: "'Noto Sans JP', sans-serif",
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          />
        </div>

        {/* Recurring */}
        <div style={{ marginBottom: '6px' }}>
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

        {/* End Date (conditional) */}
        {recurring && (
          <div style={{ marginBottom: '6px' }}>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '12px',
                boxSizing: 'border-box',
                background: colors.surface,
                color: colors.text.primary,
                boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
              }}
            />
            <span style={{ fontSize: '10px', color: '#999', display: 'block', marginTop: '2px' }}>
              Repeat until this date
            </span>
          </div>
        )}

        {/* Timer */}
        <div style={{ marginBottom: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', cursor: 'pointer', fontSize: '11px', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={hasTimer}
              onChange={(e) => setHasTimer(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold' }}>Add timer</span>
          </label>
          {hasTimer && (
            <input
              type="number"
              min="1"
              max="480"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '12px',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: spacing.sm }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            ...buttonStyles.primary,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = buttonStyles.primaryHover.opacity
            e.target.style.transform = buttonStyles.primaryHover.transform
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1'
            e.target.style.transform = 'scale(1)'
          }}
        >
          save
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            ...buttonStyles.secondary,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = buttonStyles.secondaryHover.opacity
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1'
          }}
        >
          cancel
        </button>
      </div>
    </div>
  )
}

export default function TaskChecklist() {
  const { getTodaysTasks, getSkippedTasks, toggleTask, deleteTask, getDailyScorePercentage, isTodaySubmitted, editTask, sleep, todayMood, tasks } = useLifeOS()
  const todaysTasks = getTodaysTasks()
  const skippedTasks = getSkippedTasks()
  const scorePercent = getDailyScorePercentage()
  const submitted = isTodaySubmitted()

  const [editingTaskId, setEditingTaskId] = useState(null)

  // Debug: Log store state on mount and updates
  React.useEffect(() => {
    console.log(`📋 [TASKLIST MOUNTED] Tasks in store: ${tasks.length}, Today's tasks: ${todaysTasks.length}`, {
      todaysTasks,
    })
  }, [tasks.length, todaysTasks.length])



  return (
    <div style={{ width: '100%' }}>
      {/* Progress Bar and Score */}
      <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.borderLight}` }}>
        <div
          style={{
            background: colors.subsurface,
            borderRadius: '4px',
            height: '6px',
            overflow: 'hidden',
            marginBottom: '4px',
          }}
        >
          <div
            style={{
              width: `${scorePercent}%`,
              background: getProgressColor(scorePercent),
              height: '100%',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '10px', color: colors.text.secondary, display: 'block' }}>
          {scorePercent}% of daily goals
        </span>
      </div>

      {todaysTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: colors.text.tertiary, fontSize: '13px' }}>
          No tasks for today. Add one to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
          {/* HABITS SECTION */}
          {todaysTasks.filter((t) => t.category === 'habit').length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.text.tertiary, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Habits
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {todaysTasks.filter((t) => t.category === 'habit').map((task) => (
                  <TaskRow key={task.id} task={task} editingTaskId={editingTaskId} setEditingTaskId={setEditingTaskId} submitted={submitted} toggleTask={toggleTask} deleteTask={deleteTask} />
                ))}
              </div>
            </div>
          )}

          {/* TASKS & EVENTS SECTION */}
          {todaysTasks.filter((t) => t.category !== 'habit').length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.text.tertiary, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tasks & Events
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {todaysTasks.filter((t) => t.category !== 'habit').map((task) => (
                  <TaskRow key={task.id} task={task} editingTaskId={editingTaskId} setEditingTaskId={setEditingTaskId} submitted={submitted} toggleTask={toggleTask} deleteTask={deleteTask} />
                ))}
              </div>
            </div>
          )}

          {/* Edit form for selected task */}
          {editingTaskId && todaysTasks.find((t) => t.id === editingTaskId) && (
            <EditTaskForm
              task={todaysTasks.find((t) => t.id === editingTaskId)}
              onSave={(updates) => {
                editTask(editingTaskId, updates)
                setEditingTaskId(null)
              }}
              onCancel={() => setEditingTaskId(null)}
            />
          )}
        </div>
      )}

      {/* 🧪 SKIPPED TASKS (Incomplete tasks from past dates) */}
      {skippedTasks.length > 0 && (
        <div style={{ marginTop: spacing.md, ...containers.subsection }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: colors.text.tertiary, marginBottom: '8px' }}>
            ⏭️ Skipped ({skippedTasks.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {skippedTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '8px',
                  background: colors.surface,
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.65,
                }}
              >
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'not-allowed',
                    opacity: 0.5,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '400',
                      color: colors.text.tertiary,
                      textDecoration: 'line-through',
                      marginBottom: '2px',
                    }}
                  >
                    {task.title}
                  </div>
                  <div style={{ fontSize: '9px', color: colors.border }}>
                    Due: {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation message */}


      {/* Submitted state message */}
      {submitted && (
        <div style={{ width: '100%', marginTop: spacing.md, padding: '8px', background: colors.info, border: `1px solid ${colors.success}`, borderRadius: '8px', fontSize: '12px', color: colors.text.primary, textAlign: 'center', fontWeight: 'bold' }}>
          ✓ Daily check-in locked for the day
        </div>
      )}
    </div>
  )
}
