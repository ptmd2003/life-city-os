import React, { useEffect } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { useUndoRedo } from '../stores/useUndoRedo'
import { useCityStore } from '../stores/useCityStore'
import { useEditorStore } from '../stores/useEditorStore'

/**
 * UndoRedoController — Keyboard shortcut handler for undo/redo
 * Listens for Ctrl+Z (undo) and Ctrl+Shift+Z (redo)
 *
 * Priority:
 *  1. If ground paint mode is active → undo/redo world tile commands
 *  2. Otherwise → undo/redo habit/task actions
 *
 * No UI — purely functional component
 */
export default function UndoRedoController() {
  const { undo, redo } = useLifeOS()
  const { canUndo, canRedo } = useUndoRedo()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y'))) return

      const { groundPaintMode, undoLastCommand, redoNextCommand } = useCityStore.getState()
      const editorStore = useEditorStore.getState()
      const inPaintMode = groundPaintMode

      // Ctrl+Z (or Cmd+Z on Mac)
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (inPaintMode) {
          if (editorStore.canUndo()) {
            undoLastCommand()
          }
        } else if (canUndo()) {
          undo()
        }
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y (redo)
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        if (inPaintMode) {
          if (editorStore.canRedo()) {
            redoNextCommand()
          }
        } else if (canRedo()) {
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, undo, redo])

  return null
}
