/**
 * TimeSystem — Real-time clock wrapper
 * Synced directly to system time
 * No game-time multiplier — what you see is what you get
 * 
 * Singleton pattern: Use TimeSystem.getInstance() to get the shared instance
 */
export class TimeSystem {
  static #instance = null

  constructor() {
    // Game time = system time (no offset)
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance() {
    if (!TimeSystem.#instance) {
      TimeSystem.#instance = new TimeSystem()
    }
    return TimeSystem.#instance
  }

  /**
   * Get current time as Date object
   */
  getCurrentTime() {
    return new Date()
  }

  /**
   * Get current hour (0-23)
   */
  getHour() {
    return this.getCurrentTime().getHours()
  }

  /**
   * Get current minute (0-59)
   */
  getMinute() {
    return this.getCurrentTime().getMinutes()
  }

  /**
   * Get current second (0-59)
   */
  getSecond() {
    return this.getCurrentTime().getSeconds()
  }

  /**
   * Get formatted time string: HH:MM:SS
   */
  getTimeString() {
    const h = String(this.getHour()).padStart(2, '0')
    const m = String(this.getMinute()).padStart(2, '0')
    const s = String(this.getSecond()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  /**
   * Get current day of year
   */
  getDay() {
    const now = this.getCurrentTime()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
  }

  /**
   * Get time period for UI display
   */
  getTimePeriod() {
    const hour = this.getHour()
    if (hour >= 5 && hour < 12) return '🌅 Morning'
    if (hour >= 12 && hour < 17) return '☀️ Afternoon'
    if (hour >= 17 && hour < 21) return '🌆 Evening'
    return '🌙 Night'
  }

  /**
   * Get season (0-3 for spring, summer, fall, winter)
   */
  getSeason() {
    const day = this.getDay()
    return Math.floor((day / 90) % 4) // ~90 days per season
  }

  getSeasonName() {
    const seasons = ['🌸 Spring', '☀️ Summer', '🍂 Autumn', '❄️ Winter']
    return seasons[this.getSeason()]
  }

  /**
   * Check if it's daytime (5:00 - 20:59)
   */
  isDayTime() {
    const hour = this.getHour()
    return hour >= 5 && hour < 21
  }

  /**
   * Check if it's night (21:00 - 4:59)
   */
  isNight() {
    return !this.isDayTime()
  }

  /**
   * Get normalized day brightness (0 to 1)
   * DISABLED: Always returns full brightness (1.0)
   * Previously varied by time of day (0.2 at night to 1.0 at noon)
   */
  getDayBrightness() {
    return 1.0 // Constant full brightness all day
  }
}