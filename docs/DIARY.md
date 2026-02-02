# HIREINBOX - Engineering Diary

> Pattern from Anthropic engineers: Document what works, what fails, and why.
> This compounds into faster future development.

---

## Entry 001 - 21 Dec 2024

### Task: Training Data Pipeline Setup

**What was tried:**
1. ES module imports in Node.js 24 - FAILED (compatibility issues)
2. Standalone .mjs file with direct imports - SUCCESS

**What failed and why:**
- `import { x } from './module.js'` failed because Node.js 24 has stricter ES module resolution
- Environment variable passing to background processes failed - API key not found

**What worked:**
- Created `generate-all.mjs` as standalone script with inline functions
- Passed API key directly in command: `OPENAI_API_KEY="..." node generate-all.mjs`
- Rate limiting (5s between calls) prevents OpenAI throttling

**Patterns to reuse:**
- For Node.js background tasks, use `.mjs` extension and inline code
- Always pass sensitive env vars directly in command for background tasks
- Add rate limiting for any bulk API calls

---

## Entry 002 - 21 Dec 2024

### Task: MCP Server Configuration

**What was tried:**
1. Adding GitHub, Filesystem, Git, Sentry, Playwright MCPs

**What worked:**
- `claude mcp add` command with `--scope project` stores in `.mcp.json`
- Servers configured but need Claude restart to activate

**What failed and why:**
- MCPs show "Failed to connect" until Claude Code restarts

**Patterns to reuse:**
- MCP changes require Claude restart
- Use `--scope project` to share config with team via git
- Sensitive data (passwords) should use environment variables

---

## Entry 003 - 21 Dec 2024

### Task: Documentation Organization

**What was tried:**
1. Scattered docs on Desktop - messy
2. Consolidated into `hireinbox/docs/` subfolder - clean

**What worked:**
- Single `docs/` folder with all markdown files
- `docs/todo/` subfolder for bucket checklists
- CLAUDE.md stays in root (auto-loaded)

**Patterns to reuse:**
- Keep all project docs in `docs/` folder
- Use consistent naming: `HIREINBOX_*.md`
- README.md and CLAUDE.md stay in root

---

## Entry 004 - 21 Dec 2024

### Task: Strategic Research & Pricing Revision

**What was tried:**
1. 50+ source research on AI recruitment competitors
2. Pricing strategy revision from "cheap" to "premium but accessible"
3. Partner presentation materials creation

**What worked:**
- Comprehensive intelligence report covering: HireVue ($35K+), Eightfold ($50K-200K), Paradox, Greenhouse
- New pricing: B2C R79-349, B2B R699-5,999/mo, B2R R1,499-14,999/mo
- Partner teaser in PDF format (visual one-pager)
- Executive summary with 8 key takeaways

**Key insights discovered:**
- We're 180x cheaper than HireVue but were underpricing ourselves
- "Build a Ferrari, price like a BMW" - premium but accessible to SA SMEs
- Evidence-based AI (showing WHY) is our unique moat vs "black box" competitors
- WhatsApp = 10x market expansion opportunity (90% Africa vs 10% email)
- B2Recruiter segment = highest ARPU, most pain to solve

**Patterns to reuse:**
- Position on VALUE not price ("10x value at 1/10th price")
- Free tier = prove value, not charity (5 CVs B2B, 10 CVs B2R)
- ROI calculators make pricing decisions easy (15-16x ROI shown)
- PDF one-pagers for partners beat walls of text

**Documents created:**
- docs/COMPETITIVE_INTELLIGENCE_REPORT.md
- docs/B2RECRUITER_GAME_CHANGER.md
- docs/BILLION_DOLLAR_ROADMAP.md
- docs/PRICING_STRATEGY_V2.md
- Desktop/HIREINBOX_PARTNER_TEASER.md + .pdf
- Desktop/HIREINBOX_INTELLIGENCE_EXECUTIVE_SUMMARY.md + .pdf

---

## Entry 005 - 26 Jan 2026

### Task: PDF Parsing on Vercel Production

**Problem:**
CV PDFs were parsing correctly locally (12,600+ chars from Meagan Kahn CV) but returning empty/short text on Vercel production, causing 0% AI screening scores.

**What was tried:**
1. `pdf-parse` alone - FAILED on Vercel (works locally)
2. `unpdf` as primary - PARTIAL (designed for serverless but still had issues)
3. ConvertAPI (cloud API) - EXPIRED (API key no longer valid)

**What failed and why:**
- `pdf-parse` on Vercel: Uses Node.js-specific features (`fs`, `path`) that don't bundle correctly in serverless. Also has a bug where it looks for `./test/data/05-versions-space.pdf` on startup.
- Root cause: Next.js bundles these packages, breaking their Node.js-specific code paths.

**What worked:**
1. Added `serverExternalPackages` in `next.config.ts`:
   ```typescript
   serverExternalPackages: [
     'pdf-parse',
     'unpdf',
     'pdfjs-dist',
     'pdf2json',
     'mammoth',
   ],
   ```
   This tells Next.js to NOT bundle these packages and instead load them as native Node modules at runtime.

2. Improved `extractPDFText()` with 3 fallback methods:
   - Method 1: `unpdf` (serverless-optimized, primary)
   - Method 2: `pdf-parse` (fallback)
   - Method 3: `pdf2json` (second fallback)

3. Added diagnostic logging:
   - PDF header validation (`%PDF-` magic bytes)
   - Buffer size validation
   - Detailed error messages with stack traces
   - Success/failure logging for each method

**Key files changed:**
- `/next.config.ts` - Added serverExternalPackages
- `/src/app/api/fetch-emails/route.ts` - Improved extractPDFText function

**Patterns to reuse:**
- ANY package using Node.js-specific features (fs, path, crypto native) needs `serverExternalPackages` on Vercel
- Always validate input before processing (check PDF magic bytes, buffer size)
- Multiple fallback methods for critical functionality
- Extensive logging in production for serverless debugging (check Vercel Function Logs)
- Test locally AND on Vercel - they behave differently

**Reference:**
- https://github.com/vercel/community/discussions/5278
- https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages

---

## Template for Future Entries

```markdown
## Entry XXX - DD Mon YYYY

### Task: [Brief description]

**What was tried:**
1. First approach - RESULT
2. Second approach - RESULT

**What failed and why:**
- [Specific failure] because [root cause]

**What worked:**
- [Specific solution]

**Patterns to reuse:**
- [Generalizable insight for future work]
```

---

*This diary is updated after each significant task. Review it before starting similar work.*
