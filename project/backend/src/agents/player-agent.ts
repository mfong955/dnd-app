/**
 * Player Agent
 * 
 * Responsibilities:
 * - Maintain canonical character sheet
 * - Generate proposed character edits
 * - Validate edit requests against rules
 * - Track character resources and state
 * - Provide character context to other agents
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CharacterEditProposal,
  FieldChange,
} from '../types';
import {
  CharacterSheet,
  CharacterSheetSchema,
  validateCharacterSheet,
  createBlankCharacterSheet,
} from '../schemas/character-sheet';

// ============================================================================
// System Prompt
// ============================================================================

const PLAYER_AGENT_SYSTEM_PROMPT = `You represent a Player {player_id}.

Keep the player's canonical character sheet at project/user_resources/characters/{player_id}.md.

On player edits generate a proposed delta JSON: {field_changes:[{path,old,new}], required_confirmations:[ids], summary}.

Do not write files directly; send deltas to Coordinator.`;

// ============================================================================
// Player Agent Class
// ============================================================================

export class PlayerAgent {
  private characterSheet: CharacterSheet | null = null;
  private playerId: string;

  constructor(playerId: string) {
    this.playerId = playerId;
    console.log(`[Player Agent] Initialized for player ${playerId}`);
  }

  /**
   * Load character sheet
   */
  async loadCharacter(characterSheet: CharacterSheet): Promise<void> {
    console.log(`[Player Agent] Loading character: ${characterSheet.name}`);
    
    // Validate character sheet
    const validation = validateCharacterSheet(characterSheet);
    if (!validation.success) {
      throw new Error(`Invalid character sheet: ${validation.errors?.message}`);
    }

    this.characterSheet = characterSheet;
    console.log(`[Player Agent] Character loaded: ${characterSheet.name} (Level ${characterSheet.level} ${characterSheet.class})`);
  }

  /**
   * Create new character
   */
  async createCharacter(name: string): Promise<CharacterSheet> {
    console.log(`[Player Agent] Creating new character: ${name}`);
    
    const newCharacter = createBlankCharacterSheet(name, this.playerId) as CharacterSheet;
    this.characterSheet = newCharacter;
    
    console.log(`[Player Agent] Character created: ${name}`);
    return newCharacter;
  }

  /**
   * Get current character sheet
   */
  getCharacter(): CharacterSheet {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }
    return this.characterSheet;
  }

  /**
   * Propose character edit
   */
  proposeEdit(
    fieldChanges: FieldChange[],
    requiredConfirmations: string[],
    summary: string
  ): CharacterEditProposal {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    console.log(`[Player Agent] Proposing edit: ${summary}`);

    const proposal: CharacterEditProposal = {
      characterId: this.characterSheet.id,
      proposedBy: this.playerId,
      timestamp: new Date().toISOString(),
      fieldChanges,
      requiredConfirmations,
      summary,
    };

    return proposal;
  }

  /**
   * Apply approved edit
   */
  applyEdit(proposal: CharacterEditProposal): CharacterSheet {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    console.log(`[Player Agent] Applying edit: ${proposal.summary}`);

    // Apply each field change
    let updatedSheet = { ...this.characterSheet };

    for (const change of proposal.fieldChanges) {
      updatedSheet = this.setNestedProperty(updatedSheet, change.path, change.newValue);
    }

    // Update metadata
    updatedSheet.version += 1;
    updatedSheet.lastModified = new Date().toISOString();
    updatedSheet.lastModifiedBy = proposal.proposedBy;
    
    // Validate updated sheet
    const validation = validateCharacterSheet(updatedSheet);
    if (!validation.success) {
      throw new Error(`Edit would create invalid character sheet: ${validation.errors?.message}`);
    }

    this.characterSheet = updatedSheet;
    console.log(`[Player Agent] Edit applied successfully (v${updatedSheet.version})`);
    
    return updatedSheet;
  }

  /**
   * Update HP
   */
  updateHP(delta: number, reason: string): CharacterEditProposal {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    const oldHP = this.characterSheet.hp.current;
    const newHP = Math.max(0, Math.min(this.characterSheet.hp.max, oldHP + delta));

    return this.proposeEdit(
      [
        {
          path: 'hp.current',
          oldValue: oldHP,
          newValue: newHP,
          reason,
        },
      ],
      [this.playerId], // Player must confirm HP changes
      `HP ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}: ${reason}`
    );
  }

  /**
   * Update resource (spell slots, rage rounds, etc.)
   */
  updateResource(
    resourceName: string,
    delta: number,
    reason: string
  ): CharacterEditProposal {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    const resource = this.characterSheet.resources?.[resourceName];
    if (!resource) {
      throw new Error(`Resource ${resourceName} not found`);
    }

    const oldValue = resource.current;
    const newValue = Math.max(0, Math.min(resource.max, oldValue + delta));

    return this.proposeEdit(
      [
        {
          path: `resources.${resourceName}.current`,
          oldValue,
          newValue,
          reason,
        },
      ],
      [this.playerId],
      `${resourceName} ${delta > 0 ? 'restored' : 'used'} by ${Math.abs(delta)}: ${reason}`
    );
  }

  /**
   * Add condition
   */
  addCondition(
    name: string,
    description: string,
    duration?: string,
    source?: string
  ): CharacterEditProposal {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    const newCondition = { name, description, duration, source };
    const oldConditions = this.characterSheet.conditions;
    const newConditions = [...oldConditions, newCondition];

    return this.proposeEdit(
      [
        {
          path: 'conditions',
          oldValue: oldConditions,
          newValue: newConditions,
          reason: `Applied condition: ${name}`,
        },
      ],
      [this.playerId],
      `Condition added: ${name}`
    );
  }

  /**
   * Remove condition
   */
  removeCondition(conditionName: string): CharacterEditProposal {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    const oldConditions = this.characterSheet.conditions;
    const newConditions = oldConditions.filter(c => c.name !== conditionName);

    if (oldConditions.length === newConditions.length) {
      throw new Error(`Condition ${conditionName} not found`);
    }

    return this.proposeEdit(
      [
        {
          path: 'conditions',
          oldValue: oldConditions,
          newValue: newConditions,
          reason: `Removed condition: ${conditionName}`,
        },
      ],
      [this.playerId],
      `Condition removed: ${conditionName}`
    );
  }

  /**
   * Get character summary
   */
  getSummary(): {
    name: string;
    class: string;
    level: number;
    hp: { current: number; max: number };
    ac: number;
    conditions: string[];
  } {
    if (!this.characterSheet) {
      throw new Error('No character loaded');
    }

    return {
      name: this.characterSheet.name,
      class: this.characterSheet.class,
      level: this.characterSheet.level,
      hp: {
        current: this.characterSheet.hp.current,
        max: this.characterSheet.hp.max,
      },
      ac: (this.characterSheet.ac as any).total || this.characterSheet.ac,
      conditions: this.characterSheet.conditions.map(c => c.name),
    };
  }

  /**
   * Helper: Set nested property by path
   */
  private setNestedProperty(obj: any, path: string, value: any): any {
    const keys = path.split('.');
    const result = { ...obj };
    let current: any = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = { ...current[key] };
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }

  /**
   * Validate character sheet integrity
   */
  validateIntegrity(): {
    valid: boolean;
    errors: string[];
  } {
    if (!this.characterSheet) {
      return { valid: false, errors: ['No character loaded'] };
    }

    const validation = validateCharacterSheet(this.characterSheet);
    
    if (validation.success) {
      return { valid: true, errors: [] };
    }

    const errors = validation.errors?.errors.map(e => e.message) || ['Unknown validation error'];
    return { valid: false, errors };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default PlayerAgent;