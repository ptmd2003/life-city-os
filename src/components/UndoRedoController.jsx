import React, { useEffect } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { useUndoRedo } from '../stores/useUndoRedo'

/**
 * UndoRedoController — Keyboard shortcut handler for undo/redo
 * Listens for Ctrl+Z (undo) and Ctrl+Shift+Z (redo)
 * No UI — purely functional component
 */
export default function UndoRedoController() {
  const { undo, redo } = useLifeOS()
  const { canUndo, canRedo } = useUndoRedo()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) {
          console.log('↩️ UNDO triggered via Ctrl+Z')
          undo()
        }
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y (redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault()
        if (canRedo()) {
          console.log('↪️ REDO triggered via Ctrl+Shift+Z/Ctrl+Y')
          redo()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
