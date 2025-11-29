# User Profile

**Purpose**: Understanding how the user communicates and their preferences
**Updated**: Automatically after each session when patterns emerge
**Editable**: Yes - user can update this file directly to correct or add preferences

---

## Communication Style

### Question Patterns
**Confidence**: 0% (0 observations)
- **Style**: [Direct/Exploratory/Detailed - to be learned]
- **Typical Approach**: [How user typically asks questions]
- **Response Preference**: [Brief/Detailed/With examples]

### Feedback Style
**Confidence**: 0% (0 observations)
- **Correction Method**: [Direct/Suggestive/Explanatory]
- **Satisfaction Signals**: [What indicates user is happy]
- **Frustration Triggers**: [What to avoid]

### Collaboration Preference
**Confidence**: 0% (0 observations)
- **Initiative Level**: [AI should lead/follow/balance]
- **Explanation Depth**: [Minimal/Moderate/Comprehensive]
- **Autonomy**: [Ask first vs. take action]

---

## Working Preferences

### Organization Style
**Confidence**: 0% (0 observations)
- **File Structure**: [Hierarchical/Flat/Custom preference]
- **Naming Convention**: [Preferred naming patterns]
- **Documentation Level**: [Minimal/Standard/Comprehensive]

### Technical Preferences
**Confidence**: 0% (0 observations)
- **Code Style**: [Formatting preferences, if applicable]
- **Tools**: [Preferred tools or technologies]
- **Detail Level**: [High-level/Detailed/Context-dependent]

### Decision Making
**Confidence**: 0% (0 observations)
- **Style**: [Quick/Deliberate/Collaborative]
- **Information Needs**: [What user needs to decide]
- **Change Tolerance**: [Conservative/Moderate/Experimental]

---

## Confidence Scoring Guide

### Levels
- **0-20%**: Initial observations (1-5 interactions)
- **21-40%**: Emerging pattern (6-15 interactions)
- **41-60%**: Developing pattern (16-30 interactions)
- **61-80%**: Established pattern (31-50 interactions)
- **81-100%**: Strong pattern (51+ interactions)

### Update Rules
- User explicit statement → Immediate 60%+ confidence
- Consistent behavior over 10+ interactions → 70%+ confidence
- User correction → Reset and update with high confidence
- Contradictory behavior → Reduce confidence, note exception

---

## Update Guidelines

### What to Extract
✅ **DO Extract:**
- Explicit preferences ("I prefer X over Y")
- Repeated behaviors (same approach 3+ times)
- Corrections to AI assumptions
- Communication style patterns
- Satisfaction/frustration signals

❌ **DON'T Extract:**
- One-off comments
- Conversational filler
- Temporary context
- Uncertain observations (wait for confirmation)

### When to Update
- **During session**: Note patterns in project/context/session_notes.md
- **Every 10 interactions**: Review and extract clear patterns
- **Session end**: Update with all observed patterns
- **User correction**: Update immediately with high confidence

### How to Update
1. Increment observation count for relevant category
2. Recalculate confidence percentage
3. Update pattern description with specific examples
4. Note any exceptions or contradictions
5. Remove patterns that are consistently contradicted

---

## User Editing Instructions

**You can edit this file directly!** 

If you notice the AI has:
- Misunderstood your preferences
- Missed an important pattern
- Recorded something incorrectly

Simply edit this file and save. The AI will read the updated version at the start of the next session.

**Format for adding preferences:**
```markdown
### [Category Name]
**Confidence**: 100% (User-specified)
- [Your preference description]
```

---

*This file helps the AI understand how you like to work and communicate. It learns over time but you have full control to edit it.*