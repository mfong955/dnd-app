/**
 * Enemy AI
 * 
 * Simple AI for enemy combatants
 */

import { Combatant } from './combat-manager';

// ============================================================================
// Enemy AI
// ============================================================================

export interface AIDecision {
  action: 'attack' | 'defend' | 'pass';
  targetId?: string;
  reasoning: string;
}

export class EnemyAI {
  /**
   * Decide action for enemy
   */
  decideAction(
    enemy: Combatant,
    allCombatants: Combatant[]
  ): AIDecision {
    // Get all active player targets
    const playerTargets = allCombatants.filter(
      c => c.isPlayer && !c.isDefeated
    );

    if (playerTargets.length === 0) {
      return {
        action: 'pass',
        reasoning: 'No valid targets',
      };
    }

    // Simple AI strategy: Attack weakest player
    const weakestPlayer = playerTargets.reduce((weakest, current) => {
      const weakestPercent = weakest.hp.current / weakest.hp.max;
      const currentPercent = current.hp.current / current.hp.max;
      return currentPercent < weakestPercent ? current : weakest;
    });

    // If enemy is low on HP, consider defending
    const enemyHPPercent = enemy.hp.current / enemy.hp.max;
    if (enemyHPPercent < 0.25 && Math.random() < 0.3) {
      return {
        action: 'defend',
        reasoning: `${enemy.name} is low on HP and takes defensive stance`,
      };
    }

    return {
      action: 'attack',
      targetId: weakestPlayer.id,
      reasoning: `${enemy.name} attacks ${weakestPlayer.name} (weakest target)`,
    };
  }

  /**
   * Get attack bonus for enemy
   */
  getAttackBonus(enemy: Combatant): number {
    // Simple calculation based on enemy name/type
    const name = enemy.name.toLowerCase();
    
    if (name.includes('goblin')) return 2;
    if (name.includes('orc')) return 4;
    if (name.includes('skeleton')) return 1;
    if (name.includes('zombie')) return 1;
    if (name.includes('ogre')) return 6;
    if (name.includes('dragon')) return 10;
    
    return 3; // Default
  }

  /**
   * Get damage roll for enemy
   */
  getDamageRoll(enemy: Combatant): { dice: number; sides: number; bonus: number } {
    const name = enemy.name.toLowerCase();
    
    if (name.includes('goblin')) return { dice: 1, sides: 6, bonus: 0 };
    if (name.includes('orc')) return { dice: 1, sides: 8, bonus: 2 };
    if (name.includes('skeleton')) return { dice: 1, sides: 6, bonus: 0 };
    if (name.includes('zombie')) return { dice: 1, sides: 6, bonus: 1 };
    if (name.includes('ogre')) return { dice: 2, sides: 8, bonus: 4 };
    if (name.includes('dragon')) return { dice: 3, sides: 10, bonus: 6 };
    
    return { dice: 1, sides: 6, bonus: 1 }; // Default
  }
}

// ============================================================================
// Enemy Templates
// ============================================================================

export interface EnemyTemplate {
  name: string;
  hp: number;
  ac: number;
  initiative: number;
  description: string;
}

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  goblin: {
    name: 'Goblin',
    hp: 6,
    ac: 15,
    initiative: 1,
    description: 'Small, sneaky humanoid',
  },
  orc: {
    name: 'Orc',
    hp: 15,
    ac: 13,
    initiative: 0,
    description: 'Brutal warrior',
  },
  skeleton: {
    name: 'Skeleton',
    hp: 12,
    ac: 13,
    initiative: 1,
    description: 'Undead warrior',
  },
  zombie: {
    name: 'Zombie',
    hp: 16,
    ac: 11,
    initiative: -1,
    description: 'Slow but tough undead',
  },
  ogre: {
    name: 'Ogre',
    hp: 30,
    ac: 16,
    initiative: -1,
    description: 'Large, powerful brute',
  },
};

export function createEnemy(
  type: string,
  id: string,
  rulesEngine: any
): Combatant {
  const template = ENEMY_TEMPLATES[type.toLowerCase()] || ENEMY_TEMPLATES.goblin;
  
  return {
    id,
    name: `${template.name} ${id.replace('enemy', '')}`,
    initiative: rulesEngine.resolveInitiative(template.initiative),
    hp: { current: template.hp, max: template.hp },
    ac: template.ac,
    isPlayer: false,
    isDefeated: false,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default EnemyAI;