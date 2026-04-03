import { create } from 'zustand'

/**
 * Undo/Redo Store — Action history management
 * Maintains undo/redo stacks for task operations (add, edit, delete, toggle)
 * 
 * @typedef {Object} Action
 * @property {string} type - Action type: 'ADD_TASK' | 'EDIT_TASK' | 'DELETE_TASK' | 'TOGGLE_TASK' | 'RECURRING_TOGGLE'
 * @property {Object} payload - Action-specific data (varies by type)
 * @property {number} timestamp - When the action occurred
 * 
 * @hook
 * @returns {Object} Store with undo/redo state and actions
 */
export const useUndoRedo = create((set, get) => ({
  history: [],           // Stack of actions (for undo)
  future: [],            // Stack of actions (for redo)
  maxHistory: 50,        // Maximum actions to keep in history

  /**
   * Record an action for undo
   * @param {Action} action - Action object with type, payload, timestamp
   */
  record: (action) => {
    set((state) => {
      const newHistory = [...state.history, action].slice(-state.maxHistory)
      return {
        history: newHistory,
        future: [], // Clear redo stack when new action is recorded
      }
    })
  },

  /**
   * Undo the last action
   * @returns {Action|null} The action that was undone, or null if nothing to undo
   */
  undo: () => {
    const state = get()
    if (state.history.length === 0) return null

    const lastAction = state.history[state.history.length - 1]
    const newHistory = state.history.slice(0, -1)
    const newFuture = [...state.future, lastAction]

    set({
      history: newHistory,
      future: newFuture,
    })

    return lastAction
  },

  /**
   * Redo the last undone action
   * @returns {Action|null} The action that was redone, or null if nothing to redo
   */
  redo: () => {
    const state = get()
    if (state.future.length === 0) return null

    const nextAction = state.future[state.future.length - 1]
    const newFuture = state.future.slice(0, -1)
    const newHistory = [...state.history, nextAction]

    set({
      history: newHistory,
      future: newFuture,
    })

    return nextAction
  },

  /**
   * Clear entire history and future
   */
  clear: () => {
    set({
      history: [],
      future: [],
    })
  },

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo: () => get().history.length > 0,

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo: () => get().future.length > 0,

  /**
   * Get count of actions in history
   * @returns {number}
   */
  getHistorySize: () => get().history.length,

  /**
   * Get count of actions in future (redo stack)
   * @returns {number}
   */
  getFutureSize: () => get().future.length,
}))
