# Figma-to-Code Execution Task (STRICT MODE)

You are working inside my project repository.

Your task is to take the provided Figma link and execute a **precise, controlled Figma → Code implementation** following the rules below.

---

## TASK MODE: STRICT EXECUTION

- No redesign
- No assumptions
- No creative interpretation
- No touching unrelated parts of the codebase
- No questions — act based on available data

---

## FIGMA SOURCE

Figma link:
https://www.figma.com/design/7PlNcJ5BjWztGqYNYfsH2D/MARCO?node-id=101-2781&m=dev

Node:
101:2781 → "MARCO HOME"

IMPORTANT:
- This is a FULL PAGE frame (very large)
- DO NOT attempt to implement the entire page blindly
- You MUST break it down into sections

---

## EXECUTION FLOW

### STEP 1 — Analyze Figma Structure

- Parse the full page structure
- Identify all major sections (examples):
  - HEADER
  - HERO
  - REELS
  - SPECIAL
  - NEWS
  - BRANDS
  - BANNERS
  - APP BANNER
  - FOOTER
  - etc.

- Treat EACH section as an independent unit

---

### STEP 2 — Match With Codebase

Scan the repository and map each Figma section to existing components.

Expected mapping (verify in code):

- HERO → HomeBanner
- REELS → HomeReelsSection
- SPECIAL → HomeSpecialOffersSection
- NEWS → HomeProductSection
- BRANDS → HomeBrandsSection
- APP BANNER → HomeAppPromoBanner
- BANNERS → HomeSecondaryBanners
- CHAT → HomeChatFab

Main entry:
- src/app/page.tsx

---

### STEP 3 — Determine Status PER SECTION

For EACH section:

- Output:
  - FOUND
  - NOT FOUND

- Identify exact files responsible

---

### STEP 4 — IF FOUND (PRIMARY PATH)

For each FOUND section:

DO NOT rebuild.

You MUST:

- Compare against Figma visually
- Fix ALL UI mismatches

Fix:

- spacing
- layout structure
- alignment
- typography
- colors
- border radius
- shadows
- button styles
- card styles
- image ratios
- container widths
- paddings / margins
- responsiveness

STRICT RULES:

- Preserve logic
- Preserve data flow
- Preserve props
- Preserve structure
- Do NOT refactor unnecessarily
- Do NOT rewrite components

---

### STEP 5 — IF NOT FOUND

Only for missing sections:

- Build from scratch based on Figma
- Follow existing project architecture
- Use existing components when possible
- Keep consistent styling approach

---

### STEP 6 — REUSABILITY ENFORCEMENT

Before creating anything new:

- Search for existing:
  - UI components
  - layout wrappers
  - tokens
  - shared styles

If similar exists → reuse it

DO NOT duplicate logic or UI

---

### STEP 7 — RESPONSIVENESS

- Must work on desktop / tablet / mobile
- Do NOT break existing responsive behavior
- If Figma shows only desktop:
  - infer other breakpoints carefully
  - follow existing patterns in project

---

### STEP 8 — CODE QUALITY

- Keep files clean
- Avoid large files
- No dead code
- No hacks
- Only minimal necessary changes

---

## OUTPUT FORMAT (MANDATORY)

### BEFORE CHANGES

For EACH section:

Section: [NAME]  
Status: FOUND / NOT FOUND  
Files: [list of exact files]

---

### AFTER IMPLEMENTATION

- List what was fixed
- List what was created
- Keep explanation concise

---

## HARD CONSTRAINTS

- Do NOT change business logic
- Do NOT break functionality
- Do NOT redesign UI
- Do NOT simplify design
- Do NOT touch unrelated files
- Do NOT skip small visual mismatches
- Do NOT implement entire page at once

---

## EXECUTION PRIORITY

1. Accuracy > speed  
2. Reuse > new code  
3. Fix > rebuild  

---

## FINAL RULE

Work section-by-section.

DO NOT proceed globally across the whole page.

Fix one section → then move to next.