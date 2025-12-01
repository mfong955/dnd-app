# DnD App Backend - API Documentation

## Agent Communication Contracts

This document defines the contracts between agents in the DnD app backend.

---

## Table of Contents

1. [Coordinator Agent](#coordinator-agent)
2. [DM Agent](#dm-agent)
3. [Rules Engine](#rules-engine)
4. [Player Agent](#player-agent)
5. [Persistence Agent](#persistence-agent)
6. [Message Formats](#message-formats)

---

## Coordinator Agent

**Role**: Orchestrator and session manager

### Methods

#### `initializeSession(dmMode, dmPlayerId?, sessionName?): Promise<SessionState>`

Creates a new game session.

**Parameters:**
- `dmMode`: `'ai' | 'human'` - Type of DM
- `dmPlayerId?`: `string` - Player ID if human DM
- `sessionName?`: `string` - Optional session name

**Returns:** `SessionState` object

**Example:**
```typescript
const session = await coordinator.initializeSession('ai', undefined, 'Epic Quest');
```

#### `loadSession(sessionState): Promise<void>`

Loads an existing session.

**Parameters:**
- `sessionState`: `SessionState` - Previously saved session

#### `getSessionState(): SessionState`

Returns current session state.

#### `updateSessionState(updates): void`

Updates session state with partial updates.

**Parameters:**
- `updates`: `Partial<SessionState>` - Fields to update

#### `checkPermission(playerId, requiredLevel): boolean`

Checks if player has required permission level.

**Parameters:**
- `playerId`: `string`
- `requiredLevel`: `PermissionLevel`

**Returns:** `boolean`

#### `routePlayerAction(playerId, actionText): Promise<AgentResponse>`

Routes player action to appropriate agents.

**Parameters:**
- `playerId`: `string`
- `actionText`: `string` - Player's action description

**Returns:** `AgentResponse` with narrative and machine data

#### `requestConfirmation(confirmationId, targetPlayerIds, proposal): Promise<void>`

Requests confirmation from players.

#### `recordConfirmation(confirmationId, playerId, approved): Promise<boolean>`

Records player's confirmation response.

**Returns:** `true` if all confirmations received

---

## DM Agent

**Role**: Dungeon Master and narrative generator

### Methods

#### `interpretAction(playerId, actionText, context): Promise<{interpretation, narrative}>`

Interprets player action intent.

**Parameters:**
- `playerId`: `string`
- `actionText`: `string`
- `context`: Object with `playerName`, `currentScene`, `gamePhase`

**Returns:**
```typescript
{
  interpretation: ActionInterpretation,
  narrative: string
}
```

**Example:**
```typescript
const result = await dmAgent.interpretAction('player1', 'I attack the goblin', {
  playerName: 'Thorin',
  currentScene: 'Forest clearing',
  gamePhase: 'combat'
});
```

#### `generateSceneNarrative(sceneDescription, context): Promise<string>`

Generates immersive scene description.

**Parameters:**
- `sceneDescription`: `string`
- `context`: Object with `playerNames`, `previousEvents?`

**Returns:** Narrative string (2-3 paragraphs, <300 words)

#### `suggestActions(playerId, context): Promise<Action[]>`

Suggests 3-5 prioritized actions for player.

**Parameters:**
- `playerId`: `string`
- `context`: Object with player and scene info

**Returns:** Array of `Action` objects

#### `generateCombatNarrative(actorName, actionType, targetName, result): Promise<string>`

Generates exciting combat description.

**Parameters:**
- `actorName`: `string`
- `actionType`: `string`
- `targetName`: `string`
- `result`: Object with `success`, `damage?`, `effect?`

**Returns:** 1-2 sentence combat narrative

---

## Rules Engine

**Role**: D&D 3.5e mechanical arbiter

### Methods

#### `rollD20(modifiers?): RollResult`

Rolls d20 with modifiers.

**Parameters:**
- `modifiers?`: `number[]` - Array of modifiers to add

**Returns:**
```typescript
{
  d20: number,
  modifiers: number[],
  total: number,
  criticalHit?: boolean,
  criticalMiss?: boolean
}
```

#### `rollDice(count, sides, modifier?): number`

Rolls multiple dice (e.g., 2d6+3).

**Parameters:**
- `count`: `number` - Number of dice
- `sides`: `number` - Sides per die
- `modifier?`: `number` - Flat modifier

**Returns:** Total roll result

#### `getAbilityModifier(abilityScore): number`

Calculates ability modifier from score.

**Formula:** `floor((score - 10) / 2)`

#### `resolveAttack(attackBonus, targetAC, additionalModifiers?): RulesResolution`

Resolves attack roll.

**Parameters:**
- `attackBonus`: `number`
- `targetAC`: `number`
- `additionalModifiers?`: `number[]`

**Returns:** `RulesResolution` with success, roll, and notes

#### `resolveDamage(diceCount, diceSides, damageModifier?, isCritical?): number`

Rolls damage dice.

**Parameters:**
- `diceCount`: `number`
- `diceSides`: `number`
- `damageModifier?`: `number`
- `isCritical?`: `boolean` - Doubles dice (not modifier)

**Returns:** Total damage

#### `resolveSavingThrow(saveBonus, dc, additionalModifiers?): RulesResolution`

Resolves saving throw.

#### `resolveSkillCheck(skillBonus, dc, additionalModifiers?): RulesResolution`

Resolves skill check.

#### `resolveInitiative(initiativeModifier): number`

Rolls initiative.

#### `calculateAttackBonus(baseAttackBonus, abilityModifier, otherModifiers?): number`

Calculates total attack bonus.

#### `calculateAC(baseAC, dexModifier, armorBonus?, shieldBonus?, otherModifiers?): {total, flatFooted, touch}`

Calculates armor class values.

#### `validateAction(actionType, context): {valid, reason?}`

Validates if action is legal.

**Parameters:**
- `actionType`: `string`
- `context`: Object with available actions/movement

#### `applyDamage(currentHP, maxHP, damage): {newHP, status, statusChanges}`

Applies damage and determines status.

**Status values:** `'healthy' | 'wounded' | 'disabled' | 'dying' | 'dead'`

#### `applyHealing(currentHP, maxHP, healing): {newHP, overheal}`

Applies healing.

#### `threatsCritical(d20Roll, criticalRange?): boolean`

Checks if roll threatens critical (default range: 20).

#### `confirmCritical(attackBonus, targetAC, additionalModifiers?): boolean`

Confirms critical hit with second roll.

#### `calculateSkillModifier(ranks, abilityModifier, isClassSkill, otherModifiers?): number`

Calculates skill modifier (includes +3 class skill bonus).

#### `getSpellDC(spellLevel, casterAbilityModifier): number`

Calculates spell save DC.

**Formula:** `10 + spellLevel + abilityModifier`

---

## Player Agent

**Role**: Character sheet manager

### Methods

#### `loadCharacter(characterSheet): Promise<void>`

Loads character sheet.

#### `createCharacter(name): Promise<CharacterSheet>`

Creates new blank character.

#### `getCharacter(): CharacterSheet`

Returns current character sheet.

#### `proposeEdit(fieldChanges, requiredConfirmations, summary): CharacterEditProposal`

Proposes character sheet edit.

**Parameters:**
- `fieldChanges`: `FieldChange[]` - Array of field changes
- `requiredConfirmations`: `string[]` - Player IDs who must confirm
- `summary`: `string` - Description of changes

**Returns:** `CharacterEditProposal`

#### `applyEdit(proposal): CharacterSheet`

Applies approved edit to character sheet.

**Throws:** Error if edit would create invalid sheet

#### `updateHP(delta, reason): CharacterEditProposal`

Proposes HP change.

**Parameters:**
- `delta`: `number` - HP change (negative for damage)
- `reason`: `string` - Why HP changed

#### `updateResource(resourceName, delta, reason): CharacterEditProposal`

Proposes resource change (spell slots, etc.).

#### `addCondition(name, description, duration?, source?): CharacterEditProposal`

Proposes adding condition.

#### `removeCondition(conditionName): CharacterEditProposal`

Proposes removing condition.

#### `getSummary(): {name, class, level, hp, ac, conditions}`

Returns character summary.

#### `validateIntegrity(): {valid, errors}`

Validates character sheet integrity.

---

## Persistence Agent

**Role**: File I/O manager

### Methods

#### `readFile(request): Promise<ReadResponse>`

Reads file from disk.

**Parameters:**
- `request`: `ReadRequest` with `path`

**Returns:**
```typescript
{
  success: boolean,
  content?: any,
  metadata?: FileMetadata,
  error?: string
}
```

#### `writeFile(request): Promise<WriteResponse>`

Writes file with optimistic locking.

**Parameters:**
- `request`: `WriteRequest` with `path`, `expectedVersion`, `content`, `modifiedBy`

**Returns:**
```typescript
{
  success: boolean,
  newVersion?: number,
  conflict?: {
    expectedVersion: number,
    actualVersion: number,
    lastModifiedBy: string
  },
  error?: string
}
```

**Optimistic Locking:**
- Checks current version matches `expectedVersion`
- Returns conflict if versions don't match
- Increments version on successful write

#### `writeMarkdown(filePath, content, metadata): Promise<WriteResponse>`

Writes markdown file with YAML frontmatter.

#### `readMarkdown(filePath): Promise<ReadResponse>`

Reads markdown file and parses frontmatter.

#### `listFiles(directoryPath): Promise<string[]>`

Lists files in directory.

#### `deleteFile(filePath): Promise<boolean>`

Deletes file.

#### `fileExists(filePath): Promise<boolean>`

Checks if file exists.

---

## Message Formats

### AgentMessage

Standard message format between agents:

```typescript
{
  from: AgentType,
  to: AgentType,
  messageType: MessageType,
  timestamp: string,
  sessionId: string,
  payload: any,
  metadata?: {
    requiresConfirmation?: boolean,
    priority?: 'low' | 'normal' | 'high',
    correlationId?: string
  }
}
```

### AgentResponse

Standard response format:

```typescript
{
  narrative: string,              // Human-readable text
  machineData: {                  // Machine-readable data
    type: string,
    data: any,
    validations?: ValidationResult[]
  },
  suggestedActions?: Action[],
  requiresConfirmation?: boolean,
  confirmationTargets?: string[]
}
```

### ErrorResponse

Error format:

```typescript
{
  error: ErrorType,
  message: string,
  details?: any,
  suggestedFix?: string,
  canRetry: boolean
}
```

---

## Usage Examples

### Complete Combat Turn

```typescript
// 1. Player declares action
const response = await coordinator.routePlayerAction('player1', 'I attack the goblin');

// 2. DM interprets action
const { interpretation, narrative } = await dmAgent.interpretAction(
  'player1',
  'I attack the goblin',
  { playerName: 'Thorin', currentScene: 'Forest', gamePhase: 'combat' }
);

// 3. Rules Engine resolves
const attackResult = rulesEngine.resolveAttack(5, 15); // +5 attack vs AC 15

if (attackResult.success) {
  // 4. Roll damage
  const damage = rulesEngine.resolveDamage(1, 8, 3); // 1d8+3
  
  // 5. Apply to target
  const hpProposal = targetPlayerAgent.updateHP(-damage, 'Goblin attack');
  
  // 6. Request confirmation
  await coordinator.requestConfirmation('conf1', ['player1'], hpProposal);
  
  // 7. After confirmation, apply
  const updatedSheet = targetPlayerAgent.applyEdit(hpProposal);
  
  // 8. Persist
  await persistenceAgent.writeFile({
    path: `characters/${updatedSheet.id}.json`,
    expectedVersion: updatedSheet.version - 1,
    content: updatedSheet,
    modifiedBy: 'player1'
  });
}

// 9. Generate narrative
const combatNarrative = await dmAgent.generateCombatNarrative(
  'Thorin',
  'melee attack',
  'Goblin',
  { success: attackResult.success, damage }
);
```

### Session Initialization

```typescript
// 1. Create session
const coordinator = new CoordinatorAgent();
const session = await coordinator.initializeSession('ai', undefined, 'Epic Quest');

// 2. Create players
const player1 = new PlayerAgent('player1');
const character1 = await player1.createCharacter('Thorin');

// 3. Add to session
const updatedSession = addPlayerToSession(session, 'Thorin', character1.id, false);
coordinator.updateSessionState(updatedSession);

// 4. Generate opening
const narrative = await dmAgent.generateSceneNarrative(
  'A tavern in a small village',
  { playerNames: ['Thorin'] }
);
```

---

## Error Handling

All agents should handle errors gracefully:

```typescript
try {
  const result = await agent.someMethod();
} catch (error) {
  const errorResponse: ErrorResponse = {
    error: ErrorType.AGENT_ERROR,
    message: error.message,
    canRetry: true
  };
  // Return error response to coordinator
}
```

---

## Best Practices

1. **Always validate inputs** using Zod schemas
2. **Use optimistic locking** for all file writes
3. **Request confirmation** before character sheet changes
4. **Include both narrative and machine data** in responses
5. **Log all agent actions** for debugging
6. **Handle LLM failures** with fallback responses
7. **Keep narratives concise** (<300 words)
8. **Provide 3-5 action suggestions** (not more)
9. **Use proper error types** for different failures
10. **Test with CLI harness** before integration

---

*This API documentation should be updated as agents evolve.*