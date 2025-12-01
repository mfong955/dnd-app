# How to Play the Interactive D&D Game

## Prerequisites

**IMPORTANT:** You need Node.js 14+ to run this game. Node.js 11 is too old.

Check your Node version:
```bash
node --version
```

If you have Node.js 11 or older, upgrade using Nodist:
```bash
nodist + 18
nodist 18
```

## Starting the Game

```bash
cd project/backend
npm run play
```

## Available Commands

### Scene & Narrative
- `scene <description>` - Generate a scene narrative
  - Example: `scene A dark forest with goblins`
- `<any text>` - Describe an action (AI interprets it)
  - Example: `I search for traps`

### Combat
- `combat` - Start combat encounter
- `attack <target>` - Attack a target
  - Example: `attack goblin`
- `roll <type> <bonus>` - Roll dice
  - Types: `attack`, `save`, `skill`
  - Example: `roll attack 5`

### Character Management
- `status` - Show current game status
- `characters` - List all characters with stats
- `heal <character> <hp>` - Heal a character
  - Example: `heal Thorin 10`
- `damage <character> <hp>` - Damage a character
  - Example: `damage Elara 5`

### General
- `help` - Show help menu
- `quit` or `exit` - Exit game

## Quick Start Example

```
> npm run play

# Create your character
Character name: Thorin
Class: Fighter
Level: 3

# Generate a scene
> scene A dark dungeon with skeletons

# Start combat
> combat
How many enemies? 2

# Attack
> attack skeleton
Who is attacking? Thorin
Target AC: 15
Damage dice: 1d8+3

# Check status
> status

# Heal if needed
> heal Thorin 10

# Exit when done
> quit
```

## Tips

1. **Character Creation**: You can create 1-4 characters at the start
2. **Class Defaults**: Each class gets appropriate stats automatically
3. **Combat**: Initiative is rolled automatically when you start combat
4. **Narrative Actions**: Just type what you want to do, the AI will interpret it
5. **Dice Rolls**: Use standard D&D notation (1d8+3, 2d6, etc.)

## Troubleshooting

### "Unexpected token" errors
- Your Node.js version is too old. Upgrade to Node.js 14+

### "Cannot find module" errors
- Run `npm install` in the project/backend directory

### API errors
- Make sure your `.env` file has a valid `ANTHROPIC_API_KEY`

## Features

✅ Multi-character support (up to 4 PCs)
✅ AI-powered narrative generation
✅ D&D 3.5e rules engine
✅ Combat system with initiative
✅ Character management (HP, healing, damage)
✅ Skill checks and saving throws
✅ Interactive command system

## Have Fun!

This is a fully functional D&D game powered by AI agents. Experiment with different actions and see how the AI responds!