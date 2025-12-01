/**
 * Character Sheet Schema with Zod validation
 * Based on D&D 3.5e SRD
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Metadata Schema
// ============================================================================

export const FileMetadataSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive(),
  lastModified: z.string().datetime(),
  lastModifiedBy: z.string(),
  confirmedBy: z.array(z.string()).default([]),
  syncStatus: z.enum(['local', 'synced', 'conflict']).optional(),
  cloudVersion: z.number().int().positive().optional(),
});

// ============================================================================
// Ability Scores
// ============================================================================

export const AbilityScoresSchema = z.object({
  strength: z.number().int().min(1).max(50),
  dexterity: z.number().int().min(1).max(50),
  constitution: z.number().int().min(1).max(50),
  intelligence: z.number().int().min(1).max(50),
  wisdom: z.number().int().min(1).max(50),
  charisma: z.number().int().min(1).max(50),
});

// Helper to calculate ability modifier
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ============================================================================
// Hit Points
// ============================================================================

export const HitPointsSchema = z.object({
  current: z.number().int(),
  max: z.number().int().positive(),
  temporary: z.number().int().min(0).default(0),
});

// ============================================================================
// Skills
// ============================================================================

export const SkillSchema = z.object({
  name: z.string(),
  ranks: z.number().int().min(0),
  modifier: z.number().int(),
  isClassSkill: z.boolean(),
  abilityModifier: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
});

// ============================================================================
// Feats
// ============================================================================

export const FeatSchema = z.object({
  name: z.string(),
  description: z.string(),
  prerequisites: z.array(z.string()).optional(),
  benefit: z.string(),
});

// ============================================================================
// Spells
// ============================================================================

export const SpellSchema = z.object({
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.enum([
    'Abjuration',
    'Conjuration',
    'Divination',
    'Enchantment',
    'Evocation',
    'Illusion',
    'Necromancy',
    'Transmutation',
  ]),
  castingTime: z.string(),
  range: z.string(),
  duration: z.string(),
  savingThrow: z.string().optional(),
  spellResistance: z.boolean().optional(),
  description: z.string(),
  prepared: z.boolean().optional(),
  used: z.boolean().optional(),
});

// ============================================================================
// Items & Equipment
// ============================================================================

export const ItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum([
    'weapon',
    'armor',
    'shield',
    'potion',
    'scroll',
    'wand',
    'ring',
    'wondrous',
    'tool',
    'gear',
    'other',
  ]),
  weight: z.number().min(0),
  value: z.number().min(0), // in gold pieces
  description: z.string(),
  equipped: z.boolean().optional(),
  quantity: z.number().int().positive().default(1),
  properties: z.record(z.any()).optional(), // For weapon damage, armor AC bonus, etc.
});

// ============================================================================
// Conditions & Buffs
// ============================================================================

export const ConditionSchema = z.object({
  name: z.string(),
  description: z.string(),
  duration: z.string().optional(),
  source: z.string().optional(),
  effects: z.array(z.string()).optional(),
});

export const BuffSchema = z.object({
  name: z.string(),
  description: z.string(),
  modifier: z.number().int(),
  target: z.string(), // What it modifies (e.g., "AC", "attack", "strength")
  duration: z.string().optional(),
  source: z.string().optional(),
});

// ============================================================================
// Saving Throws
// ============================================================================

export const SavingThrowsSchema = z.object({
  fortitude: z.object({
    base: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
  }),
  reflex: z.object({
    base: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
  }),
  will: z.object({
    base: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
  }),
});

// ============================================================================
// Attack Bonuses
// ============================================================================

export const AttackBonusSchema = z.object({
  melee: z.object({
    base: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
  }),
  ranged: z.object({
    base: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
  }),
});

// ============================================================================
// Resources (spell slots, rage rounds, etc.)
// ============================================================================

export const ResourceSchema = z.object({
  current: z.number().int().min(0),
  max: z.number().int().min(0),
});

// ============================================================================
// Main Character Sheet Schema
// ============================================================================

export const CharacterSheetSchema = z.object({
  // Metadata
  ...FileMetadataSchema.shape,
  
  // Basic Information
  name: z.string().min(1),
  race: z.string(),
  class: z.string(),
  level: z.number().int().min(1).max(20),
  alignment: z.enum([
    'Lawful Good',
    'Neutral Good',
    'Chaotic Good',
    'Lawful Neutral',
    'True Neutral',
    'Chaotic Neutral',
    'Lawful Evil',
    'Neutral Evil',
    'Chaotic Evil',
  ]),
  deity: z.string().optional(),
  size: z.enum(['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal']).default('Medium'),
  
  // Ability Scores
  abilities: AbilityScoresSchema,
  
  // Combat Statistics
  hp: HitPointsSchema,
  ac: z.object({
    total: z.number().int(),
    flatFooted: z.number().int(),
    touch: z.number().int(),
    breakdown: z.string().optional(), // e.g., "10 base + 2 dex + 5 armor"
  }),
  initiative: z.number().int(),
  speed: z.object({
    base: z.number().int().positive(),
    current: z.number().int().positive(),
    fly: z.number().int().optional(),
    swim: z.number().int().optional(),
    climb: z.number().int().optional(),
  }),
  
  // Attack & Defense
  baseAttackBonus: z.number().int(),
  attackBonuses: AttackBonusSchema,
  savingThrows: SavingThrowsSchema,
  
  // Skills, Feats, Spells
  skills: z.array(SkillSchema),
  feats: z.array(FeatSchema),
  spells: z.array(SpellSchema).optional(),
  spellsPerDay: z.record(z.number().int()).optional(), // e.g., { "0": 3, "1": 2 }
  
  // Equipment & Inventory
  equipment: z.array(ItemSchema),
  inventory: z.array(ItemSchema),
  wealth: z.object({
    platinum: z.number().int().min(0).default(0),
    gold: z.number().int().min(0).default(0),
    silver: z.number().int().min(0).default(0),
    copper: z.number().int().min(0).default(0),
  }),
  
  // Status Effects
  conditions: z.array(ConditionSchema),
  buffs: z.array(BuffSchema),
  
  // Resources (class-specific)
  resources: z.record(ResourceSchema).optional(),
  
  // Character Details
  background: z.string().optional(),
  personality: z.string().optional(),
  appearance: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;
export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type HitPoints = z.infer<typeof HitPointsSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Feat = z.infer<typeof FeatSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Buff = z.infer<typeof BuffSchema>;
export type SavingThrows = z.infer<typeof SavingThrowsSchema>;
export type AttackBonus = z.infer<typeof AttackBonusSchema>;
export type Resource = z.infer<typeof ResourceSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total skill modifier
 */
export function calculateSkillModifier(
  skill: Skill,
  abilityScore: number
): number {
  const abilityMod = getAbilityModifier(abilityScore);
  return skill.ranks + abilityMod + (skill.isClassSkill && skill.ranks > 0 ? 3 : 0);
}

/**
 * Validate character sheet
 */
export function validateCharacterSheet(data: unknown): {
  success: boolean;
  data?: CharacterSheet;
  errors?: z.ZodError;
} {
  const result = CharacterSheetSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Create a blank character sheet template
 */
export function createBlankCharacterSheet(
  name: string,
  playerId: string
): CharacterSheet {
  return {
    // Metadata
    id: uuidv4(),
    version: 1,
    lastModified: new Date().toISOString(),
    lastModifiedBy: playerId,
    confirmedBy: [playerId],
    
    // Basic Info
    name,
    race: 'Human',
    class: 'Fighter',
    level: 1,
    alignment: 'True Neutral',
    size: 'Medium',
    
    // Abilities (standard array)
    abilities: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    
    // Combat Stats
    hp: {
      current: 10,
      max: 10,
      temporary: 0,
    },
    ac: {
      total: 12,
      flatFooted: 10,
      touch: 12,
      breakdown: '10 base + 2 dex',
    },
    initiative: 2,
    speed: {
      base: 30,
      current: 30,
    },
    
    // Attack & Defense
    baseAttackBonus: 1,
    attackBonuses: {
      melee: { base: 1, modifier: 2, total: 3 },
      ranged: { base: 1, modifier: 2, total: 3 },
    },
    savingThrows: {
      fortitude: { base: 2, modifier: 1, total: 3 },
      reflex: { base: 0, modifier: 2, total: 2 },
      will: { base: 0, modifier: 0, total: 0 },
    },
    
    // Skills, Feats, Spells
    skills: [],
    feats: [],
    spells: [],
    
    // Equipment
    equipment: [],
    inventory: [],
    wealth: {
      platinum: 0,
      gold: 100,
      silver: 0,
      copper: 0,
    },
    
    // Status
    conditions: [],
    buffs: [],
  };
}