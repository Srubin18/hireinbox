# NEWCO - Personal AI That Knows You

> Working title for Simon's next venture
> Last updated: 26 December 2025

---

## The Concept

**Newco** is a personal AI that actually knows you.

It isn't a chatbot, a productivity app, or a search engine - it's your *second self*, built from your real digital life: your messages, emails, photos, notes, and habits.

By connecting to your data (securely and locally), Newco learns who you are - your patterns, preferences, memories, and mistakes - and then reflects them back in full color.

---

## Core Vision

> "I am Newco. I don't know you yet - but I'd like to.
> As you share, I'll start to remember, reflect, and remind you of who you've been, and help you understand who you're becoming."

Newco evolves from naive to omniscient as you feed it more of your history. Each new data source - WhatsApp chats, calendar, photos, emails - deepens its understanding.

Users experience this not as "data upload" but as building intimacy with a digital companion who remembers everything.

---

## What It Does

### 1. Unified Personal Memory
- Indexes your digital life into a single, searchable memory graph
- Messages, photos, emails remain local to your device
- Examples:
  - "Show me the photo I took with Jenna in Clifton last December"
  - "Find that WhatsApp I sent Mum when I booked Mauritius"

### 2. Conversational Recall
- Natural voice interface: talk like a friend
- "That one time in 2016...", "When did I last rant about my boss?"
- Results appear as moment cards: photos, chat snippets, places, timestamps

### 3. Reflexive Coaching
- Identifies recurring patterns: emotional highs, burnout cycles, relationship trends
- Gentle interventions: "You've made this choice twice before - last time you said you regretted it. Are you sure?"
- Part memory, part therapist, part coach

### 4. Proactive Awareness
- Knows what you love - destinations, routines, people
- Opportunistic nudges:
  - "There's a Mauritius deal in December - the same month you went last year"
  - "You said you wanted more weekends offline; it's been 6 straight weeks of 12-hour workdays"

---

## Psychology Behind It

- Humans are irresistibly drawn to things that reflect them (personality quizzes, journaling apps, photo memories)
- Taps the *mirror effect* and *self-knowledge addiction*
- Each interaction feels like learning something meaningful about yourself
- The hook isn't gamified dopamine; it's *self-validation and curiosity*

---

## Architecture

### Privacy-First Design
- **Local-first, user-owned system**
  - All raw data (messages, photos, emails) stays encrypted on device
  - Models run locally; cloud calls only on opt-in tasks
  - Zero server-side training - "We never see your life"

- **Progressive intimacy model**
  - Starts small: photos + one chat source
  - As users experience insight, invited to add more connections
  - "The more you share, the better Newco sees you"

- **Transparent control**
  - Clear data logs, delete buttons
  - Fine-grained permissions (e.g., "analyze this folder, not that album")

---

## User Experience

### Onboarding
- Voice intro: "Hi, I'm Newco. I know nothing about you yet - shall we start with your photos?"
- One-click data connectors with simple visual cues about privacy
- Immediate payoff: instantly "remembers" the first personal detail

### Interaction
- Core interface: clean chat/voice canvas with "memory moments" shown visually
- Command palette doubles as universal recall tool ("Find, summarize, remind")
- Optional timeline view - a browsable map of your life's major themes

### Tone and Identity
- Gender-neutral, calm, emotionally intelligent - never preachy
- Speaks reflectively: "I noticed last March was one of your happiest months. You hiked a lot and slept better."
- Feels empathic, not exploitative

---

## Competitive Landscape (December 2025)

### TIER 1: Direct Competitors

| Product | Status | What It Does | Gap vs Newco |
|---------|--------|--------------|--------------|
| **Limitless** | Acquired by Meta (Dec 2025) | Wearable pendant, records everything | Hardware-first, no self-reflection |
| **Dot** | SHUT DOWN (Sep 2025) | AI companion learns through chat | Failed (24k downloads). No data ingestion |
| **Kin** | Live (50k users) | Private AI companion, career coaching | Coaching-focused, not memory/self-knowledge |
| **Personal.ai** | Live | Train AI on your data for digital twin | B2B focused, messaging assistant |
| **Omi** | Live ($89) | Open-source AI wearable | Hardware required, productivity focus |
| **Microsoft Recall** | Delayed/Controversial | Screenshots everything on Windows | Privacy nightmare, enterprise focus |

### TIER 2: AI Companions

| Product | Users | Gap |
|---------|-------|-----|
| **Replika** | 40M+ | No real data ingestion, learns only from chat |
| **Character.ai** | 20M+ | Entertainment, not self-knowledge |
| **Friend** (hardware) | Pre-orders | Loneliness focus, hardware dependent |

### TIER 3: Journaling/Reflection AI

| Product | Funding | Gap |
|---------|---------|-----|
| **Rosebud** | $6M | Requires manual input - no data import |
| **Reflection.app** | Unknown | Same - requires manual input |
| **Apple Journal** | Apple | Lightweight, no AI analysis |

### TIER 4: Knowledge/Productivity Tools

| Product | Gap |
|---------|-----|
| **Mem** | Work-focused, not personal self-knowledge |
| **Reflect Notes** | Notes only, no life data |
| **Notion AI** | Enterprise/productivity, not personal |

### Key Insight: The Market Gap

No one combines:
- Real data ingestion (photos, chats, emails)
- Emotional self-reflection
- Privacy-first/local
- No hardware required

**This is Newco's opportunity.**

---

## Why This Could Work

1. **Dot failed for the wrong reasons** - No data ingestion. Users had to manually tell it everything.
2. **Limitless got acquired** - Concept validated. But hardware-dependent and productivity-focused.
3. **Rosebud raised $6M** - People want AI-assisted self-reflection. But requires manual input.
4. **Replika has 40M users** - People want AI that knows them. But only learns from chat.
5. **Microsoft Recall proved appetite (and risk)** - People want searchable memory. Privacy backlash was massive.

---

## Why This Could Fail

1. **Cold start is brutal** - Value requires data depth. Magic might take weeks to appear.
2. **Creep factor is real** - Line between intimate and surveillance is razor thin.
3. **Big tech will copy** - Apple has ALL your data already. Could ship in iOS 19.
4. **Local-first is marketing, not reality** - Good AI locally is still hard.
5. **Market might be niche** - Most people don't want to see their patterns.
6. **Accuracy tolerance is zero** - If Newco gets a date wrong, trust collapses.

---

## Technical Build Plan

### Phase 1: Memory Foundation (Week 1-2)
- Photo ingestion + face clustering
- WhatsApp/iMessage export parsing
- Local vector store (SQLite + embeddings)
- Basic conversational search

### Phase 2: Understanding (Week 3-4)
- Entity extraction (people, places, events)
- Timeline construction
- Sentiment analysis across time
- Pattern detection

### Phase 3: Intelligence (Week 5-6)
- Proactive insights
- Coaching conversations
- Voice interface
- Cross-source correlation

### Phase 4: Expansion
- Email integration
- Calendar awareness
- Notes apps
- Browser history (opt-in)

### Tech Stack
```
Frontend:       Next.js (web-first, PWA)
Backend:        Next.js API routes
Database:       Supabase (auth + storage)
Vector Store:   Supabase pgvector OR local SQLite
AI:             OpenAI GPT-4o (start), local models later
File Processing: Server-side Node.js
Mobile:         PWA first, then React Native
```

---

## Business Model

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Photos + 1 chat source, basic search |
| Personal | $9.99/mo | Unlimited sources, full insights, voice |
| Pro | $19.99/mo | Cross-device, encrypted backup, deep coaching |

### Key Metrics to Watch
- Time to first "wow" moment
- Data sources connected
- Weekly active queries
- Insight engagement rate
- Retention at 30/60/90 days

---

## Cost Estimates

### Path A: Scrappy MVP (Simon + Claude)
**Timeline:** 4-6 weeks
**Cost:** R50-100k (~$3-5k)

| Item | Cost |
|------|------|
| Domain | R2,000 |
| Vercel/hosting | R500/month |
| OpenAI API (dev) | R2,000/month |
| Supabase | Free tier |
| Apple Developer | R2,000/year |
| Freelance designer | R30-50k |
| **Total MVP** | **~R50-80k** |

### Path B: Proper Indie Build
**Timeline:** 3-4 months
**Cost:** R300-500k (~$15-25k)

### Path C: Funded Startup
**Timeline:** 6-12 months
**Cost:** R3-5M+ (~$150-250k+)

---

## Name Candidates

### Available Domains (Verified December 2025)

| Domain | Meaning | Tagline | Rating |
|--------|---------|---------|--------|
| **whet.ai** | To sharpen | "Whet your mind" | ⭐⭐⭐⭐⭐ |
| **knowyou.ai** | Direct | "AI that knows you" | ⭐⭐⭐⭐⭐ |
| **lucidme.ai** | Clear + personal | "Stay lucid" | ⭐⭐⭐⭐ |
| **sharpn.ai** | Sharpen | "Get sharp" | ⭐⭐⭐⭐ |
| **selfsee.ai** | Self-reflection | "See yourself clearly" | ⭐⭐⭐⭐ |
| **lifeglass.ai** | Mirror/clarity | "Life, clarified" | ⭐⭐⭐⭐ |
| **edgd.ai** | Edged (short) | "Stay edgd" | ⭐⭐⭐ |
| **innerlog.ai** | Inner record | "Your inner log" | ⭐⭐⭐ |
| **mywitness.ai** | AI as witness | "Your life, witnessed" | ⭐⭐⭐⭐ |
| **selfglass.com** | Mirror metaphor | "See yourself" | ⭐⭐⭐ |
| **youlog.ai** | Life logged | "Your life, logged" | ⭐⭐⭐ |

### Top 3 Recommendations

1. **whet.ai** - Short, unique, means "to sharpen", premium feel
2. **knowyou.ai** - Direct value proposition, differentiates from ChatGPT
3. **lucidme.ai** - Clarity, sharpness, personal

### Taken Domains (Do Not Pursue)
- mirra.com/ai (taken)
- reflekt.com (taken)
- memora.ai (taken)
- anima.ai (taken)
- glimpse.ai (taken)
- clarity.ai (taken)
- reverie.ai (taken)

---

## Positioning

### The Gap
> "ChatGPT knows everything. Newco knows *you*."

### Tagline Options
- "See yourself clearly."
- "Your life. Remembered, reflected, understood."
- "Meet your second self."
- "Whet your edge."
- "The AI that actually knows you."

### Long-term Vision
Become the trusted home for user-owned AI identity - foundational to how people "carry themselves" digitally in the post-chatbot era.

---

## Critical Success Factors

1. **Magical first 60 seconds** - Must show value before user does work
2. **Privacy as religion** - Not just policy, cultural identity
3. **Emotional craft** - Voice, copy, timing must be perfect
4. **Compounding value** - Gets better the more you use it
5. **Clear use cases** - Not abstract "self-knowledge" but specific moments

---

## Key Use Cases

### High-frequency
- "When did I last talk to [person] and what about?"
- "Find that message where I explained [topic]"
- "What was I stressed about this time last year?"

### Occasional but powerful
- "Prepare me for meeting [person] - what do I know about them?"
- "What promises have I made that I haven't kept?"
- "What did I say I wanted to do differently?"

### Deep self-knowledge
- "What patterns do you see in my relationships?"
- "When am I most productive? Most creative?"
- "What triggers my anxiety based on my messages?"

---

## Open Questions

1. **Shared memories** - Can Newco understand relationships, not just individuals?
2. **Future self** - Help become someone, or just understand who you've been?
3. **Active interventions** - How proactive should it be?
4. **Integration with action** - Reflect only, or help you act?
5. **Crisis handling** - Mental health detection? Trauma surfacing?

---

## Next Steps

1. [ ] Register domain (whet.ai or knowyou.ai recommended)
2. [ ] Build web MVP (4-6 weeks)
3. [ ] WhatsApp export parser
4. [ ] Photo library integration
5. [ ] Basic semantic search
6. [ ] Conversational interface
7. [ ] Get 100 beta users
8. [ ] Measure addiction (daily usage, retention)
9. [ ] Decide: side project or next company?

---

## References

### Competitors Researched
- Limitless: https://www.limitless.ai/
- Kin: https://mykin.ai/
- Personal.ai: https://www.personal.ai/
- Omi: https://www.omi.me/
- Rosebud: https://www.rosebud.app/
- Replika: https://replika.com/
- Mem: https://get.mem.ai/
- Reflect: https://reflect.app/

### Key Articles
- Dot shutdown: https://techcrunch.com/2025/09/05/personalized-ai-companion-app-dot-is-shutting-down/
- Limitless/Meta acquisition: https://techstartups.com/2025/12/08/meta-acquires-ai-wearable-startup-limitless/
- Microsoft Recall controversy: https://en.wikipedia.org/wiki/Windows_Recall
- Rosebud $6M raise: https://www.rosebud.app/blog/rosebud-raises-6m-to-expand-the-worlds-leading-ai-journal

---

*Document created: 26 December 2025*
*Author: Simon Rubin + Claude*
