import React from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { useUndoRedo } from '../stores/useUndoRedo'
import { useCityStore } from '../stores/useCityStore'
import { useEditorStore } from '../stores/useEditorStore'
import { colors } from '../theme/colors'

/**
 * UndoRedoButtons — UI buttons for undo/redo actions
 *
 * When ground paint mode is active, shows world tile undo/redo counts.
 * Otherwise shows habit/task undo/redo counts.
 */
export default function UndoRedoButtons() {
  const { undo, redo } = useLifeOS()
  const { canUndo: canHabitUndo, canRedo: canHabitRedo, getHistorySize, getFutureSize } = useUndoRedo()
  const groundPaintMode = useCityStore(s => s.groundPaintMode)
  const { undoLastCommand, redoNextCommand } = useCityStore.getState()
  const worldHistory = useEditorStore(s => s.history)
  const worldFuture  = useEditorStore(s => s.future)

  const inPaintMode = groundPaintMode

  const canUndo    = inPaintMode ? worldHistory.length > 0 : canHabitUndo()
  const canRedo    = inPaintMode ? worldFuture.length > 0  : canHabitRedo()
  const historySize = inPaintMode ? worldHistory.length    : getHistorySize()
  const futureSize  = inPaintMode ? worldFuture.length     : getFutureSize()

  const handleUndo = () => {
    if (inPaintMode) { if (worldHistory.length > 0) undoLastCommand() }
    else if (canHabitUndo()) undo()
  }

  const handleRedo = () => {
    if (inPaintMode) { if (worldFuture.length > 0) redoNextCommand() }
    else if (canHabitRedo()) redo()
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title={`Undo (Ctrl+Z) — ${historySize} action${historySize !== 1 ? 's' : ''}${inPaintMode ? ' (paint)' : ''}`}
        style={{
          background: canUndo ? colors.primary : colors.border,
          color: canUndo ? colors.text.inverted : colors.text.tertiary,
          border: 'none',
          borderRadius: '6px',
          padding: '6px 10px',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: "'Noto Sans JP', sans-serif",
          transition: 'all 150ms ease',
          opacity: canUndo ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={(e) => {
          if (canUndo) {
            e.target.style.opacity = '0.9'
          }
        }}
        onMouseLeave={(e) => {
          if (canUndo) {
            e.target.style.opacity = '1'
          }
        }}
      >
        ↩️ {historySize}
      </button>

      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        title={`Redo (Ctrl+Shift+Z) — ${futureSize} action${futureSize !== 1 ? 's' : ''}${inPaintMode ? ' (paint)' : ''}`}
        style={{
          background: canRedo ? colors.primary : colors.border,
          color: canRedo ? colors.text.inverted : colors.text.tertiary,
          border: 'none',
          borderRadius: '6px',
          padding: '6px 10px',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: "'Noto Sans JP', sans-serif",
          transition: 'all 150ms ease',
          opacity: canRedo ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={(e) => {
          if (canRedo) {
            e.target.style.opacity = '0.9'
          }
        }}
        onMouseLeave={(e) => {
          if (canRedo) {
            e.target.style.opacity = '1'
          }
        }}
      >
        ↪️ {futureSize}
      </button>
    </div>
  )
}
