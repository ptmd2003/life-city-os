/**
 * Color System — Japanese Wabi-Sabi Aesthetic
 * Built on natural, muted matcha greens and soft Japanese nature tones
 * "Ma" (間) — meaningful negative space, calm, breathing UI
 */

export const colors = {
  // ─── PRIMARY PALETTE (Matcha greens & natural tones) ───
  primary: '#A8C5A0',        // Matcha core — primary buttons, active tabs
  accent: '#A8C5A0',         // Same as primary for consistency
  success: '#A8C5A0',        // Positive feedback — matcha green
  warning: '#F2C4C4',        // Sakura accent — alerts and cautions
  danger: '#F2C4C4',         // Same as warning for alerts
  info: '#D4EBD4',           // Tsuki glow — soft highlights

  // ─── SURFACES & BACKGROUNDS ───
  surface: '#F0F5F0',        // Shizen white — cards, panels
  subsurface: '#E8F0E8',     // Kumo cloud — subtle differentiation
  background: '#F0F5F0',     // Main container, base layer
  darkOverlay: 'rgba(61, 90, 68, 0.08)',  // Soft nori dark overlay

  // ─── TEXT & CONTRAST ───
  text: {
    primary: '#3D5A44',      // Nori dark — headings, strong text
    secondary: '#6B8F71',    // Mossy shadow — body text, labels
    tertiary: '#B7CEB5',     // Wa sage — hints, captions
    inverted: '#F0F5F0',     // Shizen white — light text (rarely used)
  },

  // ─── BORDERS & DIVIDERS ───
  border: '#B7CEB5',         // Wa sage — regular borders
  borderLight: '#C8DFC8',    // Bamboo mist — subtle dividers
  borderSubtle: '#E8F0E8',   // Kumo cloud — almost invisible

  // ─── CATEGORY LABELS (Matcha-centric) ───
  labels: {
    work: '#A8C5A0',         // Matcha core
    health: '#A8C5A0',       // Matcha core
    finance: '#A8C5A0',      // Matcha core
    learning: '#A8C5A0',     // Matcha core
    mind: '#A8C5A0',         // Matcha core
  },

  // ─── RECURRING TASK COLORS (Soft matcha palette) ───
  recurring: {
    daily: '#A8C5A0',        // Matcha core
    weekly: '#A8C5A0',       // Matcha core
    biweekly: '#A8C5A0',     // Matcha core
    monthly: '#A8C5A0',      // Matcha core
    quarterly: '#A8C5A0',    // Matcha core (all same for harmony)
  },

  // ─── SHADOWS (Barely-there depth) ───
  shadow: {
    none: 'none',
    xs: '0 1px 4px rgba(61, 90, 68, 0.04)',
    sm: '0 2px 12px rgba(61, 90, 68, 0.08)',
    md: '0 4px 16px rgba(61, 90, 68, 0.12)',
    lg: '0 4px 24px rgba(61, 90, 68, 0.14)',
  },

  // ─── SEMANTIC GRADIENTS (Matcha-based) ───
  progress: {
    low: '#C8DFC8',          // Bamboo mist
    mid: '#B7CEB5',          // Wa sage
    high: '#A8C5A0',         // Matcha core
  },
}

/**
 * Helper: Get color for activity label
 */
export function getLabelColor(label) {
  return colors.labels[label?.toLowerCase()] || colors.primary
}

/**
 * Helper: Get color for recurring frequency
 */
export function getRecurringColor(frequency) {
  return colors.recurring[frequency?.toLowerCase().replace(' ', '')] || colors.primary
}

/**
 * Helper: Get progress color based on percentage
 */
export function getProgressColor(percent) {
  if (percent < 50) return colors.progress.low
  if (percent < 80) return colors.progress.mid
  return colors.progress.high
}

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY HIERARCHY — Visual levels for content importance
// ═══════════════════════════════════════════════════════════════
export const typography = {
  // Page title (Sidebar header "Life OS")
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.primary,
  },

  // Section headers ("daily check-in", "sleep cycle", etc.)
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: "'Zen Maru Gothic', sans-serif",
    textTransform: 'lowercase',
    letterSpacing: '0.2px',
  },

  // Body text (task titles, timestamps)
  body: {
    fontSize: '13px',
    fontWeight: '400',
    color: colors.text.primary,
  },

  // Secondary text (labels, metadata)
  secondary: {
    fontSize: '11px',
    fontWeight: '400',
    color: colors.text.secondary,
  },

  // Tertiary text (hints, disabled)
  tertiary: {
    fontSize: '11px',
    fontWeight: '300',
    color: colors.text.tertiary,
  },

  // Collapsed section content (shows current value)
  collapsedContent: {
    fontSize: '13px',
    fontWeight: '400',
    color: colors.text.secondary,
  },

  // Badge/label text
  badge: {
    fontSize: '11px',
    fontWeight: '500',
    color: colors.text.inverted,
  },

  // Caption/hint text — small, muted
  caption: {
    fontSize: '11px',
    fontWeight: '300',
    color: colors.text.tertiary,
    textTransform: 'lowercase',
    letterSpacing: '0.3px',
  },

  // Data/time display — monospace
  data: {
    fontSize: '12px',
    fontWeight: '400',
    color: colors.primary,
    fontFamily: "'JetBrains Mono', monospace",
  },
}

// ═══════════════════════════════════════════════════════════════
// SPACING SYSTEM (8px base unit) — Design System Standard
// ═══════════════════════════════════════════════════════════════
export const spacing = {
  xs: '4px',      // micro gaps (between inline elements)
  sm: '8px',      // small gaps (between child items)
  md: '16px',     // medium (standard section margin/gap)
  lg: '24px',     // large (between major sections)
  xl: '40px',     // extra large (panel padding)

  // Standard padding for containers
  containerPadding: '16px',

  // Standard margin between sections
  sectionMargin: '16px',

  // Standard gap between child elements
  childGap: '8px',
}

// ═══════════════════════════════════════════════════════════════
// CONTAINER STYLES — Consistent card/section styling
// ═══════════════════════════════════════════════════════════════
export const containers = {
  // Section container (background, padding, border, shadow)
  section: {
    background: colors.surface,
    borderRadius: '12px',
    padding: spacing.containerPadding,
    boxShadow: colors.shadow.sm,
    border: `1px solid ${colors.border}`,
    marginBottom: spacing.sectionMargin,
  },

  // Nested container (subsection, form group)
  subsection: {
    background: colors.subsurface,
    borderRadius: '8px',
    padding: '12px',
    border: `1px solid ${colors.borderLight}`,
  },

  // Item in a list
  item: {
    background: colors.surface,
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${colors.borderLight}`,
    marginBottom: spacing.sm,
  },
}
export const buttonStyles = {
  // Primary action button (Save, Submit, Create) — spec: 10px 20px, radius 10px
  primary: {
    background: colors.primary,
    color: colors.text.inverted,
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'lowercase',
    fontFamily: "'Noto Sans JP', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  primaryHover: {
    background: '#98B590',
    boxShadow: '0 4px 16px rgba(168, 197, 160, 0.4)',
    transform: 'translateY(-1px)',
  },

  primaryActive: {
    transform: 'scale(0.98) translateY(0)',
    boxShadow: 'none',
  },

  primaryDisabled: {
    background: colors.borderLight,
    color: colors.text.tertiary,
    cursor: 'not-allowed',
    opacity: 0.6,
  },

  // Secondary action button (Cancel, Reset, Dismiss) — transparent with border
  secondary: {
    background: 'transparent',
    color: colors.primary,
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 20px',
    border: `1px solid ${colors.primary}`,
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'lowercase',
    fontFamily: "'Noto Sans JP', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  secondaryHover: {
    background: colors.borderLight,
    borderColor: colors.borderLight,
    color: colors.text.primary,
  },

  secondaryActive: {
    transform: 'scale(0.98)',
  },

  // Collapse/Expand button (section headers)
  collapse: {
    background: 'transparent',
    color: colors.text.primary,
    fontSize: '18px',
    fontWeight: '600',
    padding: '0',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: "'Zen Maru Gothic', sans-serif",
    textTransform: 'lowercase',
  },

  collapseHover: {
    background: colors.subsurface,
    borderRadius: '8px',
    paddingLeft: '8px',
    paddingRight: '8px',
  },

  collapseActive: {
    opacity: 0.8,
  },

  // Icon-only button (small toggle, menu)
  icon: {
    background: 'transparent',
    color: colors.text.secondary,
    fontSize: '16px',
    fontWeight: '400',
    padding: '8px 12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconHover: {
    color: colors.primary,
    background: colors.borderLight,
    boxShadow: colors.shadow.sm,
  },
}

