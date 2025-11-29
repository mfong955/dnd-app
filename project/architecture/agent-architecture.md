# DnD App - Agent Architecture & Data Flow

**Version**: 1.0
**Last Updated**: 2025-11-29
**Status**: Design Phase

---

## System Overview

The DnD app uses a **multi-agent architecture** where specialized AI agents collaborate to orchestrate gameplay. All agents are LLM-powered (Claude API) with specialized system prompts, running as modules within a single Node.js/TypeScript process.

### Core Principle
**Separation of Concerns**: Each agent has a single, well-defined responsibility. The Coordinator orchestrates all interactions and is the only agent with file write permissions.

---

## Agent Roster

### 1. Coordinator Agent
**Role**: Orchestrator and session manager
**Responsibilities**:
- Route player inputs to appropriate agents
- Maintain authoritative session state
- Enforce permission rules
- Validate agent outputs
- Coordinate file persistence
- Manage turn order and initiative

**Does NOT**:
- Generate narrative content
- Make rule decisions
- Directly modify character sheets

### 2. DM Agent
**Role**: Dungeon Master and narrative generator
**Responsibilities**:
- Generate engaging narrative descriptions
- Interpret player action intent
- Guide players through their turns
- Create and manage NPCs
- Design encounters and story beats
- Suggest available actions to players

**Does NOT**:
- Enforce mechanical rules (delegates to Rules Engine)
- Persist data (delegates to Coordinator)
- Modify character sheets directly

### 3. Rules Engine
**Role**: D&D 3.5e mechanical arbiter
**Responsibilities**:
- Resolve dice rolls and checks
- Calculate combat outcomes
- Validate action legality
- Apply status effects
- Track HP, conditions, and resources
- Enforce D&D 3.5e SRD rules

**Does NOT**:
- Generate narrative text
- Make story decisions
- Persist data

### 4. Player Agent
**Role**: Character sheet manager
**Responsibilities**:
- Maintain canonical character sheet
- Generate proposed character edits
- Validate edit requests against rules
- Track character resources and state
- Provide character context to other agents

**Does NOT**:
- Write files directly (proposes changes to Coordinator)
- Make decisions for the player
- Generate narrative

### 5. Persistence Agent
**Role**: File I/O manager
**Responsibilities**:
- Read/write character sheets
- Read/write session state
- Implement optimistic locking
- Maintain file version control
- Handle metadata headers
- Manage backup/recovery

**Does NOT**:
- Make decisions about what to save
- Modify data (only reads/writes as instructed)
- Validate game logic

---

## Data Flow Diagrams

### Primary Flow: Player Action

```
┌─────────────┐
│   Player    │
│   Input     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Coordinator Agent               │
│  • Parse input                          │
│  • Check permissions                    │
│  • Route to agents                      │
└──────┬──────────────────────┬───────────┘
       │                      │
       ▼                      ▼
┌─────────────┐        ┌─────────────┐
│  DM Agent   │        │   Rules     │
│             │◄──────►│   Engine    │
│ • Interpret │        │             │
│ • Narrate   │        │ • Validate  │
│ • Suggest   │        │ • Resolve   │
└──────┬──────┘        └──────┬──────┘
       │                      │
       │      ┌───────────────┘
       │      │
       ▼      ▼
┌─────────────────────┐
│   Player Agent      │
│  • Propose changes  │
│  • Validate edits   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Coordinator       │
│  • Collect results  │
│  • Request confirm  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Persistence Agent  │
│  • Write if needed  │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
│  to Player  │
└─────────────┘
```

### Session Initialization Flow

```
┌──────────────┐
│ New Session  │
│   Request    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│    Coordinator Agent        │
│  • Generate session_id      │
│  • Initialize state         │
│  • Set DM mode              │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Persistence Agent         │
│  • Create session directory │
│  • Initialize files         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Player Agent (per player) │
│  • Create character sheet   │
│  • Set initial stats        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│      DM Agent               │
│  • Generate intro narrative │
│  • Present starting options │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│   Session   │
│   Ready     │
└─────────────┘
```

### Combat Round Flow

```
┌──────────────────┐
│  Combat Start    │
│  (DM triggers)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│   Rules Engine           │
│  • Roll initiative       │
│  • Sort turn order       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Coordinator            │
│  • Store initiative      │
│  • Start turn loop       │
└────────┬─────────────────┘
         │
    ┌────▼────┐
    │  Loop   │
    │  Turns  │
    └────┬────┘
         │
         ▼
┌──────────────────────────┐
│   DM Agent               │
│  • Announce turn         │
│  • Describe situation    │
│  • List available actions│
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Player Input           │
│  (action declaration)    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Rules Engine           │
│  • Validate action       │
│  • Roll dice             │
│  • Calculate outcome     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Player Agent           │
│  • Propose HP change     │
│  • Update resources      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Coordinator            │
│  • Confirm changes       │
│  • Persist if approved   │
│  • Next turn             │
└────────┬─────────────────┘
         │
         └──► Loop or End Combat
```

---

## Message Formats

### Agent Communication Protocol

All inter-agent messages follow this structure:

```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  messageType: string;
  timestamp: string;
  sessionId: string;
  payload: any;
  metadata?: {
    requiresConfirmation?: boolean;
    priority?: 'low' | 'normal' | 'high';
    correlationId?: string;
  };
}
```

### Response Envelope

All agent responses include both human and machine-readable content:

```typescript
interface AgentResponse {
  narrative: string;           // Human-readable text
  machineData: {              // Structured data for other agents
    type: string;
    data: any;
    validations?: ValidationResult[];
  };
  suggestedActions?: Action[];
  requiresConfirmation?: boolean;
  confirmationTargets?: string[]; // Player IDs who must confirm
}
```

---

## Permission System

### Permission Levels

```typescript
enum PermissionLevel {
  NONE = 0,           // Cannot view or edit
  VIEW = 1,           // Can view only
  EDIT_SELF = 2,      // Can edit own character
  EDIT_OTHERS = 3,    // Can edit other characters (DM)
  ADMIN = 4           // Full control (Coordinator)
}
```

### Permission Matrix

| Actor          | Own Character | Other Characters | Session State | Rules |
|----------------|---------------|------------------|---------------|-------|
| Player (AI DM) | EDIT_SELF     | VIEW             | VIEW          | VIEW  |
| Player (Human DM) | EDIT_SELF  | VIEW*            | VIEW          | VIEW  |
| Human DM       | EDIT_OTHERS   | EDIT_OTHERS      | EDIT_OTHERS   | VIEW  |
| AI DM          | EDIT_OTHERS   | EDIT_OTHERS      | EDIT_OTHERS   | VIEW  |
| Coordinator    | ADMIN         | ADMIN            | ADMIN         | ADMIN |

*Can be granted EDIT_OTHERS by DM

### Permission Enforcement Flow

```
Player Edit Request
       │
       ▼
┌─────────────────┐
│  Coordinator    │
│  Check perms    │
└────┬────────┬───┘
     │        │
  Denied   Allowed
     │        │
     ▼        ▼
  Error   Propose Change
            │
            ▼
     Require Confirmation
            │
            ▼
     Collect Approvals
            │
            ▼
     Persist if Complete
```

---

## State Management

### Session State Schema

```typescript
interface SessionState {
  sessionId: string;
  version: number;
  createdAt: string;
  lastModified: string;
  
  dmMode: 'ai' | 'human';
  dmPlayerId?: string;  // If human DM
  
  players: PlayerInfo[];
  
  gameState: {
    phase: 'setup' | 'exploration' | 'combat' | 'paused';
    currentTurn?: string;  // Player ID
    initiativeOrder?: string[];
    round?: number;
  };
  
  permissions: {
    [playerId: string]: PermissionLevel;
  };
  
  scene: {
    sceneId: string;
    description: string;
    npcs: NPC[];
    environment: string;
  };
}
```

### Character Sheet Schema

```typescript
interface CharacterSheet {
  // Metadata
  id: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  confirmedBy: string[];
  
  // Basic Info
  name: string;
  race: string;
  class: string;
  level: number;
  
  // Ability Scores
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  // Combat Stats
  hp: {
    current: number;
    max: number;
    temporary: number;
  };
  ac: number;
  initiative: number;
  
  // Skills, Feats, Spells
  skills: Skill[];
  feats: Feat[];
  spells: Spell[];
  
  // Equipment & Inventory
  equipment: Item[];
  inventory: Item[];
  
  // Status
  conditions: Condition[];
  buffs: Buff[];
}
```

---

## Error Handling

### Error Types

```typescript
enum ErrorType {
  PERMISSION_DENIED = 'permission_denied',
  INVALID_ACTION = 'invalid_action',
  RULE_VIOLATION = 'rule_violation',
  STATE_CONFLICT = 'state_conflict',
  PERSISTENCE_ERROR = 'persistence_error',
  VALIDATION_ERROR = 'validation_error'
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: ErrorType;
  message: string;
  details?: any;
  suggestedFix?: string;
  canRetry: boolean;
}
```

---

## Optimistic Locking

### Version Control Strategy

Every file write includes:
1. Expected version number
2. New content
3. Modifier ID

Persistence Agent:
1. Reads current version
2. Compares with expected version
3. If match: writes new version, increments version number
4. If mismatch: returns conflict error

```typescript
interface WriteRequest {
  path: string;
  expectedVersion: number;
  content: any;
  modifiedBy: string;
}

interface WriteResponse {
  success: boolean;
  newVersion?: number;
  conflict?: {
    expectedVersion: number;
    actualVersion: number;
    lastModifiedBy: string;
  };
}
```

---

## Future Extensibility

### Prepared for Cloud Sync

All files include metadata headers:
```yaml
---
id: uuid
version: number
lastModified: ISO8601
lastModifiedBy: userId
syncStatus: local|synced|conflict
cloudVersion?: number
---
```

### Prepared for Voice

UI/Voice Agent placeholder exists in architecture. When implemented:
- Converts speech to text
- Sends to Coordinator as text input
- Converts narrative responses to speech
- Handles voice chat between players

---

## Performance Considerations

### LLM Call Optimization

1. **Batch where possible**: Coordinator collects context before calling agents
2. **Cache system prompts**: Reuse agent prompts across calls
3. **Streaming responses**: Use streaming for long narratives
4. **Parallel calls**: DM Agent and Rules Engine can run concurrently
5. **Smart routing**: Only call agents that need to respond

### Expected LLM Usage per Turn

- **Simple action**: 2-3 calls (DM + Rules Engine)
- **Complex action**: 4-5 calls (+ Player Agent for edits)
- **Combat round**: 3-4 calls per player turn

---

## Security Considerations

1. **Input validation**: All player inputs sanitized before processing
2. **Permission checks**: Every state modification validated
3. **File access**: Restricted to project/user_resources/ only
4. **Version control**: Prevents concurrent modification conflicts
5. **Audit trail**: All changes logged with modifier ID

---

*This architecture document should be updated as the system evolves.*