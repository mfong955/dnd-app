# Backend Setup Guide

## Current Status

✅ **Completed:**
- Project structure created
- TypeScript configuration
- Package.json with dependencies
- Environment configuration (.env created with API key)
- Type definitions (408 lines)
- Character sheet schema with Zod validation (408 lines)
- Session state schema with helper functions (301 lines)
- Agent message schemas (260 lines)

⏳ **Next Steps:**
1. Install dependencies
2. Implement agent stubs
3. Create CLI test harness
4. Test simple combat flow

## Installation

### Step 1: Install Dependencies

```bash
cd project/backend
npm install
```

This will install:
- `@anthropic-ai/sdk` - Claude API client
- `zod` - Schema validation
- `uuid` - UUID generation
- `dotenv` - Environment variables
- TypeScript and development tools

### Step 2: Verify Installation

```bash
# Check TypeScript compilation
npm run build

# Should compile without errors after npm install
```

### Step 3: Verify Environment

Make sure your `.env` file exists with:
```
ANTHROPIC_API_KEY=your_actual_key_here
```

## Current TypeScript Errors

The TypeScript errors you're seeing are **expected** and will be resolved after running `npm install`:

- ❌ `Cannot find module 'zod'` → Fixed by npm install
- ❌ `Cannot find module 'uuid'` → Fixed by npm install  
- ❌ `Cannot find type definition file for 'node'` → Fixed by npm install

## Project Structure

```
backend/
├── src/
│   ├── types/
│   │   └── index.ts              ✅ Complete (408 lines)
│   ├── schemas/
│   │   ├── character-sheet.ts    ✅ Complete (408 lines)
│   │   ├── session-state.ts      ✅ Complete (301 lines)
│   │   └── agent-messages.ts     ✅ Complete (260 lines)
│   ├── agents/                   ⏳ Next: Implement stubs
│   │   ├── coordinator.ts
│   │   ├── dm-agent.ts
│   │   ├── rules-engine.ts
│   │   ├── player-agent.ts
│   │   └── persistence-agent.ts
│   ├── utils/                    ⏳ Next: LLM client & validation
│   │   ├── llm-client.ts
│   │   └── validation.ts
│   └── cli/                      ⏳ Next: Test harness
│       └── test-harness.ts
├── .env                          ✅ Created with API key
├── .env.example                  ✅ Template (safe)
├── package.json                  ✅ Complete
├── tsconfig.json                 ✅ Complete
└── README.md                     ✅ Complete
```

## What We've Built

### 1. Type System (`src/types/index.ts`)

Complete TypeScript type definitions for:
- Agent types and message types
- Permission system (5 levels)
- Session state
- Character sheets
- Combat mechanics
- Error handling

### 2. Character Sheet Schema (`src/schemas/character-sheet.ts`)

Full D&D 3.5e character sheet with:
- Ability scores with modifier calculation
- Hit points, AC, initiative
- Skills, feats, spells
- Equipment and inventory
- Conditions and buffs
- Saving throws and attack bonuses
- Zod validation
- Helper functions (create blank sheet, calculate modifiers)

### 3. Session State Schema (`src/schemas/session-state.ts`)

Session management with:
- Player tracking
- NPC management
- Scene information
- Game phase (setup/exploration/combat)
- Initiative and turn order
- Permission system
- Helper functions (add player, start combat, next turn, etc.)

### 4. Agent Message Schemas (`src/schemas/agent-messages.ts`)

Communication protocols for:
- Agent messages
- Agent responses
- Validation results
- Actions and suggestions
- Rules resolutions
- Character edit proposals
- Combat actions
- Persistence operations

## Next Development Steps

### Phase 1: Agent Stubs (Current)

1. **Coordinator Agent** - Orchestrator
2. **DM Agent** - Narrative generator
3. **Rules Engine** - D&D 3.5e mechanics
4. **Player Agent** - Character management
5. **Persistence Agent** - File I/O

### Phase 2: Utilities

1. **LLM Client** - Claude API wrapper
2. **Validation** - Schema validation helpers

### Phase 3: CLI Test Harness

1. Initialize test session
2. Create sample characters
3. Run simple combat
4. Display agent interactions

### Phase 4: API Layer

1. REST endpoints
2. WebSocket server
3. Session management

## Testing Strategy

1. **Unit Tests** - Individual agent functions
2. **Integration Tests** - Agent communication
3. **CLI Tests** - Full combat simulation
4. **API Tests** - Endpoint validation

## Architecture Highlights

### Multi-Agent System

```
Player Input → Coordinator → [DM + Rules + Player] → Persistence → Response
```

### Permission System

- **none** (0) - No access
- **view** (1) - Read only
- **edit_self** (2) - Edit own character
- **edit_others** (3) - Edit any character (DM)
- **admin** (4) - Full control (Coordinator)

### Optimistic Locking

Every file write includes:
- Expected version number
- New content
- Modifier ID

Prevents concurrent modification conflicts.

### Cloud Sync Ready

All files include metadata:
- id, version, lastModified
- lastModifiedBy, confirmedBy
- syncStatus, cloudVersion

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (will run CLI test harness when implemented)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

### TypeScript Errors

**Problem:** Cannot find module 'zod', 'uuid', etc.
**Solution:** Run `npm install` in the `project/backend` directory

### API Key Issues

**Problem:** API calls failing
**Solution:** 
1. Check `.env` file exists
2. Verify `ANTHROPIC_API_KEY` is set correctly
3. Ensure no extra spaces or quotes

### Build Errors

**Problem:** TypeScript compilation fails
**Solution:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Run `npm run build`

## Resources

- [Architecture Document](../architecture/agent-architecture.md)
- [Project Goals](../plan/goals.md)
- [Progress Tracking](../plan/progress.md)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [D&D 3.5e SRD](https://www.d20srd.org/)

## Security Notes

- ✅ `.env` is gitignored
- ✅ `.env.example` uses placeholder
- ✅ API key only in `.env` file
- ⚠️ Never commit `.env` to version control