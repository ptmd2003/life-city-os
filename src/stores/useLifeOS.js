import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUndoRedo } from './useUndoRedo'

/**
 * Life OS Store — Personal task, mood, sleep, and habit tracking
 * Manages all aspects of the LifeOS dashboard and personal productivity system.
 * 
 * State Shape:
 * @typedef {Object} LifeOSState
 * @property {Array<Object>} tasks - Array of task objects
 * @property {string} tasks[].id - Unique task ID (format: 'task-N')
 * @property {string} tasks[].title - Task title/name
 * @property {string} tasks[].label - Category label ('Work'|'Health'|'Finance'|'Learning'|'Mind')
 * @property {number} tasks[].points - Points awarded for completion
 * @property {string} tasks[].category - Task type ('task'|'habit'|'event')
 * @property {boolean} tasks[].completed - Is the task completed?
 * @property {string} tasks[].dueDate - Due date (YYYY-MM-DD format)
 * @property {string|null} tasks[].recurring - Recurrence pattern or null
 * @property {string|null} tasks[].endDate - End date for recurring tasks or null
 * @property {number|null} tasks[].timer - Timer duration in minutes or null
 * @property {string} tasks[].createdAt - ISO timestamp of creation
 * @property {number} nextTaskId - Counter for generating new task IDs
 * @property {Object} todayMood - Today's mood entry {date, energy (1-5), mood (1-5), note}
 * @property {Object} sleep - Sleep tracking {yesterdaySleepTime, todayWakeTime}
 * @property {Object<string, Object<string, boolean>>} habitCompletionHistory - {habitTitle: {YYYY-MM-DD: true/false}}
 * @property {Object<string, boolean>} recurringTaskCompletions - {taskId-YYYY-MM-DD: true/false}
 * @property {Object} dailyScore - {date, earned (points), total (points)}
 * @property {Object} dailySubmission - {date, submitted (bool), submittedAt (ISO timestamp)}
 * @property {number} testDateOffset - Days offset from today for testing (0 = today)
 * 
 * @hook
 * @returns {LifeOSState & Object<string, Function>} Store state + actions
 */
export const useLifeOS = create(
  persist(
    (set, get) => ({
      // 📋 TASKS
      tasks: [],
      nextTaskId: 1,

      // 😊 MOOD & ENERGY
      todayMood: {
        date: new Date().toISOString().split('T')[0],
        energy: 3,        // 1-5 scale
        mood: 3,          // 1-5 scale
        note: '',         // Extra info
      },

      // 😴 SLEEP
      sleep: {
        yesterdaySleepTime: null, // ISO timestamp or null
        todayWakeTime: null,       // ISO timestamp or null
      },

      // 📊 HEATMAP (21-day habit tracking)
      habitCompletionHistory: {}, // { 'habitTitle': { '2026-03-22': true, '2026-03-21': false, ... } }

      // 🔄 RECURRING TASK COMPLETIONS (per instance date, not template)
      recurringTaskCompletions: {}, // { 'taskId-2026-03-22': true, ... }

      // ✅ TODAY'S SCORE
      dailyScore: {
        date: new Date().toISOString().split('T')[0],
        earned: 0,   // Points earned from completed tasks
        total: 0,    // Total points assigned for the day
      },

      // 📝 DAILY SUBMISSION
      dailySubmission: {
        date: new Date().toISOString().split('T')[0],
        submitted: false,
        submittedAt: null, // ISO timestamp of submission
      },

      // 🧪 TEST DATE OFFSET (for heatmap testing — advance dates manually)
      testDateOffset: 0, // Days ahead for testing (0 = today, 1 = tomorrow, etc)

      // ────────────────────────────────────────────────
      // UTILITY METHODS
      // ────────────────────────────────────────────────

      /**
       * Get today's date accounting for test offset
       * @returns {string} ISO date string (YYYY-MM-DD)
       */
      getToday: () => {
        const state = get()
        const today = new Date()
        today.setDate(today.getDate() + state.testDateOffset)
        return today.toISOString().split('T')[0]
      },

      /**
       * Check if a recurring task should appear on a given date
       * @param {Object} task - The task object to check
       * @param {string} dateStr - Date to check (YYYY-MM-DD format)
       * @returns {boolean} True if the task should recur on this date
       */
      shouldRecurOnDate: (task, dateStr) => {
        if (!task.recurring) return false

        const taskDate = new Date(task.dueDate)
        const checkDate = new Date(dateStr)

        // Check if date is within the recurrence range
        if (checkDate < taskDate) return false
        if (task.endDate && checkDate > new Date(task.endDate)) return false

        if (task.recurring === 'daily') {
          return true
        } else if (task.recurring === 'weekly') {
          return taskDate.getDay() === checkDate.getDay()
        } else if (task.recurring === 'bi-weekly') {
          const daysDiff = Math.floor((checkDate - taskDate) / (1000 * 60 * 60 * 24))
          return daysDiff % 14 === 0 && daysDiff >= 0
        } else if (task.recurring === 'monthly') {
          return taskDate.getDate() === checkDate.getDate()
        } else if (task.recurring === 'quarterly') {
          const monthsDiff = (checkDate.getFullYear() - taskDate.getFullYear()) * 12 + (checkDate.getMonth() - taskDate.getMonth())
          return monthsDiff % 3 === 0 && monthsDiff >= 0 && taskDate.getDate() === checkDate.getDate()
        }
        return false
      },

      /**
       * Spawn recurring task instances for today (auto-create from templates)
       * Only creates new instances for recurring tasks that are scheduled for today
       */
      spawnRecurringTasksForToday: () => {
        set((state) => {
          const today = state.getToday()

          // Find all ORIGINAL recurring tasks (only those with dueDate before today)
          const recurringTasks = state.tasks.filter(
            (t) => t.recurring && state.shouldRecurOnDate(t, today) && t.dueDate !== today
          )

          if (recurringTasks.length === 0) return state

          // Create new instances with unique IDs (NOT recurring - only templates recur)
          let nextId = state.nextTaskId
          const newTasks = recurringTasks.map((task) => {
            const taskId = `task-${nextId}`
            nextId++
            return {
              id: taskId,
              ...task,
              dueDate: today,
              completed: false,
              recurring: null, // Spawned instances are NOT recurring templates
              createdAt: new Date().toISOString(),
            }
          })

          return {
            tasks: [...state.tasks, ...newTasks],
            nextTaskId: nextId,
          }
        })
      },

      // ────────────────────────────────────────────────
      // TASK ACTIONS
      // ────────────────────────────────────────────────

      /**
       * Add a new task
       * @param {Object} task - Task configuration
       * @param {string} task.title - Task title
       * @param {string} task.label - Category label
       * @param {number} [task.points=0] - Points for completion
       * @param {string} task.category - 'task' | 'habit' | 'event'
       * @param {string} [task.dueDate] - Due date (YYYY-MM-DD) or defaults to today
       * @param {string|null} [task.recurring=null] - Recurrence pattern
       * @param {string|null} [task.endDate=null] - End date for recurring tasks
       * @param {number|null} [task.timer=null] - Timer in minutes
       */
      addTask: (task) => {
        const state = get()
        const newTask = {
          id: `task-${state.nextTaskId}`,
          title: task.title,
          label: task.label, // 'Work' | 'Health' | 'Finance' | 'Learning' | 'Mind'
          points: task.points || 0,
          category: task.category, // 'task' | 'habit' | 'event'
          completed: false,
          dueDate: task.dueDate || state.getToday(),
          recurring: task.recurring || null, // 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | null
          endDate: task.endDate || null, // End date for recurring tasks (YYYY-MM-DD format)
          timer: task.timer || null, // minutes, or null
          createdAt: new Date().toISOString(),
        }

        set({
          tasks: [...state.tasks, newTask],
          nextTaskId: state.nextTaskId + 1,
        })

        // Record action for undo/redo
        useUndoRedo.getState().record({
          type: 'ADD_TASK',
          payload: newTask,
          timestamp: Date.now(),
        })
      },

      /**
       * Edit an existing task
       * @param {string} taskId - Task ID to edit
       * @param {Object} updates - Partial task updates
       */
      editTask: (taskId, updates) => {
        const state = get()
        const oldTask = state.tasks.find((t) => t.id === taskId)
        
        set({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        })

        // Record action for undo/redo
        useUndoRedo.getState().record({
          type: 'EDIT_TASK',
          payload: { taskId, oldValues: oldTask, newValues: updates },
          timestamp: Date.now(),
        })
      },

      /**
       * Toggle task completion + record habit history
       * @param taskId - The task ID to toggle
       * @param dateStr - Optional: For recurring instances, the specific date (YYYY-MM-DD)
       */
      toggleTask: (taskId, dateStr = null) => {
        const state = get()
        let updatedCompletions = { ...state.recurringTaskCompletions }
        const oldCompletions = { ...state.recurringTaskCompletions }
        
        // If dateStr provided, this is a recurring instance — toggle in instance completions
        if (dateStr) {
          const instanceKey = `${taskId}-${dateStr}`
          const wasCompleted = updatedCompletions[instanceKey]
          updatedCompletions[instanceKey] = !updatedCompletions[instanceKey]
          
          // Still update habit history if it's a habit
          const task = state.tasks.find((t) => t.id === taskId)
          if (task && task.category === 'habit') {
            const habitHistory = { ...state.habitCompletionHistory }
            const habitKey = task.title
            if (!habitHistory[habitKey]) {
              habitHistory[habitKey] = {}
            }
            habitHistory[habitKey][dateStr] = updatedCompletions[instanceKey]
            console.log('✅ [HABIT TOGGLE] Recurring instance:', { taskId, dateStr, completed: updatedCompletions[instanceKey], habitKey, history: habitHistory[habitKey] })
            
            set({
              recurringTaskCompletions: updatedCompletions,
              habitCompletionHistory: habitHistory,
            })

            // Record action for undo/redo
            useUndoRedo.getState().record({
              type: 'RECURRING_TOGGLE',
              payload: { taskId, dateStr, wasCompleted: wasCompleted },
              timestamp: Date.now(),
            })
            return
          }

          set({ recurringTaskCompletions: updatedCompletions })

          // Record action for undo/redo
          useUndoRedo.getState().record({
            type: 'RECURRING_TOGGLE',
            payload: { taskId, dateStr, wasCompleted: wasCompleted },
            timestamp: Date.now(),
          })
          return
        }

        // Regular task toggle (non-recurring instance)
        const updated = state.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed }
          }
          return t
        })

        // If toggled task is a habit, record in history using task's dueDate
        const toggledTask = updated.find((t) => t.id === taskId)
        const habitHistory = { ...state.habitCompletionHistory }

        if (toggledTask && toggledTask.category === 'habit') {
          const habitKey = toggledTask.title
          if (!habitHistory[habitKey]) {
            habitHistory[habitKey] = {}
          }
          habitHistory[habitKey][toggledTask.dueDate] = toggledTask.completed
          console.log('✅ [HABIT TOGGLE] Non-recurring:', { taskId, title: habitKey, dueDate: toggledTask.dueDate, completed: toggledTask.completed, allHistory: habitHistory })
        }

        // Recalculate daily score
        const earned = updated
          .filter((t) => t.dueDate === state.dailyScore.date && t.completed)
          .reduce((sum, t) => sum + t.points, 0)

        const total = updated
          .filter((t) => t.dueDate === state.dailyScore.date)
          .reduce((sum, t) => sum + t.points, 0)

        const oldTask = state.tasks.find((t) => t.id === taskId)
        set({
          tasks: updated,
          habitCompletionHistory: habitHistory,
          dailyScore: { ...state.dailyScore, earned, total },
        })

        // Record action for undo/redo
        useUndoRedo.getState().record({
          type: 'TOGGLE_TASK',
          payload: { taskId, wasCompleted: oldTask?.completed || false },
          timestamp: Date.now(),
        })
      },

      /**
       * Delete a task
       * @param {string} taskId - Task ID to delete
       */
      deleteTask: (taskId) => {
        const state = get()
        const deletedTask = state.tasks.find((t) => t.id === taskId)
        
        set({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        })

        // Record action for undo/redo
        useUndoRedo.getState().record({
          type: 'DELETE_TASK',
          payload: deletedTask,
          timestamp: Date.now(),
        })
      },

      /**
       * Get all tasks due today
       * @returns {Array<Object>} Array of today's tasks
       */
      getTodaysTasks: () => {
        const state = get()
        const today = state.getToday()
        return state.tasks.filter((t) => t.dueDate === today)
      },

      /**
       * Get incomplete tasks from past dates (overdue)
       * @returns {Array<Object>} Array of skipped/overdue tasks
       */
      getSkippedTasks: () => {
        const state = get()
        const today = state.getToday()
        return state.tasks.filter((t) => t.dueDate < today && !t.completed)
      },

      /**
       * Get upcoming tasks for the next 7 days (excluding today)
       * @returns {Array<Object>} Array of upcoming tasks
       */
      getUpcomingTasks: () => {
        const state = get()
        const today = new Date()
        today.setDate(today.getDate() + state.testDateOffset)
        const upcomingStart = new Date(today)
        upcomingStart.setDate(upcomingStart.getDate() + 1)
        upcomingStart.setHours(0, 0, 0, 0)

        const upcomingEnd = new Date(today)
        upcomingEnd.setDate(upcomingEnd.getDate() + 7)
        upcomingEnd.setHours(23, 59, 59, 999)

        return state.tasks.filter((t) => {
          const taskDate = new Date(t.dueDate)
          return taskDate >= upcomingStart && taskDate <= upcomingEnd
        })
      },

      // ────────────────────────────────────────────────
      // MOOD & ENERGY ACTIONS
      // ────────────────────────────────────────────────

      /**
       * Update daily mood and energy scores
       * @param {number} energy - Energy level (1-5)
       * @param {number} mood - Mood score (1-5)
       * @param {string} [note=''] - Optional mood note
       */
      setMood: (energy, mood, note = '') => {
        set((state) => ({
          todayMood: {
            date: state.getToday(),
            energy: Math.max(1, Math.min(5, energy)),
            mood: Math.max(1, Math.min(5, mood)),
            note,
          },
        }))
      },

      /**
       * Update just the mood note
       * @param {string} note - Mood note text
       */
      setMoodNote: (note) => {
        set((state) => ({
          todayMood: { ...state.todayMood, note },
        }))
      },

      // ────────────────────────────────────────────────
      // SLEEP ACTIONS
      // ────────────────────────────────────────────────

      /**
       * Set yesterday's sleep time
       * @param {string} timeString - Time in 'HH:MM' format (e.g. '23:30')
       */
      setYesterdaySleepTime: (timeString) => {
        // timeString format: "23:30"
        set((state) => {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() + state.testDateOffset - 1)
          const [hours, minutes] = timeString.split(':').map(Number)
          yesterday.setHours(hours, minutes, 0, 0)

          return {
            sleep: { ...state.sleep, yesterdaySleepTime: yesterday.toISOString() },
          }
        })
      },

      /**
       * Set today's wake time
       * @param {string} timeString - Time in 'HH:MM' format (e.g. '07:00')
       */
      setTodayWakeTime: (timeString) => {
        // timeString format: "07:00"
        set((state) => {
          const today = new Date()
          today.setDate(today.getDate() + state.testDateOffset)
          const [hours, minutes] = timeString.split(':').map(Number)
          today.setHours(hours, minutes, 0, 0)

          return {
            sleep: { ...state.sleep, todayWakeTime: today.toISOString() },
          }
        })
      },

      // ────────────────────────────────────────────────
      // DAILY SCORE ACTIONS
      // ────────────────────────────────────────────────

      /**
       * Recalculate daily score based on today's completed tasks
       * Called automatically when tasks are toggled
       */
      recalculateDailyScore: () => {
        set((state) => {
          const today = state.getToday()
          const todaysTasks = state.tasks.filter((t) => t.dueDate === today)

          const earned = todaysTasks
            .filter((t) => t.completed)
            .reduce((sum, t) => sum + t.points, 0)

          const total = todaysTasks.reduce((sum, t) => sum + t.points, 0)

          return {
            dailyScore: {
              date: today,
              earned,
              total,
            },
          }
        })
      },

      /**
       * Get daily score as a percentage (0-100)
       * @returns {number} Percentage of daily goals completed
       */
      getDailyScorePercentage: () => {
        const state = get()
        if (state.dailyScore.total === 0) return 0
        return Math.round((state.dailyScore.earned / state.dailyScore.total) * 100)
      },

      // ────────────────────────────────────────────────
      // HEATMAP ACTIONS (Habit Tracking)
      // ────────────────────────────────────────────────

      /**
       * Get heatmap data for all habits (full date range)
       * Returns an array of rows, each with dates and completion status
       * @returns {Array<Object>} Array of habit heatmap rows
       */
      getHabitHeatmapRows: () => {
        const state = get()
        const habits = state.tasks.filter((t) => t.category === 'habit')
        
        console.log('[STORE] getHabitHeatmapRows called:', {
          totalTasks: state.tasks.length,
          habitTasks: habits.length,
          habitCompletionHistoryKeys: Object.keys(state.habitCompletionHistory),
          habitCompletionHistory: state.habitCompletionHistory,
        })
        
        if (habits.length === 0) {
          console.log('⚠️ [STORE] No habits found in tasks!')
          return []
        }

        // Find earliest date in history across all habits
        let earliestDate = new Date()
        earliestDate.setDate(earliestDate.getDate() + state.testDateOffset)
        
        Object.keys(state.habitCompletionHistory).forEach((habitTitle) => {
          const history = state.habitCompletionHistory[habitTitle] || {}
          Object.keys(history).forEach((dateStr) => {
            const d = new Date(dateStr + 'T00:00:00')
            if (d < earliestDate) {
              earliestDate = d
            }
          })
        })

        // If no history, use today - 21 days as default
        const today = new Date()
        today.setDate(today.getDate() + state.testDateOffset)
        if (earliestDate >= today) {
          earliestDate.setDate(today.getDate() - 20)
        }

        // Generate date range from earliest to today (INCLUSIVE of today)
        const dates = []
        const current = new Date(earliestDate)
        while (current.toISOString().split('T')[0] <= today.toISOString().split('T')[0]) {
          dates.push(current.toISOString().split('T')[0])
          current.setDate(current.getDate() + 1)
        }

        console.log('[STORE] Date range for heatmap:', {
          testDateOffset: state.testDateOffset,
          today: today.toISOString().split('T')[0],
          earliestDate: earliestDate.toISOString().split('T')[0],
          dateRangeLength: dates.length,
          dates: dates,
        })

        // Get unique habits (deduplicate by title, prefer recurring templates over spawned instances)
        const uniqueHabits = [...new Map(
          [...habits].sort((a) => (a.recurring ? 1 : -1)).map((h) => [h.title, h])
        ).values()]

        return uniqueHabits.map((habit) => {
          const completion = dates.map((dateStr) => {
            // For recurring habits: check recurringTaskCompletions per date
            if (habit.recurring) {
              const instanceKey = `${habit.id}-${dateStr}`
              // Check if this date should have this habit
              if (!state.shouldRecurOnDate(habit, dateStr)) {
                return -1 // Not applicable for this date
              }
              // Return completion status from recurringTaskCompletions or habitCompletionHistory
              return state.recurringTaskCompletions[instanceKey] !== undefined
                ? (state.recurringTaskCompletions[instanceKey] ? 1 : 0)
                : (state.habitCompletionHistory[habit.title]?.[dateStr] ? 1 : 0)
            }
            
            // For non-recurring: check habitCompletionHistory
            const history = state.habitCompletionHistory[habit.title] || {}
            return history[dateStr] ? 1 : 0
          })

          return {
            title: habit.title,
            label: habit.label,
            dates,
            completion,
            habitId: habit.id,
            isRecurring: habit.recurring,
          }
        })
      },

      /**
       * Submit today's focus (lock tasks, store confirmation)
       */
      submitTodaysFocus: () => {
        set((state) => {
          const today = state.getToday()
          return {
            dailySubmission: {
              date: today,
              submitted: true,
              submittedAt: new Date().toISOString(),
            },
          }
        })
      },

      /**
       * Check if today's focus has been submitted
       */
      isTodaySubmitted: () => {
        const state = get()
        const today = state.getToday()
        return state.dailySubmission.date === today && state.dailySubmission.submitted
      },

      /**
       * Advance test date by 1 day and reset daily state
       */
      advanceTestDate: () => {
        set((state) => {
          const newOffset = state.testDateOffset + 1
          const newToday = new Date()
          newToday.setDate(newToday.getDate() + newOffset)
          const newTodayStr = newToday.toISOString().split('T')[0]

          // Find all recurring tasks that should appear on the new day
          const recurringTasks = state.tasks.filter(
            (t) => t.recurring && state.shouldRecurOnDate(t, newTodayStr) && t.dueDate !== newTodayStr
          )

          // Create new instances with unique IDs (NOT recurring - only templates recur)
          let nextId = state.nextTaskId
          const newTasks = recurringTasks.map((task) => {
            const taskId = `task-${nextId}`
            nextId++
            return {
              id: taskId,
              ...task,
              dueDate: newTodayStr,
              completed: false,
              recurring: null, // Spawned instances are NOT recurring templates
              createdAt: new Date().toISOString(),
            }
          })
          
          return {
            testDateOffset: newOffset,
            tasks: [...state.tasks, ...newTasks],
            nextTaskId: nextId,
            // Reset daily state for new day
            dailySubmission: {
              date: newTodayStr,
              submitted: false,
              submittedAt: null,
            },
            dailyScore: {
              date: newTodayStr,
              earned: 0,
              total: 0,
            },
            todayMood: {
              date: newTodayStr,
              energy: 3,
              mood: 3,
              note: '',
            },
            // ✅ Reset sleep times for new day
            sleep: {
              yesterdaySleepTime: null,
              todayWakeTime: null,
            },
          }
        })
      },

      /**
       * Set test date to arbitrary date string (YYYY-MM-DD)
       */
      setTestDate: (dateStr) => {
        set((state) => {
          // Calculate offset from today to the given date
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const targetDate = new Date(dateStr + 'T00:00:00')
          const offset = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24))

          console.log(`🧪 [TEST MODE] Date changed to: ${dateStr} (offset: ${offset} days)`, {
            todayString: today.toISOString().split('T')[0],
            targetDate: dateStr,
            calculatedOffset: offset,
          })

          return {
            testDateOffset: offset,
          }
        })
      },

      /**
       * Reset test date to today (offset = 0)
       */
      resetTestDate: () => {
        set((state) => {
          console.log('🧪 [TEST MODE] Reset to today')
          return { testDateOffset: 0 }
        })
      },

      // ────────────────────────────────────────────────
      // UNDO/REDO HANDLERS
      // ────────────────────────────────────────────────

      /**
       * Apply an undo or redo action
       * @param {Object} action - The action to apply {type, payload, timestamp}
       * @param {boolean} isRedo - If true, apply as redo (forward); if false, apply as undo (backward)
       */
      applyAction: (action, isRedo = false) => {
        if (!action) return

        const state = get()

        switch (action.type) {
          case 'ADD_TASK': {
            if (isRedo) {
              // Redo: Add the task back
              set({
                tasks: [...state.tasks, action.payload],
                nextTaskId: Math.max(state.nextTaskId, parseInt(action.payload.id.split('-')[1]) + 1),
              })
            } else {
              // Undo: Remove the task
              set({
                tasks: state.tasks.filter((t) => t.id !== action.payload.id),
              })
            }
            console.log('↩️ [UNDO/REDO] ADD_TASK:', { taskId: action.payload.id, isRedo })
            break
          }

          case 'EDIT_TASK': {
            if (isRedo) {
              // Redo: Apply new values
              set({
                tasks: state.tasks.map((t) =>
                  t.id === action.payload.taskId ? { ...t, ...action.payload.newValues } : t
                ),
              })
            } else {
              // Undo: Restore old values
              const oldFields = Object.keys(action.payload.oldValues).reduce((acc, key) => {
                acc[key] = action.payload.oldValues[key]
                return acc
              }, {})
              set({
                tasks: state.tasks.map((t) => (t.id === action.payload.taskId ? { ...t, ...oldFields } : t)),
              })
            }
            console.log('↩️ [UNDO/REDO] EDIT_TASK:', { taskId: action.payload.taskId, isRedo })
            break
          }

          case 'DELETE_TASK': {
            if (isRedo) {
              // Redo: Delete the task again
              set({
                tasks: state.tasks.filter((t) => t.id !== action.payload.id),
              })
            } else {
              // Undo: Restore the task
              set({
                tasks: [...state.tasks, action.payload],
                nextTaskId: Math.max(state.nextTaskId, parseInt(action.payload.id.split('-')[1]) + 1),
              })
            }
            console.log('↩️ [UNDO/REDO] DELETE_TASK:', { taskId: action.payload.id, isRedo })
            break
          }

          case 'TOGGLE_TASK': {
            if (isRedo) {
              // Redo: Re-toggle the task
              set({
                tasks: state.tasks.map((t) =>
                  t.id === action.payload.taskId ? { ...t, completed: !t.completed } : t
                ),
              })
            } else {
              // Undo: Restore previous completion state
              set({
                tasks: state.tasks.map((t) =>
                  t.id === action.payload.taskId ? { ...t, completed: action.payload.wasCompleted } : t
                ),
              })
            }
            console.log('↩️ [UNDO/REDO] TOGGLE_TASK:', { taskId: action.payload.taskId, isRedo })
            break
          }

          case 'RECURRING_TOGGLE': {
            const instanceKey = `${action.payload.taskId}-${action.payload.dateStr}`
            if (isRedo) {
              // Redo: Re-toggle the recurring instance
              set({
                recurringTaskCompletions: {
                  ...state.recurringTaskCompletions,
                  [instanceKey]: !state.recurringTaskCompletions[instanceKey],
                },
              })
            } else {
              // Undo: Restore previous completion state
              set({
                recurringTaskCompletions: {
                  ...state.recurringTaskCompletions,
                  [instanceKey]: action.payload.wasCompleted,
                },
              })
            }
            console.log('↩️ [UNDO/REDO] RECURRING_TOGGLE:', { ...action.payload, isRedo })
            break
          }

          default:
            console.warn('⚠️ Unknown action type for undo/redo:', action.type)
        }
      },

      /**
       * Undo the last action
       */
      undo: () => {
        const action = useUndoRedo.getState().undo()
        if (action) {
          get().applyAction(action, false)
        }
      },

      /**
       * Redo the last undone action
       */
      redo: () => {
        const action = useUndoRedo.getState().redo()
        if (action) {
          get().applyAction(action, true)
        }
      },
    }),
    {
      name: 'life-os-storage', // localStorage key
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.log('🔄 [HYDRATION ERROR]', error)
        } else {
          console.log('🔄 [STORE HYDRATED] Tasks loaded:', state?.tasks?.length || 0)
        }
      },
    }
  )
)
