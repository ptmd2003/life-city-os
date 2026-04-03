/**
 * Logging Utility — Centralized console logging with levels
 * 
 * Usage:
 *   logger.info('Feature initialized')
 *   logger.warn('Something might be wrong')
 *   logger.error('Critical issue')
 *   logger.debug('Detailed debug info') // Only logs in dev
 */

const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

// Set to ERROR for production, DEBUG for development
const CURRENT_LEVEL = import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN

const logger = {
  debug: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVEL.DEBUG) {
      console.log(`[DEBUG] ${message}`, data ?? '')
    }
  },

  info: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVEL.INFO) {
      console.log(`[INFO] ${message}`, data ?? '')
    }
  },

  warn: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVEL.WARN) {
      console.warn(`[WARN] ${message}`, data ?? '')
    }
  },

  error: (message, data) => {
    if (CURRENT_LEVEL <= LOG_LEVEL.ERROR) {
      console.error(`[ERROR] ${message}`, data ?? '')
    }
  },

  group: (label) => {
    if (CURRENT_LEVEL <= LOG_LEVEL.DEBUG) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (CURRENT_LEVEL <= LOG_LEVEL.DEBUG) {
      console.groupEnd()
    }
  },
}

export default logger
