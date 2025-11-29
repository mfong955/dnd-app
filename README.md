# AI Workspace Template

A lightweight, intelligent workspace template for AI-assisted project development. The AI learns your communication style and maintains project context across sessions without storing full chat histories.

---

## Quick Start

### For Users

1. **Start Your Project**: Open this workspace in VSCode
2. **Begin Working**: Start chatting with your AI assistant
3. **AI Automatically**: Reads context files and understands your project
4. **Work Naturally**: AI learns your preferences over time
5. **Save Session**: Say "save session" - AI immediately saves all progress

**That's it!** The system handles everything automatically.

---

## How It Works

### For AI
The AI reads [`.ai/rules/aiworkspace.md`](.ai/rules/aiworkspace.md) which tells it to:
1. Read [`ai_system/memory/user_profile.md`](ai_system/memory/user_profile.md) - Your communication style
2. Read [`project/plan/goals.md`](project/plan/goals.md) - Project objectives
3. Read [`project/plan/progress.md`](project/plan/progress.md) - Current status
4. Read [`project/context/session_notes.md`](project/context/session_notes.md) - Last session context
5. Read [`project/history/decisions.md`](project/history/decisions.md) - Recent decisions

**Total: 5 files, ~500-700 tokens** - Fast and efficient!

### For You
- **Edit any file** to update preferences or project info
- **AI sees changes** automatically at next session
- **Full transparency** - see exactly what AI knows
- **Full control** - edit files anytime

---

## Repository Structure

```
your-project/
├── README.md                          # This file
├── .ai/
│   └── rules/
│       └── aiworkspace.md            # AI's instruction file
├── ai_system/
│   ├── memory/
│   │   └── user_profile.md           # Your communication style & preferences
│   └── templates/
│       ├── app_project_template.md   # Template for app projects
│       └── story_project_template.md # Template for story projects
└── project/
    ├── plan/
    │   ├── goals.md                  # What you want to achieve
    │   └── progress.md               # Current status & next steps
    ├── context/
    │   └── session_notes.md          # Current session working memory
    └── history/
        └── decisions.md              # Decision log & session summaries
```

---

## File Purposes

### User Information (ai_system/memory/)

#### [`user_profile.md`](ai_system/memory/user_profile.md)
**What**: Your communication style and working preferences
**Contains**:
- How you like to ask questions
- Your preferred response style
- Working preferences
- Confidence scores for each pattern

**You can edit**: Yes! Update anytime to correct or add preferences

---

### Project Information (project/)

#### [`project/plan/goals.md`](project/plan/goals.md)
**What**: Project objectives and what you want to achieve
**Contains**:
- Project name and type
- Main objectives
- Success criteria
- Timeline (optional)

**You can edit**: Yes! Update as your goals evolve

#### [`project/plan/progress.md`](project/plan/progress.md)
**What**: Current state and progress
**Contains**:
- Current phase
- Completed milestones
- Active tasks
- Next steps
- Blockers

**You can edit**: Yes! Update regularly to track progress

#### [`project/context/session_notes.md`](project/context/session_notes.md)
**What**: Temporary working memory for current session
**Contains**:
- What you're working on right now
- Recent decisions this session
- Patterns observed
- Notes for next session

**You can edit**: Yes! Add notes for next session
**Note**: AI clears this at session end (important info saved elsewhere)

#### [`project/history/decisions.md`](project/history/decisions.md)
**What**: Chronicle of decisions and session summaries
**Contains**:
- Major project decisions with reasoning
- Session summaries
- Project evolution over time

**You can edit**: Yes! Add context or decisions anytime

---

## How Sessions Work

### Session Start
1. You open workspace and start chatting
2. AI reads the 5 context files
3. AI greets you with summary of where you left off
4. AI asks what you want to work on today

### During Session
- AI tracks interactions
- Updates session_notes.md with current context
- Every 10 interactions: Checks for patterns to extract
- On major decisions: Updates history/decisions.md

### Save Session
1. You say **"save session"**
2. AI immediately extracts session insights
3. AI updates all relevant files
4. AI clears session_notes.md
5. AI provides session summary

**Note**: The command "save session" is explicit - AI will not ask for confirmation, it will proceed immediately with saving.

---

## Editing Files

### When to Edit

**Edit anytime you want to:**
- Correct AI's understanding of your preferences
- Update project goals or status
- Add important context
- Record decisions manually
- Add notes for next session

### How to Edit

1. Open the file in your editor
2. Make your changes
3. Save the file
4. AI will see changes at next session start

### What to Edit

**user_profile.md**: 
- Add or correct communication preferences
- Update working style preferences
- Set confidence to 100% for user-specified items

**goals.md**: 
- Update objectives as they evolve
- Add or remove goals
- Update timeline

**progress.md**: 
- Mark tasks complete
- Add new tasks
- Update current phase
- Note blockers

**session_notes.md**: 
- Add notes for next session
- Clarify current context

**decisions.md**: 
- Add important decisions
- Provide additional context
- Record insights

---

## Benefits

✅ **Lightweight**: Only 5 core files, ~500-700 tokens to read
✅ **Automatic**: AI handles memory management
✅ **Transparent**: See exactly what AI knows
✅ **Editable**: Full control over all information
✅ **Efficient**: Fixed context usage, scales indefinitely
✅ **Smart**: AI learns patterns, not conversations
✅ **Continuous**: Seamless context across sessions

---

## Project Templates

### Starting a New Project

The AI can help you set up project structure using templates:

**For Application/Software Projects**:
- Uses [`ai_system/templates/app_project_template.md`](ai_system/templates/app_project_template.md)
- Creates: requirements/, design/, documentation/, resources/

**For Story/Novel Projects**:
- Uses [`ai_system/templates/story_project_template.md`](ai_system/templates/story_project_template.md)
- Creates: characters/, settings/, plot/, research/, drafts/

**For Other Projects**:
- AI adapts structure based on your needs
- All project files go in `project/` directory

---

## Tips for Best Results

### For Users

1. **Be explicit about preferences**: Tell AI what you like/dislike
2. **Update files regularly**: Keep goals.md and progress.md current
3. **Review user_profile.md**: Check if AI understood you correctly
4. **Save sessions**: Say "save session" when you want to save progress
5. **Add notes**: Use session_notes.md to leave notes for next time

### For AI Integration

1. **Always read initialization files**: At start of every session
2. **Update incrementally**: Don't wait until session end
3. **Extract patterns**: Note repeated behaviors
4. **Use confidence scores**: Only save patterns you're confident about
5. **Keep files concise**: Extract insights, not conversations

---

## Troubleshooting

### AI doesn't remember context
→ Check if AI read the initialization files
→ Manually remind: "Please read the context files"

### AI misunderstands preferences
→ Edit `ai_system/memory/user_profile.md` directly
→ Set confidence to 100% for your corrections

### Project info is outdated
→ Edit `project/plan/goals.md` or `progress.md`
→ AI will see updates at next session

### Session notes too long
→ AI should auto-compress
→ Manually ask: "Please compress session notes"

---

## What's Next

This template is designed to be:
- **Lightweight**: Minimal files, maximum efficiency
- **Flexible**: Adapts to any project type
- **Extensible**: Ready for future enhancements (web dashboard, analytics, etc.)

Future enhancements could include:
- Web dashboard for visual memory management
- Automatic session detection
- Analytics and insights
- Team collaboration features

---

## Getting Started

1. **Clone or use this template**
2. **Open in VSCode** with AI assistant
3. **Start chatting** - AI will guide you through setup
4. **Edit files** as needed to match your preferences
5. **Work naturally** - AI learns and adapts

---

## Support

- **File Structure**: See repository structure above
- **File Purposes**: See "File Purposes" section
- **How It Works**: See "How It Works" section
- **Editing Guide**: See "Editing Files" section

---

**Ready to start?** Open your workspace and begin chatting with the AI!