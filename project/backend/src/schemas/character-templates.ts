/**
 * Pre-made Character Templates
 * 
 * Ready-to-use character sheets for quick game start
 */

import { CharacterSheet } from './character-sheet';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Character Templates
// ============================================================================

export interface CharacterTemplate {
  name: string;
  description: string;
  level: number;
  createCharacter: (playerId: string, customName?: string) => CharacterSheet;
}

// ============================================================================
// Fighter Template
// ============================================================================

export const FighterTemplate: CharacterTemplate = {
  name: 'Fighter',
  description: 'A skilled warrior with heavy armor and powerful melee attacks',
  level: 3,
  createCharacter: (playerId: string, customName?: string): CharacterSheet => ({
    // Metadata
    id: uuidv4(),
    version: 1,
    lastModified: new Date().toISOString(),
    lastModifiedBy: playerId,
    confirmedBy: [playerId],
    
    // Basic Info
    name: customName || 'Thorin Ironshield',
    race: 'Human',
    class: 'Fighter',
    level: 3,
    alignment: 'Lawful Good',
    size: 'Medium',
    
    // Abilities (Fighter focus: STR, CON)
    abilities: {
      strength: 16,      // +3 modifier
      dexterity: 14,     // +2 modifier
      constitution: 14,  // +2 modifier
      intelligence: 10,  // +0 modifier
      wisdom: 12,        // +1 modifier
      charisma: 8,       // -1 modifier
    },
    
    // Combat Stats
    hp: {
      current: 28,  // 10 + 6 + 6 + 6 (d10 HD)
      max: 28,
      temporary: 0,
    },
    ac: {
      total: 18,        // 10 + 6 (chainmail) + 2 (dex)
      flatFooted: 16,
      touch: 12,
      breakdown: '10 base + 6 armor + 2 dex',
    },
    initiative: 2,  // Dex modifier
    speed: {
      base: 30,
      current: 30,
    },
    
    // Attack & Defense
    baseAttackBonus: 3,
    attackBonuses: {
      melee: { base: 3, modifier: 3, total: 6 },    // BAB + STR
      ranged: { base: 3, modifier: 2, total: 5 },   // BAB + DEX
    },
    savingThrows: {
      fortitude: { base: 3, modifier: 2, total: 5 },  // Good + CON
      reflex: { base: 1, modifier: 2, total: 3 },     // Poor + DEX
      will: { base: 1, modifier: 1, total: 2 },       // Poor + WIS
    },
    
    // Skills (Fighter gets 2 + INT per level)
    skills: [
      { name: 'Climb', ranks: 3, modifier: 6, isClassSkill: true, abilityModifier: 'str' },
      { name: 'Intimidate', ranks: 3, modifier: 2, isClassSkill: true, abilityModifier: 'cha' },
      { name: 'Jump', ranks: 2, modifier: 5, isClassSkill: true, abilityModifier: 'str' },
    ],
    
    // Feats
    feats: [
      { name: 'Power Attack', description: 'Trade attack bonus for damage', benefit: 'Take penalty on attack rolls to gain bonus on damage', prerequisites: ['STR 13+'] },
      { name: 'Cleave', description: 'Extra attack after dropping foe', benefit: 'If you drop a foe, make immediate attack on adjacent enemy', prerequisites: ['Power Attack'] },
      { name: 'Weapon Focus (Longsword)', description: '+1 to attack with longswords', benefit: '+1 bonus on attack rolls with longswords' },
    ],
    
    spells: [],
    
    // Equipment
    equipment: [
      { id: uuidv4(), name: 'Longsword', type: 'weapon', weight: 4, value: 15, description: '1d8 damage, 19-20/x2 crit', equipped: true, quantity: 1, properties: { damage: '1d8', critical: '19-20/x2' } },
      { id: uuidv4(), name: 'Chainmail', type: 'armor', weight: 40, value: 150, description: '+6 AC, max dex +2', equipped: true, quantity: 1, properties: { acBonus: 6, maxDex: 2 } },
      { id: uuidv4(), name: 'Heavy Steel Shield', type: 'shield', weight: 15, value: 20, description: '+2 AC', equipped: true, quantity: 1, properties: { acBonus: 2 } },
    ],
    
    inventory: [
      { id: uuidv4(), name: 'Potion of Cure Light Wounds', type: 'potion', weight: 0.1, value: 50, description: 'Heals 1d8+1 HP', quantity: 2 },
      { id: uuidv4(), name: 'Rope (50 ft)', type: 'gear', weight: 10, value: 1, description: 'Hemp rope', quantity: 1 },
    ],
    
    wealth: {
      platinum: 0,
      gold: 45,
      silver: 8,
      copper: 20,
    },
    
    // Status
    conditions: [],
    buffs: [],
    
    resources: {},
    
    background: 'A veteran soldier who has seen many battles.',
    personality: 'Brave, loyal, and protective of allies.',
  }),
};

// ============================================================================
// Wizard Template
// ============================================================================

export const WizardTemplate: CharacterTemplate = {
  name: 'Wizard',
  description: 'A scholarly spellcaster with powerful arcane magic',
  level: 3,
  createCharacter: (playerId: string, customName?: string): CharacterSheet => ({
    // Metadata
    id: uuidv4(),
    version: 1,
    lastModified: new Date().toISOString(),
    lastModifiedBy: playerId,
    confirmedBy: [playerId],
    
    // Basic Info
    name: customName || 'Elara Moonwhisper',
    race: 'Elf',
    class: 'Wizard',
    level: 3,
    alignment: 'Neutral Good',
    size: 'Medium',
    
    // Abilities (Wizard focus: INT, DEX)
    abilities: {
      strength: 8,       // -1 modifier
      dexterity: 14,     // +2 modifier
      constitution: 12,  // +1 modifier
      intelligence: 18,  // +4 modifier
      wisdom: 13,        // +1 modifier
      charisma: 10,      // +0 modifier
    },
    
    // Combat Stats
    hp: {
      current: 13,  // 4 + 3 + 3 + 3 (d4 HD + CON)
      max: 13,
      temporary: 0,
    },
    ac: {
      total: 12,        // 10 + 2 (dex)
      flatFooted: 10,
      touch: 12,
      breakdown: '10 base + 2 dex',
    },
    initiative: 2,  // Dex modifier
    speed: {
      base: 30,
      current: 30,
    },
    
    // Attack & Defense
    baseAttackBonus: 1,
    attackBonuses: {
      melee: { base: 1, modifier: -1, total: 0 },   // BAB + STR
      ranged: { base: 1, modifier: 2, total: 3 },   // BAB + DEX
    },
    savingThrows: {
      fortitude: { base: 1, modifier: 1, total: 2 },  // Poor + CON
      reflex: { base: 1, modifier: 2, total: 3 },     // Poor + DEX
      will: { base: 3, modifier: 1, total: 4 },       // Good + WIS
    },
    
    // Skills (Wizard gets 2 + INT per level)
    skills: [
      { name: 'Concentration', ranks: 6, modifier: 7, isClassSkill: true, abilityModifier: 'con' },
      { name: 'Knowledge (Arcana)', ranks: 6, modifier: 10, isClassSkill: true, abilityModifier: 'int' },
      { name: 'Spellcraft', ranks: 6, modifier: 10, isClassSkill: true, abilityModifier: 'int' },
    ],
    
    // Feats
    feats: [
      { name: 'Scribe Scroll', description: 'Create magic scrolls', benefit: 'Can create scrolls of known spells' },
      { name: 'Spell Focus (Evocation)', description: '+1 DC for evocation spells', benefit: '+1 to save DC of evocation spells' },
    ],
    
    // Spells
    spells: [
      // Cantrips (0-level)
      { name: 'Detect Magic', level: 0, school: 'Divination', castingTime: '1 standard action', range: '60 ft', duration: 'Concentration', description: 'Detect magical auras', prepared: true },
      { name: 'Ray of Frost', level: 0, school: 'Evocation', castingTime: '1 standard action', range: 'Close', duration: 'Instantaneous', description: '1d3 cold damage', prepared: true },
      { name: 'Read Magic', level: 0, school: 'Divination', castingTime: '1 standard action', range: 'Personal', duration: '10 min/level', description: 'Read magical writings', prepared: true },
      
      // 1st level
      { name: 'Magic Missile', level: 1, school: 'Evocation', castingTime: '1 standard action', range: 'Medium', duration: 'Instantaneous', description: '1d4+1 force damage per missile', prepared: true, used: false },
      { name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 immediate action', range: 'Personal', duration: '1 min/level', description: '+4 AC, blocks magic missiles', prepared: true, used: false },
      
      // 2nd level
      { name: 'Scorching Ray', level: 2, school: 'Evocation', castingTime: '1 standard action', range: 'Close', duration: 'Instantaneous', description: '4d6 fire damage per ray', prepared: true, used: false },
    ],
    
    spellsPerDay: {
      '0': 4,  // Cantrips
      '1': 3,  // 2 base + 1 bonus
      '2': 2,  // 1 base + 1 bonus
    },
    
    // Equipment
    equipment: [
      { id: uuidv4(), name: 'Quarterstaff', type: 'weapon', weight: 4, value: 0, description: '1d6 damage', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Spellbook', type: 'gear', weight: 3, value: 15, description: 'Contains all prepared spells', equipped: true, quantity: 1 },
    ],
    
    inventory: [
      { id: uuidv4(), name: 'Scroll of Fireball', type: 'scroll', weight: 0.1, value: 375, description: '3rd level spell', quantity: 1 },
      { id: uuidv4(), name: 'Wand of Magic Missile (20 charges)', type: 'wand', weight: 0.1, value: 300, description: 'CL 1, 1 missile', quantity: 1 },
    ],
    
    wealth: {
      platinum: 0,
      gold: 120,
      silver: 5,
      copper: 0,
    },
    
    // Status
    conditions: [],
    buffs: [],
    
    resources: {
      'Spell Slots (1st)': { current: 3, max: 3 },
      'Spell Slots (2nd)': { current: 2, max: 2 },
    },
    
    background: 'A scholar of the arcane arts from the Mage Academy.',
    personality: 'Curious, analytical, and cautious in combat.',
  }),
};

// ============================================================================
// Rogue Template
// ============================================================================

export const RogueTemplate: CharacterTemplate = {
  name: 'Rogue',
  description: 'A cunning scout with deadly sneak attacks',
  level: 3,
  createCharacter: (playerId: string, customName?: string): CharacterSheet => ({
    // Metadata
    id: uuidv4(),
    version: 1,
    lastModified: new Date().toISOString(),
    lastModifiedBy: playerId,
    confirmedBy: [playerId],
    
    // Basic Info
    name: customName || 'Shade Nightblade',
    race: 'Halfling',
    class: 'Rogue',
    level: 3,
    alignment: 'Chaotic Neutral',
    size: 'Small',
    
    // Abilities (Rogue focus: DEX, INT)
    abilities: {
      strength: 10,      // +0 modifier
      dexterity: 18,     // +4 modifier
      constitution: 12,  // +1 modifier
      intelligence: 14,  // +2 modifier
      wisdom: 13,        // +1 modifier
      charisma: 10,      // +0 modifier
    },
    
    // Combat Stats
    hp: {
      current: 16,  // 6 + 4 + 4 + 2 (d6 HD + CON)
      max: 16,
      temporary: 0,
    },
    ac: {
      total: 17,        // 10 + 1 (size) + 4 (dex) + 2 (leather)
      flatFooted: 13,
      touch: 15,
      breakdown: '10 base + 1 size + 4 dex + 2 armor',
    },
    initiative: 4,  // Dex modifier
    speed: {
      base: 20,  // Small size
      current: 20,
    },
    
    // Attack & Defense
    baseAttackBonus: 2,
    attackBonuses: {
      melee: { base: 2, modifier: 4, total: 6 },    // BAB + DEX (finesse)
      ranged: { base: 2, modifier: 4, total: 6 },   // BAB + DEX
    },
    savingThrows: {
      fortitude: { base: 1, modifier: 1, total: 2 },  // Poor + CON
      reflex: { base: 3, modifier: 4, total: 7 },     // Good + DEX
      will: { base: 1, modifier: 1, total: 2 },       // Poor + WIS
    },
    
    // Skills (Rogue gets 8 + INT per level)
    skills: [
      { name: 'Hide', ranks: 6, modifier: 14, isClassSkill: true, abilityModifier: 'dex' },
      { name: 'Move Silently', ranks: 6, modifier: 10, isClassSkill: true, abilityModifier: 'dex' },
      { name: 'Search', ranks: 6, modifier: 8, isClassSkill: true, abilityModifier: 'int' },
      { name: 'Disable Device', ranks: 6, modifier: 8, isClassSkill: true, abilityModifier: 'int' },
      { name: 'Open Lock', ranks: 6, modifier: 10, isClassSkill: true, abilityModifier: 'dex' },
      { name: 'Tumble', ranks: 6, modifier: 10, isClassSkill: true, abilityModifier: 'dex' },
    ],
    
    // Feats
    feats: [
      { name: 'Weapon Finesse', description: 'Use DEX for melee attacks', benefit: 'Use Dex modifier instead of Str for attack rolls with light weapons' },
      { name: 'Dodge', description: '+1 AC vs one opponent', benefit: '+1 dodge bonus to AC against designated opponent' },
    ],
    
    spells: [],
    
    // Equipment
    equipment: [
      { id: uuidv4(), name: 'Short Sword', type: 'weapon', weight: 2, value: 10, description: '1d6 damage, 19-20/x2 crit', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Hand Crossbow', type: 'weapon', weight: 2, value: 100, description: '1d4 damage, 19-20/x2 crit, 30 ft range', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Leather Armor', type: 'armor', weight: 15, value: 10, description: '+2 AC', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Thieves\' Tools', type: 'tool', weight: 1, value: 30, description: '+2 to Disable Device and Open Lock', equipped: true, quantity: 1 },
    ],
    
    inventory: [
      { id: uuidv4(), name: 'Crossbow Bolts', type: 'gear', weight: 0.1, value: 0.1, description: 'Ammunition', quantity: 20 },
      { id: uuidv4(), name: 'Potion of Invisibility', type: 'potion', weight: 0.1, value: 300, description: 'Invisible for 3 minutes', quantity: 1 },
    ],
    
    wealth: {
      platinum: 0,
      gold: 85,
      silver: 12,
      copper: 5,
    },
    
    // Status
    conditions: [],
    buffs: [],
    
    resources: {
      'Sneak Attack': { current: 2, max: 2 },  // 2d6 sneak attack damage
    },
    
    background: 'A street-smart thief from the city\'s underbelly.',
    personality: 'Quick-witted, opportunistic, and always looking for an advantage.',
  }),
};

// ============================================================================
// Cleric Template
// ============================================================================

export const ClericTemplate: CharacterTemplate = {
  name: 'Cleric',
  description: 'A divine spellcaster who heals allies and smites foes',
  level: 3,
  createCharacter: (playerId: string, customName?: string): CharacterSheet => ({
    // Metadata
    id: uuidv4(),
    version: 1,
    lastModified: new Date().toISOString(),
    lastModifiedBy: playerId,
    confirmedBy: [playerId],
    
    // Basic Info
    name: customName || 'Brother Aldric',
    race: 'Human',
    class: 'Cleric',
    level: 3,
    alignment: 'Lawful Good',
    deity: 'Pelor (God of Sun)',
    size: 'Medium',
    
    // Abilities (Cleric focus: WIS, STR)
    abilities: {
      strength: 14,      // +2 modifier
      dexterity: 10,     // +0 modifier
      constitution: 14,  // +2 modifier
      intelligence: 10,  // +0 modifier
      wisdom: 16,        // +3 modifier
      charisma: 12,      // +1 modifier
    },
    
    // Combat Stats
    hp: {
      current: 22,  // 8 + 6 + 6 + 2 (d8 HD + CON)
      max: 22,
      temporary: 0,
    },
    ac: {
      total: 17,        // 10 + 5 (scale mail) + 2 (heavy shield)
      flatFooted: 17,
      touch: 10,
      breakdown: '10 base + 5 armor + 2 shield',
    },
    initiative: 0,  // Dex modifier
    speed: {
      base: 20,  // Medium armor
      current: 20,
    },
    
    // Attack & Defense
    baseAttackBonus: 2,
    attackBonuses: {
      melee: { base: 2, modifier: 2, total: 4 },    // BAB + STR
      ranged: { base: 2, modifier: 0, total: 2 },   // BAB + DEX
    },
    savingThrows: {
      fortitude: { base: 3, modifier: 2, total: 5 },  // Good + CON
      reflex: { base: 1, modifier: 0, total: 1 },     // Poor + DEX
      will: { base: 3, modifier: 3, total: 6 },       // Good + WIS
    },
    
    // Skills (Cleric gets 2 + INT per level)
    skills: [
      { name: 'Concentration', ranks: 6, modifier: 8, isClassSkill: true, abilityModifier: 'con' },
      { name: 'Heal', ranks: 6, modifier: 9, isClassSkill: true, abilityModifier: 'wis' },
      { name: 'Knowledge (Religion)', ranks: 3, modifier: 3, isClassSkill: true, abilityModifier: 'int' },
    ],
    
    // Feats
    feats: [
      { name: 'Combat Casting', description: '+4 to Concentration checks in combat', benefit: '+4 bonus on Concentration checks to cast defensively' },
      { name: 'Extra Turning', description: 'Turn undead 4 more times per day', benefit: '+4 uses of turn undead per day' },
    ],
    
    // Spells
    spells: [
      // Orisons (0-level)
      { name: 'Cure Minor Wounds', level: 0, school: 'Conjuration', castingTime: '1 standard action', range: 'Touch', duration: 'Instantaneous', description: 'Heal 1 HP', prepared: true },
      { name: 'Detect Magic', level: 0, school: 'Divination', castingTime: '1 standard action', range: '60 ft', duration: 'Concentration', description: 'Detect magical auras', prepared: true },
      { name: 'Light', level: 0, school: 'Evocation', castingTime: '1 standard action', range: 'Touch', duration: '10 min/level', description: 'Create light', prepared: true },
      
      // 1st level
      { name: 'Cure Light Wounds', level: 1, school: 'Conjuration', castingTime: '1 standard action', range: 'Touch', duration: 'Instantaneous', description: 'Heal 1d8+3 HP', prepared: true, used: false },
      { name: 'Bless', level: 1, school: 'Enchantment', castingTime: '1 standard action', range: '50 ft', duration: '1 min/level', description: '+1 attack and saves vs fear', prepared: true, used: false },
      { name: 'Shield of Faith', level: 1, school: 'Abjuration', castingTime: '1 standard action', range: 'Touch', duration: '1 min/level', description: '+2 deflection bonus to AC', prepared: true, used: false },
      
      // 2nd level
      { name: 'Cure Moderate Wounds', level: 2, school: 'Conjuration', castingTime: '1 standard action', range: 'Touch', duration: 'Instantaneous', description: 'Heal 2d8+3 HP', prepared: true, used: false },
      { name: 'Spiritual Weapon', level: 2, school: 'Evocation', castingTime: '1 standard action', range: 'Medium', duration: '1 round/level', description: 'Magic weapon attacks foes', prepared: true, used: false },
    ],
    
    spellsPerDay: {
      '0': 4,  // Orisons
      '1': 4,  // 2 base + 1 domain + 1 bonus
      '2': 3,  // 1 base + 1 domain + 1 bonus
    },
    
    // Equipment
    equipment: [
      { id: uuidv4(), name: 'Heavy Mace', type: 'weapon', weight: 8, value: 12, description: '1d8 damage', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Scale Mail', type: 'armor', weight: 30, value: 50, description: '+5 AC', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Heavy Wooden Shield', type: 'shield', weight: 10, value: 7, description: '+2 AC', equipped: true, quantity: 1 },
      { id: uuidv4(), name: 'Holy Symbol (Silver)', type: 'gear', weight: 1, value: 25, description: 'Focus for divine spells', equipped: true, quantity: 1 },
    ],
    
    inventory: [
      { id: uuidv4(), name: 'Potion of Cure Moderate Wounds', type: 'potion', weight: 0.1, value: 300, description: 'Heals 2d8+3 HP', quantity: 2 },
    ],
    
    wealth: {
      platinum: 0,
      gold: 65,
      silver: 15,
      copper: 0,
    },
    
    // Status
    conditions: [],
    buffs: [],
    
    resources: {
      'Turn Undead': { current: 7, max: 7 },  // 3 + CHA modifier + Extra Turning
      'Spell Slots (1st)': { current: 4, max: 4 },
      'Spell Slots (2nd)': { current: 3, max: 3 },
    },
    
    background: 'A devoted priest who serves the god of sun and healing.',
    personality: 'Compassionate, righteous, and protective of the innocent.',
  }),
};

// ============================================================================
// Template Registry
// ============================================================================

export const CHARACTER_TEMPLATES: Record<string, CharacterTemplate> = {
  fighter: FighterTemplate,
  wizard: WizardTemplate,
  rogue: RogueTemplate,
  cleric: ClericTemplate,
};

export function getTemplate(className: string): CharacterTemplate | undefined {
  return CHARACTER_TEMPLATES[className.toLowerCase()];
}

export function listTemplates(): CharacterTemplate[] {
  return Object.values(CHARACTER_TEMPLATES);
}