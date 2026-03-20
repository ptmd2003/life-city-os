import { WorldHealthSystem } from "./WorldHealthSystem.js";

export class WorldEffectSystem {

  static getBirdCount() {

    const health = WorldHealthSystem.getWorldHealth();

    if (health >= 7) return 6;
    if (health >= 4) return 3;
    if (health >= 2) return 1;

    return 0;
  }

  static isWorldDark() {

    const health = WorldHealthSystem.getWorldHealth();

    return health <= 2;
  }

}