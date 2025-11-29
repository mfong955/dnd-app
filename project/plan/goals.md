# Project Goals

**Purpose**: Define what you want to achieve with this project
**Editable**: Yes - update this file as your goals evolve
**Read by AI**: At the start of each session to understand project direction

---

## Project Overview

### Project Name
DnD Text Game App with AI Dungeon Master

### Project Type
Application - Multi-agent AI-powered web/mobile game platform

### Description
A D&D 3.5e text-based game application where AI agents assist as Dungeon Master or DM assistant. Players interact through text (voice planned for future), with the system managing character sheets, enforcing rules, and creating engaging adventures. The app supports both human and AI players, with flexible DM modes (AI-only or human DM with AI assistant).

---

## Main Objectives

### Primary Goal
Create a fully functional backend system with specialized AI agents (Coordinator, DM Agent, Rules Engine, Player Agent, Persistence Agent) that can orchestrate a complete D&D 3.5e game session with proper rule enforcement, character management, and narrative generation.

### Secondary Goals
- Implement adaptive organizational system for character sheets, stats, abilities, and history in human-editable markdown format
- Build permission system allowing DMs to control player edit access
- Create engaging, scalable adventures from local mysteries to world-bending campaigns
- Support 1-6 players (human or AI) with flexible session setup
- Enable real-time multiplayer through shareable links
- Prepare architecture for future voice integration and cloud sync

---

## Success Criteria

### How will you know this project is successful?
- Backend agents can successfully orchestrate a complete combat encounter with proper D&D 3.5e rules
- Character sheets are automatically maintained and human-editable
- Permission system correctly enforces DM/player access controls
- Players receive clear turn guidance with available actions
- AI DM generates engaging narrative that responds to player choices
- Session state persists correctly across saves/loads
- CLI test harness validates all agent interactions
- System is ready for REST/WebSocket API layer integration

---

## Scope

### In Scope
**Phase 1 - Backend Foundation (Current Focus):**
- Node.js/TypeScript implementation
- Five specialized AI agents with LLM integration (Claude API)
- Local file-based persistence (project/user_resources/)
- Character sheet schema and templates
- Session state management
- Permission system
- D&D 3.5e rules engine (core combat, checks, saves, basic spells)
- CLI test harness for validation
- JSON schema validation utilities
- Optimistic locking for file writes
- Metadata system for future cloud sync compatibility

**Phase 2 - API Layer (Next):**
- REST API endpoints
- WebSocket server for real-time gameplay
- Session management with shareable links
- Multi-session support

**Phase 3 - Frontend (Future):**
- Web interface
- Mobile-responsive design
- Group chat and private messaging
- Character setup wizard
- Voice integration

### Out of Scope
- Voice input/output (deferred to Phase 3)
- Cloud storage/sync (local-only for now, but metadata prepared)
- Full D&D 3.5e content (using SRD-derived rules, no copyrighted material)
- More than 6 players per session
- Real-time voice chat between players
- Advanced spell system beyond basics
- Character creation wizard (Phase 3)
- Payment/monetization system

---

## Timeline (Optional)

### Target Completion
Phase 1 (Backend): 2-3 weeks
Phase 2 (API): 1-2 weeks
Phase 3 (Frontend): 3-4 weeks

### Key Milestones
- **Week 1**: Agent architecture, schemas, and stubs complete
- **Week 2**: Working combat simulation through CLI
- **Week 3**: Full backend with persistence and permissions
- **Week 4**: REST/WebSocket API layer
- **Week 6**: Basic web interface
- **Week 8**: Full featured web app with multiplayer

---

## Notes

**Technology Stack:**
- Backend: Node.js with TypeScript
- AI: Claude API (Anthropic) for LLM-powered agents
- Storage: Local markdown files with YAML metadata
- API: REST + WebSocket for real-time
- Frontend: TBD (React/Vue/Svelte)

**Agent Architecture:**
- **Coordinator**: Orchestrates all agents, maintains session state, enforces permissions
- **DM Agent**: Generates narrative, interprets player actions, guides gameplay
- **Rules Engine**: Enforces D&D 3.5e mechanics, resolves dice rolls and checks
- **Player Agent**: Manages individual character sheets, proposes edits
- **Persistence Agent**: Handles all file I/O with optimistic locking

**Design Principles:**
- Explicit player confirmation before character sheet changes
- Human-editable files in clear markdown format
- Metadata prepared for future cloud sync
- Modular architecture for easy feature additions
- Cost-effective LLM usage (single process, specialized prompts)

---

*Update this file whenever your project goals change. The AI will read it at the start of each session.*