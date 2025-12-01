/**
 * Combat Manager
 * 
 * Manages turn-by-turn combat flow
 */

import RulesEngine from '../agents/rules-engine';
import DMAgent from '../agents/dm-agent';
import { CharacterSheet } from '../schemas/character-sheet';

// ============================================================================
// Types
// ============================================================================

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: { current: number; max: number };
  ac: number;
  isPlayer: boolean;
  isDefeated: boolean;
  character?: CharacterSheet;
}

export interface CombatState {
  round: number;
  turnIndex: number;
  combatants: Combatant[];
  combatLog: string[];
  isActive: boolean;
}

export interface CombatAction {
  type: 'attack' | 'spell' | 'move' | 'defend' | 'item' | 'pass';
  actorId: string;
  targetId?: string;
  description: string;
}

// ============================================================================
// Combat Manager Class
// ============================================================================

export class CombatManager {
  private state: CombatState;
  private rulesEngine: RulesEngine;
  private dmAgent: DMAgent;

  constructor(rulesEngine: RulesEngine, dmAgent: DMAgent) {
    this.rulesEngine = rulesEngine;
    this.dmAgent = dmAgent;
    this.state = {
      round: 0,
      turnIndex: 0,
      combatants: [],
      combatLog: [],
      isActive: false,
    };
  }

  /**
   * Start combat with given combatants
   */
  startCombat(combatants: Combatant[]): void {
    // Roll initiative and sort
    const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);
    
    this.state = {
      round: 1,
      turnIndex: 0,
      combatants: sortedCombatants,
      combatLog: ['⚔️  COMBAT BEGINS!'],
      isActive: true,
    };

    this.addToLog(`Initiative order: ${sortedCombatants.map(c => c.name).join(' → ')}`);
  }

  /**
   * Get current combatant
   */
  getCurrentCombatant(): Combatant | null {
    if (!this.state.isActive || this.state.combatants.length === 0) {
      return null;
    }
    return this.state.combatants[this.state.turnIndex];
  }

  /**
   * Get all active (non-defeated) combatants
   */
  getActiveCombatants(): Combatant[] {
    return this.state.combatants.filter(c => !c.isDefeated);
  }

  /**
   * Get combatant by ID
   */
  getCombatant(id: string): Combatant | undefined {
    return this.state.combatants.find(c => c.id === id);
  }

  /**
   * Process attack action
   */
  async processAttack(
    actorId: string,
    targetId: string,
    attackBonus: number,
    damageRoll: { dice: number; sides: number; bonus: number }
  ): Promise<{ success: boolean; damage?: number; narrative: string }> {
    const actor = this.getCombatant(actorId);
    const target = this.getCombatant(targetId);

    if (!actor || !target) {
      return { success: false, narrative: 'Invalid combatants' };
    }

    if (target.isDefeated) {
      return { success: false, narrative: `${target.name} is already defeated!` };
    }

    // Resolve attack
    const attackResult = this.rulesEngine.resolveAttack(attackBonus, target.ac);
    
    if (attackResult.success) {
      const damage = this.rulesEngine.resolveDamage(
        damageRoll.dice,
        damageRoll.sides,
        damageRoll.bonus
      );

      // Apply damage
      target.hp.current = Math.max(0, target.hp.current - damage);
      
      if (target.hp.current === 0) {
        target.isDefeated = true;
      }

      // Generate narrative
      const narrative = await this.dmAgent.generateCombatNarrative(
        actor.name,
        'melee attack',
        target.name,
        { success: true, damage }
      );

      this.addToLog(`${actor.name} attacks ${target.name}: HIT for ${damage} damage! (${target.hp.current}/${target.hp.max} HP remaining)`);
      
      if (target.isDefeated) {
        this.addToLog(`💀 ${target.name} has been defeated!`);
      }

      return { success: true, damage, narrative };
    } else {
      const narrative = await this.dmAgent.generateCombatNarrative(
        actor.name,
        'melee attack',
        target.name,
        { success: false }
      );

      this.addToLog(`${actor.name} attacks ${target.name}: MISS!`);
      
      return { success: false, narrative };
    }
  }

  /**
   * Apply damage to combatant
   */
  applyDamage(targetId: string, damage: number, source: string): void {
    const target = this.getCombatant(targetId);
    if (!target || target.isDefeated) return;

    target.hp.current = Math.max(0, target.hp.current - damage);
    
    if (target.hp.current === 0) {
      target.isDefeated = true;
      this.addToLog(`💀 ${target.name} has been defeated!`);
    }

    this.addToLog(`${target.name} takes ${damage} damage from ${source} (${target.hp.current}/${target.hp.max} HP)`);
  }

  /**
   * Apply healing to combatant
   */
  applyHealing(targetId: string, healing: number, source: string): void {
    const target = this.getCombatant(targetId);
    if (!target || target.isDefeated) return;

    const oldHP = target.hp.current;
    target.hp.current = Math.min(target.hp.max, target.hp.current + healing);
    const actualHealing = target.hp.current - oldHP;

    this.addToLog(`${target.name} healed ${actualHealing} HP from ${source} (${target.hp.current}/${target.hp.max} HP)`);
  }

  /**
   * End current turn and move to next
   */
  nextTurn(): { newRound: boolean; currentCombatant: Combatant | null } {
    if (!this.state.isActive) {
      return { newRound: false, currentCombatant: null };
    }

    // Move to next active combatant
    let attempts = 0;
    const maxAttempts = this.state.combatants.length;

    do {
      this.state.turnIndex = (this.state.turnIndex + 1) % this.state.combatants.length;
      attempts++;

      // Check if we've completed a round
      if (this.state.turnIndex === 0) {
        this.state.round++;
        this.addToLog(`\n=== ROUND ${this.state.round} ===`);
        return { newRound: true, currentCombatant: this.getCurrentCombatant() };
      }

      // Check if current combatant is active
      const current = this.getCurrentCombatant();
      if (current && !current.isDefeated) {
        return { newRound: false, currentCombatant: current };
      }
    } while (attempts < maxAttempts);

    // All combatants defeated (shouldn't happen)
    return { newRound: false, currentCombatant: null };
  }

  /**
   * Check if combat should end
   */
  checkCombatEnd(): { ended: boolean; winners?: 'players' | 'enemies'; reason?: string } {
    const activePlayers = this.state.combatants.filter(c => c.isPlayer && !c.isDefeated);
    const activeEnemies = this.state.combatants.filter(c => !c.isPlayer && !c.isDefeated);

    if (activePlayers.length === 0) {
      this.state.isActive = false;
      this.addToLog('\n💀 All players defeated! DEFEAT!');
      return { ended: true, winners: 'enemies', reason: 'All players defeated' };
    }

    if (activeEnemies.length === 0) {
      this.state.isActive = false;
      this.addToLog('\n🎉 All enemies defeated! VICTORY!');
      return { ended: true, winners: 'players', reason: 'All enemies defeated' };
    }

    return { ended: false };
  }

  /**
   * Get combat state
   */
  getState(): CombatState {
    return { ...this.state };
  }

  /**
   * Get combat log
   */
  getLog(): string[] {
    return [...this.state.combatLog];
  }

  /**
   * Add entry to combat log
   */
  private addToLog(entry: string): void {
    this.state.combatLog.push(entry);
  }

  /**
   * Get combat summary
   */
  getSummary(): string {
    const active = this.getActiveCombatants();
    const defeated = this.state.combatants.filter(c => c.isDefeated);

    return `
📊 COMBAT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Round: ${this.state.round}
Active Combatants: ${active.length}
Defeated: ${defeated.length}

${active.map(c => `${c.isPlayer ? '👤' : '👹'} ${c.name}: ${c.hp.current}/${c.hp.max} HP`).join('\n')}
${defeated.length > 0 ? `\nDefeated: ${defeated.map(c => c.name).join(', ')}` : ''}
    `.trim();
  }

  /**
   * End combat manually
   */
  endCombat(): void {
    this.state.isActive = false;
    this.addToLog('\n⚔️  COMBAT ENDED');
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CombatManager;