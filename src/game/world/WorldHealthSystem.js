import { WorldState } from "./WorldState";

/**
 * WorldHealthSystem — Calculates world health score based on user activity
 * 
 * Monitors check-ins across health, study, and finance spaces.
 * Decaying formula: 
 * - < 1 day idle: +3
 * - < 3 days idle: +2
 * - < 7 days idle: +1
 * - 7+ days idle: +0
 * 
 * Total score: 0-9 (perfect health when all spaces checked within 24h)
 */
export class WorldHealthSystem {

  /**
   * Get current world health score (0-9)
   * @returns {number} Health score
   */
  static getWorldHealth() {

    const now = Date.now();

    const spaces = [
      WorldState.data.health,
      WorldState.data.study,
      WorldState.data.finance
    ];

    let score = 0;

    spaces.forEach(space => {

      const daysIdle = (now - space.lastCheckIn) / (1000 * 60 * 60 * 24);

      if (daysIdle < 1) score += 3;
      else if (daysIdle < 3) score += 2;
      else if (daysIdle < 7) score += 1;
      else score += 0;

    });

    return score;
  }

}