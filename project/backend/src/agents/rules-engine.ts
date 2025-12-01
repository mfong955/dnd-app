/**
 * Rules Engine Agent
 * 
 * Responsibilities:
 * - Resolve dice rolls and checks
 * - Calculate combat outcomes
 * - Validate action legality
 * - Apply status effects
 * - Track HP, conditions, and resources
 * - Enforce D&D 3.5e SRD rules
 */

import {
  RollResult,
  RulesResolution,
  StatusChange,
  AbilityScores,
} from '../types';

// ============================================================================
// System Prompt (for LLM-assisted complex rules)
// ============================================================================

const RULES_ENGINE_SYSTEM_PROMPT = `You are the Rules Engine implementing D&D 3.5e mechanical resolution (core combat, checks, saves, spells basics).

Return only structured JSON: {success:boolean, roll:{d20,modifiers,total}, dc, effect_summary, hp_delta, status_changes, resolution_notes}

If missing inputs, return success:false with resolution_notes listing minimal required fields.

Avoid verbatim copyrighted SRD; summarize effects.`;

// ============================================================================
// Rules Engine Class
// ============================================================================

export class RulesEngine {
  constructor() {
    console.log('[Rules Engine] Initialized');
  }

  /**
   * Roll a d20 with modifiers
   */
  rollD20(modifiers: number[] = []): RollResult {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const modifierSum = modifiers.reduce((sum, mod) => sum + mod, 0);
    const total = d20 + modifierSum;

    return {
      d20,
      modifiers,
      total,
      criticalHit: d20 === 20,
      criticalMiss: d20 === 1,
    };
  }

  /**
   * Roll multiple dice (e.g., 2d6, 3d8)
   */
  rollDice(count: number, sides: number, modifier: number = 0): number {
    let total = modifier;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  }

  /**
   * Calculate ability modifier from ability score
   */
  getAbilityModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Resolve attack roll
   */
  resolveAttack(
    attackBonus: number,
    targetAC: number,
    additionalModifiers: number[] = []
  ): RulesResolution {
    const roll = this.rollD20([attackBonus, ...additionalModifiers]);
    const success = roll.total >= targetAC;

    return {
      success,
      roll,
      dc: targetAC,
      effectSummary: success ? 'Attack hits!' : 'Attack misses.',
      resolutionNotes: [
        `Rolled ${roll.d20} + ${attackBonus} = ${roll.total} vs AC ${targetAC}`,
      ],
    };
  }

  /**
   * Resolve damage roll
   */
  resolveDamage(
    diceCount: number,
    diceSides: number,
    damageModifier: number = 0,
    isCritical: boolean = false
  ): number {
    let damage = this.rollDice(diceCount, diceSides, damageModifier);
    
    if (isCritical) {
      // Critical hit: roll damage twice
      damage += this.rollDice(diceCount, diceSides, 0);
    }

    return Math.max(0, damage);
  }

  /**
   * Resolve saving throw
   */
  resolveSavingThrow(
    saveBonus: number,
    dc: number,
    additionalModifiers: number[] = []
  ): RulesResolution {
    const roll = this.rollD20([saveBonus, ...additionalModifiers]);
    const success = roll.total >= dc;

    return {
      success,
      roll,
      dc,
      effectSummary: success ? 'Save successful!' : 'Save failed.',
      resolutionNotes: [
        `Rolled ${roll.d20} + ${saveBonus} = ${roll.total} vs DC ${dc}`,
      ],
    };
  }

  /**
   * Resolve skill check
   */
  resolveSkillCheck(
    skillBonus: number,
    dc: number,
    additionalModifiers: number[] = []
  ): RulesResolution {
    const roll = this.rollD20([skillBonus, ...additionalModifiers]);
    const success = roll.total >= dc;

    return {
      success,
      roll,
      dc,
      effectSummary: success ? 'Check successful!' : 'Check failed.',
      resolutionNotes: [
        `Rolled ${roll.d20} + ${skillBonus} = ${roll.total} vs DC ${dc}`,
      ],
    };
  }

  /**
   * Resolve initiative roll
   */
  resolveInitiative(initiativeModifier: number): number {
    const roll = this.rollD20([initiativeModifier]);
    return roll.total;
  }

  /**
   * Calculate attack bonus
   */
  calculateAttackBonus(
    baseAttackBonus: number,
    abilityModifier: number,
    otherModifiers: number[] = []
  ): number {
    return baseAttackBonus + abilityModifier + otherModifiers.reduce((sum, mod) => sum + mod, 0);
  }

  /**
   * Calculate AC
   */
  calculateAC(
    baseAC: number = 10,
    dexModifier: number,
    armorBonus: number = 0,
    shieldBonus: number = 0,
    otherModifiers: number[] = []
  ): {
    total: number;
    flatFooted: number;
    touch: number;
  } {
    const total = baseAC + dexModifier + armorBonus + shieldBonus + 
                  otherModifiers.reduce((sum, mod) => sum + mod, 0);
    const flatFooted = baseAC + armorBonus + shieldBonus + 
                       otherModifiers.reduce((sum, mod) => sum + mod, 0);
    const touch = baseAC + dexModifier + 
                  otherModifiers.reduce((sum, mod) => sum + mod, 0);

    return { total, flatFooted, touch };
  }

  /**
   * Validate action legality
   */
  validateAction(
    actionType: string,
    context: {
      hasStandardAction?: boolean;
      hasMoveAction?: boolean;
      hasSwiftAction?: boolean;
      movementRemaining?: number;
    }
  ): {
    valid: boolean;
    reason?: string;
  } {
    switch (actionType) {
      case 'standard':
        if (!context.hasStandardAction) {
          return { valid: false, reason: 'No standard action available' };
        }
        break;
      
      case 'move':
        if (!context.hasMoveAction) {
          return { valid: false, reason: 'No move action available' };
        }
        break;
      
      case 'swift':
        if (!context.hasSwiftAction) {
          return { valid: false, reason: 'No swift action available' };
        }
        break;
      
      case 'full':
        if (!context.hasStandardAction || !context.hasMoveAction) {
          return { valid: false, reason: 'Full-round action requires both standard and move actions' };
        }
        break;
      
      case 'movement':
        if (context.movementRemaining !== undefined && context.movementRemaining <= 0) {
          return { valid: false, reason: 'No movement remaining' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Apply damage to HP
   */
  applyDamage(
    currentHP: number,
    maxHP: number,
    damage: number
  ): {
    newHP: number;
    status: 'healthy' | 'wounded' | 'disabled' | 'dying' | 'dead';
    statusChanges: StatusChange[];
  } {
    const newHP = Math.max(-10, currentHP - damage);
    const statusChanges: StatusChange[] = [];

    let status: 'healthy' | 'wounded' | 'disabled' | 'dying' | 'dead' = 'healthy';

    if (newHP <= -10) {
      status = 'dead';
      statusChanges.push({
        target: 'self',
        type: 'condition',
        change: { name: 'Dead', description: 'Character is dead' },
      });
    } else if (newHP < 0) {
      status = 'dying';
      statusChanges.push({
        target: 'self',
        type: 'condition',
        change: { name: 'Dying', description: 'Character is dying and must stabilize' },
      });
    } else if (newHP === 0) {
      status = 'disabled';
      statusChanges.push({
        target: 'self',
        type: 'condition',
        change: { name: 'Disabled', description: 'Character can take only a single move or standard action' },
      });
    } else if (newHP < maxHP / 2) {
      status = 'wounded';
    }

    return { newHP, status, statusChanges };
  }

  /**
   * Apply healing to HP
   */
  applyHealing(
    currentHP: number,
    maxHP: number,
    healing: number
  ): {
    newHP: number;
    overheal: number;
  } {
    const newHP = Math.min(maxHP, currentHP + healing);
    const overheal = Math.max(0, (currentHP + healing) - maxHP);

    return { newHP, overheal };
  }

  /**
   * Check if attack threatens critical
   */
  threatsCritical(d20Roll: number, criticalRange: number = 20): boolean {
    return d20Roll >= criticalRange;
  }

  /**
   * Confirm critical hit
   */
  confirmCritical(
    attackBonus: number,
    targetAC: number,
    additionalModifiers: number[] = []
  ): boolean {
    const confirmRoll = this.rollD20([attackBonus, ...additionalModifiers]);
    return confirmRoll.total >= targetAC;
  }

  /**
   * Calculate skill modifier
   */
  calculateSkillModifier(
    ranks: number,
    abilityModifier: number,
    isClassSkill: boolean,
    otherModifiers: number[] = []
  ): number {
    const classSkillBonus = isClassSkill && ranks > 0 ? 3 : 0;
    return ranks + abilityModifier + classSkillBonus + 
           otherModifiers.reduce((sum, mod) => sum + mod, 0);
  }

  /**
   * Get saving throw DC for spell
   */
  getSpellDC(spellLevel: number, casterAbilityModifier: number): number {
    return 10 + spellLevel + casterAbilityModifier;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default RulesEngine;