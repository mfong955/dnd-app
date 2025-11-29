# DnD App Backend

Multi-agent AI system for orchestrating D&D 3.5e text-based gameplay.

## Architecture

This backend uses a **specialized agent architecture** where five AI agents collaborate:

1. **Coordinator Agent** - Orchestrates all interactions, manages session state
2. **DM Agent** - Generates narrative, interprets player actions
3. **Rules Engine** - Enforces D&D 3.5e mechanics
4. **Player Agent** - Manages character sheets
5. **Persistence Agent** - Handles file I/O with optimistic locking

See [`../architecture/agent-architecture.md`](../architecture/agent-architecture.md) for detailed design.

## Setup

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Anthropic API key to .env
# ANTHROPIC_API_KEY=your_key_here
```

### Development

```bash
# Run CLI test harness
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

## Project Structure

```
backend/
├── src/
│   ├── agents/           # AI agent implementations
│   │   ├── coordinator.ts
│   │   ├── dm-agent.ts
│   │   ├── rules-engine.ts
│   │   ├── player-agent.ts
│   │   └── persistence-agent.ts
│   ├── schemas/          # TypeScript schemas and Zod validators
│   │   ├── character-sheet.ts
│   │   ├── session-state.ts
│   │   └── agent-messages.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── llm-client.ts
│   │   └── validation.ts
│   └── cli/              # CLI test harness
│       └── test-harness.ts
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### CLI Test Harness

The CLI test harness allows you to test agent interactions without a full web interface:

```bash
npm run dev
```

This will:
1. Initialize a test session
2. Create sample characters
3. Run a simple combat scenario
4. Display agent interactions and outputs

### Agent Communication

All agents communicate through structured messages:

```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  messageType: string;
  payload: any;
}
```

Responses include both human narrative and machine-readable JSON:

```typescript
interface AgentResponse {
  narrative: string;           // For players
  machineData: {              // For other agents
    type: string;
    data: any;
  };
}
```

## Configuration

Edit `.env` to configure:

- `ANTHROPIC_API_KEY` - Your API key
- `ANTHROPIC_MODEL` - Model to use (default: claude-3-5-sonnet-20241022)
- `MAX_PLAYERS` - Maximum players per session (default: 6)
- `DEFAULT_DM_MODE` - 'ai' or 'human'

## Development Roadmap

### Phase 1: Backend Foundation (Current)
- [x] Project structure and configuration
- [ ] TypeScript schemas and types
- [ ] Agent stub implementations
- [ ] CLI test harness
- [ ] Simple combat simulation

### Phase 2: API Layer
- [ ] REST API endpoints
- [ ] WebSocket server
- [ ] Session management
- [ ] Authentication

### Phase 3: Frontend
- [ ] Web interface
- [ ] Character creation wizard
- [ ] Real-time gameplay UI

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- coordinator.test.ts
```

## Contributing

1. Follow TypeScript strict mode
2. Use Prettier for formatting
3. Add tests for new features
4. Update documentation

## License

MIT