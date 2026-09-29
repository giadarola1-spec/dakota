# Impeccable Design System & AI Coding Rules

This repository integrates **Impeccable** (`pbakaus/impeccable`), an out-of-distribution design skill pack and UI quality detector for frontend web applications.

## Impeccable Rules & Directives

Whenever designing, reviewing, modifying, or creating UI components in this project:

### 1. Read Project Truth & Design Tokens
- Consult `PRODUCT.md` for durable product truth, user workflows, and platform constraints.
- Consult `DESIGN.md` for normative design tokens, color schemas, typography hierarchy, and shape radii.

### 2. The Anti-Slop Ban List
Never output recognized AI-generated UI clichés:
- **No side-tab borders**: No thick colored lines on just the left side of a card (`border-l-4`).
- **No nested cards**: Never place cards inside cards with identical borders and padding.
- **No generic gradients**: Ban purple-to-blue / cyan gradients, gradient text, and arbitrary neon glassmorphism.
- **No overused default fonts**: Do not default to plain Inter, Geist, or Roboto without intentional hierarchy. Use `Geologica` and native monospace.
- **No gray text on colored backgrounds**: Ensure WCAG AA compliance (minimum 4.5:1 contrast for body copy).
- **Nested Border Radius Rule**: Maintain mathematical radius nesting (`Inner Radius = Outer Radius - Padding`).

### 3. Impeccable Skills & CLI Commands
The project has `impeccable` installed in `devDependencies` and its engine available in `.agents/skills/impeccable/`:
- `npm run detect`: Runs the 61-rule deterministic UI detector across `src/` to catch anti-patterns and design issues.
- Available skill commands:
  - `/polish`: Final quality pass for spacing, alignment, typography, and contrast.
  - `/critique`: UX and heuristic review of visual hierarchy and interaction models.
  - `/audit`: Technical quality checks for accessibility, responsive behavior, and performance.
  - `/typeset`: Typography review to elevate fonts, hierarchy, sizing, and line height.
  - `/layout`: Spacing and visual rhythm improvements on grid and flex containers.
  - `/adapt`: Device, tablet, and responsive screen adaptation.

### 4. Logistics Precision Principle
- Dakota is a local, privacy-first logistics assistant.
- Never introduce server-side telemetry or external tracking of load documents.
- Keep dispatch chains, stops, and copyable fields instantly accessible and high-density.
