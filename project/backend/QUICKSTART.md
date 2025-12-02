# Quick Start Guide

## 🚀 Get Playing in 3 Steps

### Step 1: Upgrade Node.js (Required)

Your current Node.js 11.13.0 is too old. Upgrade to 18:

```bash
nodist + 18
nodist 18
node --version  # Should show v18.x.x
```

### Step 2: Install Dependencies

```bash
cd project/backend
npm install
```

### Step 3: Play!

```bash
npm run play
```

## 🎮 How to Play

### Character Creation
1. Choose "Use pre-made characters? (y/n)": **y**
2. Select from 4 templates:
   - **1. Fighter** - Heavy armor, strong melee
   - **2. Wizard** - Powerful spells, low HP
   - **3. Rogue** - Sneaky, high damage
   - **4. Cleric** - Healing, divine magic
3. Choose how many characters (1-4)
4. Optionally customize names

### Starting Combat
```
> combat
```
- Choose enemy type (1-5)
- Choose quantity (1-4)
- Initiative rolled automatically

### During Combat
**On your turn:**
```
> attack
Target: 1
```

**Enemies act automatically** - just wait for their turn to complete

**Combat continues** until victory or defeat!

### Other Commands
```
> status      # Show combat status
> characters  # List party
> save        # Save characters
> help        # Show all commands
> quit        # Exit
```

## 📋 Example Session

```bash
$ npm run play

Session name: My Adventure
✅ Session created

# Character creation
Use pre-made characters? y
How many characters? 2

Character 1 - Choose (1-4): 1  # Fighter
Name: Thorin

Character 2 - Choose (1-4): 2  # Wizard  
Name: Elara

# Start combat
> combat
Enemy type (1-5): 1  # Goblin
How many: 2

# Combat begins!
Initiative order: Elara → Thorin → Goblin 1 → Goblin 2

# Elara's turn
> attack
Target: 1
🎲 Attack roll: 15 + 0 = 15 vs AC 15
💥 HIT! Elara deals 3 damage to Goblin 1!

# Thorin's turn
> attack
Target: 1
🎲 Attack roll: 18 + 6 = 24 vs AC 15
💥 HIT! Thorin deals 9 damage to Goblin 1!
💀 Goblin 1 has been defeated!

# Goblins attack automatically...
# Combat continues...

🎉 VICTORY!

# Save progress
> save
✅ Characters saved!

> quit
```

## 🎯 What You Can Do

### Combat Features
- ✅ Turn-based D&D 3.5e combat
- ✅ Initiative system
- ✅ Attack rolls (d20 + modifiers)
- ✅ Damage calculation
- ✅ HP tracking
- ✅ Victory/defeat detection
- ✅ AI-controlled enemies

### Character Features
- ✅ 4 pre-made templates
- ✅ Full D&D 3.5e stats
- ✅ Save to markdown files
- ✅ View character sheets
- ✅ HP management

### Enemy Types
1. **Goblin** - Weak, fast (HP: 6, AC: 15)
2. **Orc** - Strong warrior (HP: 15, AC: 13)
3. **Skeleton** - Undead (HP: 12, AC: 13)
4. **Zombie** - Tough, slow (HP: 16, AC: 11)
5. **Ogre** - Powerful brute (HP: 30, AC: 16)

## 🔧 Troubleshooting

### "Unexpected token" errors
→ Node.js version too old. Upgrade to 18+

### "Cannot find module" errors
→ Run `npm install` in project/backend

### Game doesn't start
→ Make sure you're in project/backend directory
→ Check Node.js version: `node --version`

## 📚 More Info

- [`PHASE1-COMPLETE.md`](PHASE1-COMPLETE.md) - Full Phase 1 summary
- [`PLAY.md`](PLAY.md) - Detailed play guide
- [`README.md`](README.md) - Architecture overview

## 💡 Tips

1. **Start simple**: Use 1-2 characters vs 1-2 goblins
2. **Learn commands**: Type "help" anytime
3. **Save often**: Type "save" to save characters
4. **Check status**: Type "status" to see combat state
5. **Have fun**: Experiment with different combinations!

---

**Ready to play? Just run `npm run play` after upgrading Node.js!** 🎲