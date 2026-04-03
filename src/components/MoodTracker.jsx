import React, { useState } from 'react'
import { useLifeOS } from '../stores/useLifeOS'
import { colors, typography, spacing, buttonStyles, containers } from '../theme/colors.js'

const MOOD_LABELS = {
  1: 'Exhausted',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
}

export default function MoodTracker() {
  const { todayMood, setMood, setMoodNote } = useLifeOS()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [tempNote, setTempNote] = useState(todayMood.note)

  const handleEnergyChange = (value) => {
    setMood(value, todayMood.mood, todayMood.note)
  }

  const handleMoodChange = (value) => {
    setMood(todayMood.energy, value, todayMood.note)
  }

  const handleNoteSave = () => {
    setMoodNote(tempNote)
    setIsEditingNote(false)
  }

  return (
    <div>
      {!isExpanded ? (
        // ─── COLLAPSED VIEW ───
        <div
          onClick={() => setIsExpanded(true)}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            background: colors.surface,
            borderRadius: '12px',
            boxShadow: colors.shadow.sm,
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '12px',
            border: `1px solid ${colors.border}`,
          }}
          title="Click to expand daily check-in"
        >
          <span style={{ color: colors.primary, fontWeight: '600' }}>daily check-in</span>
          <span style={{ color: colors.text.secondary }}>Energy: {MOOD_LABELS[todayMood.energy]}</span>
          <span style={{ color: colors.border }}>•</span>
          <span style={{ color: colors.text.secondary }}>Mood: {MOOD_LABELS[todayMood.mood]}</span>
          {todayMood.note && (
            <>
              <span style={{ color: colors.border }}>•</span>
              <span style={{ fontSize: '11px', color: colors.text.tertiary, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{todayMood.note}"
              </span>
            </>
          )}
        </div>
      ) : isEditingNote ? (
        // ─── NOTE EDITING VIEW ───
        <div style={{ background: colors.surface, borderRadius: '12px', padding: '12px 14px', boxShadow: colors.shadow.sm, marginBottom: '12px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ color: colors.primary, margin: 0, fontWeight: '600', fontSize: '14px' }}>Note</h3>
            <button
              onClick={() => setIsEditingNote(false)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                fontSize: '14px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            placeholder="Add details..."
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'Rec Mono', monospace",
              minHeight: '80px',
              boxSizing: 'border-box',
              marginBottom: '10px',
              background: colors.surface,
              color: colors.text.primary,
              boxShadow: `0 1px 2px rgba(90, 85, 81, 0.04)`,
            }}
          />
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              onClick={handleNoteSave}
              style={{
                flex: 1,
                ...buttonStyles.primary,
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              save
            </button>
            <button
              onClick={() => setIsEditingNote(false)}
              style={{
                flex: 1,
                ...buttonStyles.secondary,
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        // ─── EXPANDED VIEW (Energy + Mood) ───
        <div style={{ background: colors.surface, borderRadius: '12px', padding: '12px', boxShadow: '0 2px 6px rgba(90, 85, 81, 0.08)', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: colors.primary, margin: 0, fontWeight: '600' }}>Daily Check-In</h3>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                fontSize: '14px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Energy */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: colors.text.secondary, fontWeight: '700', letterSpacing: '0.3px' }}>
              ENERGY
            </label>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEnergyChange(value)
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: todayMood.energy === value ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    background: todayMood.energy === value ? colors.primary : colors.subsurface,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: todayMood.energy === value ? '600' : '500',
                    color: todayMood.energy === value ? colors.text.inverted : colors.text.primary,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {MOOD_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: colors.text.secondary, fontWeight: '700', letterSpacing: '0.3px' }}>
              MOOD
            </label>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoodChange(value)
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: todayMood.mood === value ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    background: todayMood.mood === value ? colors.primary : colors.subsurface,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: todayMood.mood === value ? '600' : '500',
                    color: todayMood.mood === value ? colors.text.inverted : colors.text.primary,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {MOOD_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          {/* Note preview */}
          {todayMood.note && (
            <div style={{ fontSize: '11px', color: colors.text.secondary, background: colors.subsurface, padding: '8px 10px', borderRadius: '3px', marginTop: '10px', borderLeft: `2px solid ${colors.primary}` }}>
              "{todayMood.note.substring(0, 60)}{todayMood.note.length > 60 ? '...' : ''}"
            </div>
          )}

          {/* Note button */}
          <button
            onClick={() => {
              setTempNote(todayMood.note)
              setIsEditingNote(true)
            }}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '8px',
              background: colors.surface,
              color: colors.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {todayMood.note ? 'Edit note' : 'Add note'}
          </button>
        </div>
      )}
    </div>
  )
}
