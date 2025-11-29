# Session Notes

**Purpose**: Temporary working memory for the current session
**Editable**: Yes - but AI updates this automatically during sessions
**Read by AI**: At the start of each session to continue from where you left off

---

## Current Session

### Session Date
[YYYY-MM-DD]

### Session Focus
[What you're working on right now]

### Interaction Count
0 (AI updates this automatically)

---

## Active Context

### What I'm Working On
[Current task or problem being addressed]

### Recent Decisions (This Session)
- [Decision made today]
- [Another decision from this session]

### Questions/Issues
- [Open question or issue to resolve]

---

## Patterns Observed (This Session)

[AI notes emerging patterns here to extract at session end]

---

## Next Session

### Continue With
[What to pick up next time]

### Remember
[Important context to carry forward]

---

## Session Management

### Update Schedule
- **Every interaction**: AI increments counter
- **Every 10 interactions**: AI checks for patterns to extract
- **Session save**: AI clears this file and summarizes in history/decisions.md

### Token Limit
Keep this file under 300 tokens. If approaching limit, AI will compress and extract insights.

---

## AI Update Instructions

### When to Update This File
- **Every interaction**: Increment interaction count
- **During session**: Update "What I'm Working On" with current focus
- **Decisions made**: Add to "Recent Decisions (This Session)"
- **Patterns observed**: Note in "Patterns Observed" section
- **Every 10 interactions**: Review and extract patterns to permanent files

### How to Update
1. **Interaction count**: Increment with each user message
2. **Session focus**: Keep "What I'm Working On" current
3. **Recent decisions**: Add decisions as they're made (this session only)
4. **Patterns**: Note emerging patterns for extraction at session end
5. **Next session notes**: Update "Continue With" section

### Session Save Protocol
When user says "save session":
1. Extract all insights from this file
2. Add session summary to `history/decisions.md`
3. Update `progress.md` with accomplishments
4. Extract patterns to `user_profile.md` if observed
5. **Clear all sections** except "Next Session"
6. Add brief note in "Continue With" for next session
7. Reset interaction count to 0

### What NOT to Do
- Don't let this file exceed 300 tokens
- Don't store permanent information here (extract to other files)
- Don't keep old session information after save
- Don't forget to increment interaction counter

---

## User Notes

[You can add notes here that you want the AI to see next session]

---

*This file is cleared at the end of each session. Important information is extracted to other files for permanent storage.*