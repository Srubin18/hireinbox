# HotJupiter Agent Memory

> **PURPOSE**: Long-term memory that persists across Claude sessions.
> This file is auto-loaded with CLAUDE.md. Update it as you work.
> Last updated: 2026-01-16

---

## AGENT RALPH - Task Queue

### Current Sprint
| ID | Task | Status | Assigned | Notes |
|----|------|--------|----------|-------|
| - | No active tasks | - | - | Run `RALPH, build [feature]` to start |

### Completed Tasks
| ID | Task | Completed | Commits |
|----|------|-----------|---------|
| - | None yet | - | - |

### Blocked Tasks
| ID | Task | Blocker | Since |
|----|------|---------|-------|
| - | None | - | - |

---

## PROJECT LEARNINGS

### What Works Well
- HJ3 flow: One message → one website
- Curated images bypass DALL-E (faster, more reliable)
- Voice notes work great for SA users

### What Doesn't Work
- DALL-E for SA-specific categories (wrong imagery)
- Complex multi-step conversations (users drop off)
- Generic stock images for township businesses

### Technical Debt
- [ ] Some env vars have `\n` suffix causing issues
- [ ] WhatsApp token expires (needs permanent token)
- [ ] 88 image URLs previously dead (fixed, monitor)

---

## DECISIONS LOG

### Architecture Decisions
| Date | Decision | Rationale | Made By |
|------|----------|-----------|---------|
| 2026-01-12 | All 80+ categories bypass DALL-E | Speed + relevance | Simon |
| 2026-01-11 | HJ3 replaces P1-P4.2 | Simplicity wins | Simon |
| 2026-01-16 | Add RALPH agent | Autonomous feature shipping | Simon |

### Rejected Ideas
| Idea | Why Rejected | Date |
|------|--------------|------|
| Multi-lingual bot | Complexity, English works for MVP | 2026-01 |
| Payment before preview | Kills conversion | 2026-01 |

---

## KEY METRICS TO TRACK

| Metric | Current | Target | Owner |
|--------|---------|--------|-------|
| Build success rate | ~95% | 99% | BILL |
| JUDGE pass rate | ~80% | 90% | STEVE |
| Daily websites | ? | 100+ | JEFF |
| Avg build time | ~45s | <30s | BILL |

---

## CODEBASE KNOWLEDGE

### Critical Files (Don't Break)
- `lib/hj3/hj3-flow.ts` - Main conversation flow
- `lib/relate-pipeline/index.ts` - Website generation
- `lib/hj3/curated-images.ts` - Image packs (FROZEN)

### Safe to Modify
- `lib/agents/*` - Agent logic
- `scripts/*` - Utility scripts
- `docs/*` - Documentation

### Patterns to Follow
- Always commit after each fix
- Run `npm run build` before pushing
- Update this file after significant changes

---

## SESSION HANDOFF NOTES

### For Next Session
- WhatsApp token expired Dec 30 - NEEDS FIX
- RALPH agent being implemented
- Airtime category images need better curation

### Context to Remember
- Simon wants PERFECT websites, no placeholders
- Target: SA small businesses (spaza, salons, food vendors)
- FREE model with R99 upsells
