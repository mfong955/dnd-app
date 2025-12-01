/**
 * Character Sheet Markdown Utilities
 * 
 * Convert character sheets to/from human-readable markdown
 */

import { CharacterSheet } from '../schemas/character-sheet';

// ============================================================================
// Character Sheet to Markdown
// ============================================================================

export function characterToMarkdown(character: CharacterSheet): string {
  const ac = (character.ac as any).total || character.ac;
  const speed = (character.speed as any).base || character.speed;
  
  return `# ${character.name}

## Basic Information

- **Race**: ${character.race}
- **Class**: ${character.class}
- **Level**: ${character.level}
- **Alignment**: ${character.alignment}
- **Size**: ${character.size}
${character.deity ? `- **Deity**: ${character.deity}` : ''}

## Ability Scores

| Ability | Score | Modifier |
|---------|-------|----------|
| Strength | ${character.abilities.strength} | ${getModifier(character.abilities.strength)} |
| Dexterity | ${character.abilities.dexterity} | ${getModifier(character.abilities.dexterity)} |
| Constitution | ${character.abilities.constitution} | ${getModifier(character.abilities.constitution)} |
| Intelligence | ${character.abilities.intelligence} | ${getModifier(character.abilities.intelligence)} |
| Wisdom | ${character.abilities.wisdom} | ${getModifier(character.abilities.wisdom)} |
| Charisma | ${character.abilities.charisma} | ${getModifier(character.abilities.charisma)} |

## Combat Statistics

- **Hit Points**: ${character.hp.current}/${character.hp.max}${character.hp.temporary > 0 ? ` (+${character.hp.temporary} temp)` : ''}
- **Armor Class**: ${ac}${(character.ac as any).breakdown ? ` (${(character.ac as any).breakdown})` : ''}
- **Initiative**: ${character.initiative > 0 ? '+' : ''}${character.initiative}
- **Speed**: ${speed} ft
- **Base Attack Bonus**: ${(character as any).baseAttackBonus > 0 ? '+' : ''}${(character as any).baseAttackBonus}

### Attack Bonuses

- **Melee**: ${(character as any).attackBonuses?.melee?.total > 0 ? '+' : ''}${(character as any).attackBonuses?.melee?.total || 0}
- **Ranged**: ${(character as any).attackBonuses?.ranged?.total > 0 ? '+' : ''}${(character as any).attackBonuses?.ranged?.total || 0}

### Saving Throws

- **Fortitude**: ${(character as any).savingThrows?.fortitude?.total > 0 ? '+' : ''}${(character as any).savingThrows?.fortitude?.total || 0}
- **Reflex**: ${(character as any).savingThrows?.reflex?.total > 0 ? '+' : ''}${(character as any).savingThrows?.reflex?.total || 0}
- **Will**: ${(character as any).savingThrows?.will?.total > 0 ? '+' : ''}${(character as any).savingThrows?.will?.total || 0}

## Skills

${character.skills.length > 0 ? character.skills.map(skill => 
  `- **${skill.name}**: ${skill.modifier > 0 ? '+' : ''}${skill.modifier} (${skill.ranks} ranks${skill.isClassSkill ? ', class skill' : ''})`
).join('\n') : '*No skills*'}

## Feats

${character.feats.length > 0 ? character.feats.map(feat => 
  `### ${feat.name}\n\n${feat.description}\n\n**Benefit**: ${(feat as any).benefit || feat.description}${feat.prerequisites ? `\n\n**Prerequisites**: ${feat.prerequisites.join(', ')}` : ''}`
).join('\n\n') : '*No feats*'}

## Spells

${character.spells && character.spells.length > 0 ? formatSpells(character.spells, character.spellsPerDay) : '*No spells*'}

## Equipment

### Equipped

${character.equipment.filter(item => item.equipped).map(item => 
  `- **${item.name}** (${item.type}): ${item.description}${item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}`
).join('\n') || '*Nothing equipped*'}

### Inventory

${character.inventory.map(item => 
  `- **${item.name}** (${item.type}): ${item.description}${item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}`
).join('\n') || '*Empty*'}

### Wealth

- **Platinum**: ${character.wealth?.platinum || 0} pp
- **Gold**: ${character.wealth?.gold || 0} gp
- **Silver**: ${character.wealth?.silver || 0} sp
- **Copper**: ${character.wealth?.copper || 0} cp

## Status Effects

### Conditions

${character.conditions.length > 0 ? character.conditions.map(condition => 
  `- **${condition.name}**: ${condition.description}${condition.duration ? ` (${condition.duration})` : ''}${condition.source ? ` [${condition.source}]` : ''}`
).join('\n') : '*None*'}

### Buffs

${character.buffs.length > 0 ? character.buffs.map(buff => 
  `- **${buff.name}**: ${buff.description} (${buff.modifier > 0 ? '+' : ''}${buff.modifier} to ${buff.target})${buff.duration ? ` [${buff.duration}]` : ''}`
).join('\n') : '*None*'}

## Resources

${character.resources && Object.keys(character.resources).length > 0 ? 
  Object.entries(character.resources).map(([name, resource]) => 
    `- **${name}**: ${resource.current}/${resource.max}`
  ).join('\n') : '*None*'}

## Background

${character.background || '*No background*'}

## Personality

${character.personality || '*No personality description*'}

## Notes

${character.notes || '*No notes*'}
`;
}

function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function formatSpells(spells: any[], spellsPerDay?: Record<string, number>): string {
  const spellsByLevel: Record<number, any[]> = {};
  
  for (const spell of spells) {
    if (!spellsByLevel[spell.level]) {
      spellsByLevel[spell.level] = [];
    }
    spellsByLevel[spell.level].push(spell);
  }
  
  let output = '';
  
  for (const [level, levelSpells] of Object.entries(spellsByLevel).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    const levelNum = parseInt(level);
    const levelName = levelNum === 0 ? 'Cantrips' : `Level ${levelNum}`;
    const perDay = spellsPerDay?.[level];
    
    output += `### ${levelName}${perDay ? ` (${perDay} per day)` : ''}\n\n`;
    
    for (const spell of levelSpells) {
      output += `#### ${spell.name}${spell.prepared ? ' ✓' : ''}${spell.used ? ' (used)' : ''}\n\n`;
      output += `- **School**: ${spell.school}\n`;
      output += `- **Casting Time**: ${spell.castingTime}\n`;
      output += `- **Range**: ${spell.range}\n`;
      output += `- **Duration**: ${spell.duration}\n`;
      if (spell.savingThrow) output += `- **Saving Throw**: ${spell.savingThrow}\n`;
      if (spell.spellResistance !== undefined) output += `- **Spell Resistance**: ${spell.spellResistance ? 'Yes' : 'No'}\n`;
      output += `\n${spell.description}\n\n`;
    }
  }
  
  return output;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  characterToMarkdown,
};