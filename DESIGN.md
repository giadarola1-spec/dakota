---
name: Dakota Dispatch Assistant
description: High-density, precision logistics interface for rapid rate confirmation parsing and dispatch chain generation.
colors:
  surface-dark: "#090a0f"
  surface-dark-card: "rgba(18, 20, 29, 0.75)"
  surface-light: "#f8fafc"
  surface-light-card: "rgba(255, 255, 255, 0.85)"
  primary-accent: "#3b82f6"
  accent-emerald: "#10b981"
  accent-amber: "#f59e0b"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  border-light: "rgba(0, 0, 0, 0.08)"
  text-primary-dark: "#f1f5f9"
  text-secondary-dark: "#94a3b8"
  text-primary-light: "#0f172a"
  text-secondary-light: "#64748b"
typography:
  display:
    fontFamily: '"Geist", "Geist Fallback", sans-serif'
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Geist", "Geist Fallback", sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
  caption:
    fontFamily: '"Geist", "Geist Fallback", sans-serif'
    fontSize: "11px"
  micro:
    fontFamily: '"Geist", "Geist Fallback", sans-serif'
    fontSize: "10px"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "13px"
  logo:
    fontFamily: "Geologica, -apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.surface-dark-card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge:
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

## Overview
Dakota is designed for high-throughput logistics dispatchers who prioritize scanability, speed, and zero error tolerance. The visual direction balances modern frosted translucency ("liquid glass") with strict information hierarchy, monospace data alignment, and crisp contrast.

## Colors
- **Core Dark Neutrals**: Deep obsidian canvas (`#090a0f`) paired with semi-translucent glass panels for low eye-strain during extended night shifts.
- **Core Light Neutrals**: Crisp off-white slate (`#f8fafc`) with subtle neutral borders.
- **Semantic Accents**:
  - Emerald (`#10b981`) for pickup validations, success toasts, and copied states.
  - Amber (`#f59e0b`) for pending fields, delivery appointments, and warnings.
  - Blue (`#3b82f6`) for active links, primary action triggers, and active tabs.

## Typography
- **Primary Body & Display**: `Geologica` — a distinctive geometric grotesque with high legibility at dense data scales and crisp technical proportions.
- **Data & Codes**: Native monospace font stack for load numbers, timestamps, zip codes, and custom chain tokens.

## Layout
- **Density**: High-density utility workbench. Prioritizes horizontal scanning of origins, stops, and destinations.
- **Spacing Math**: Strict 8pt grid (`8px`, `16px`, `24px`, `32px`). Container outer padding always equals or exceeds child spacing.

## Elevation & Depth
- Flattened visual hierarchy: subtle 1px border dividers (`rgba(255, 255, 255, 0.08)`) and high-efficiency backdrop blur rather than heavy, diffuse drop-shadows.
- Z-axis logic: elevated interactive controls (modals, popovers) use lighter backgrounds and elevated contrast.

## Shapes
- Outer containers: `rounded-2xl` (16px).
- Inner elements & controls: mathematically nested (`Inner Radius = Outer Radius - Padding`).
- Buttons & pills: `rounded-lg` or `rounded-full` for status badges.

## Components
- **Upload Glare Card**: Interactive dropzone with smooth 3D tilt and ambient sheen reacting to cursor movement.
- **Stop Sequence Card**: Chronological vertical flow of pickups and deliveries with distinct stop markers.
- **Chain Token Builder**: Interactive visual pills that can be re-ordered, added, and configured with instant output preview.
- **Action Copy Buttons**: Micro-interactive buttons with tactile active states and instant visual confirmation.

## Do's and Don'ts
### Do:
- Keep all rate confirmation numbers and identifiers in monospace.
- Ensure 1-click copy functionality on all generated fields with clear feedback.
- Maintain WCAG AA contrast on both dark and light modes.
- Preserve full local offline processing for sensitive rate documents.

### Don't:
- Never use thick colored side-tab borders (`border-l-4`) on cards.
- Never nest standard cards inside cards with redundant borders.
- Never use generic purple-to-cyan AI gradients or neon glowing shadows.
- Avoid cluttered decorative badges that do not correspond to actionable logistics data.
