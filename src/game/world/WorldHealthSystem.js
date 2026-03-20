import { WorldState } from "./WorldState";

export class WorldHealthSystem {

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