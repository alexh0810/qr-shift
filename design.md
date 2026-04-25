# QRShift Design System Refresh

## Design Philosophy

**Core Principle: Purposeful Simplicity**

Every element must earn its place. Remove visual noise, reduce cognitive load, and let the product speak through clear hierarchy and intentional whitespace. The redesign shifts from a "feature showcase" aesthetic to a confident, professional tool that business owners trust.

---

## Color System

### Primary Palette (4 colors total)

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-primary` | `#1a56db` | `#3b82f6` | Primary actions, active states, brand accent |
| `--color-foreground` | `#111827` | `#f9fafb` | Headings, primary text, high-emphasis content |
| `--color-muted` | `#6b7280` | `#9ca3af` | Secondary text, labels, supporting content |
| `--color-background` | `#ffffff` | `#0f172a` | Page background, card surfaces |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#059669` | Clock-in states, confirmations |
| `--color-border` | `#e5e7eb` (light) / `#1e293b` (dark) | Subtle dividers, card borders |

### Removal Checklist

- Remove `--color-accent-signal` (teal) - consolidate to primary blue
- Remove `--color-bg-elevated` gradient backgrounds
- Remove `--shadow-panel` heavy shadows - replace with subtle 1-2px shadows or none
- Remove `qr-grid-accent` decorative grid pattern from functional areas

---

## Typography

### Font Stack

- **Display/Headings:** Inter (switch from Space Grotesk for cleaner numerics and better readability)
- **Body:** Inter
- **Mono:** Geist Mono (keep for time values and data)

### Scale

| Use | Size | Weight | Line Height |
|-----|------|--------|-------------|
| Page Title | 32px / 2rem | 600 | 1.2 |
| Section Title | 20px / 1.25rem | 600 | 1.3 |
| Card Title | 16px / 1rem | 600 | 1.4 |
| Body | 14px / 0.875rem | 400 | 1.5 |
| Label/Caption | 12px / 0.75rem | 500 | 1.4 |
| Small/Micro | 11px / 0.6875rem | 500 | 1.3 |

### Typography Rules

- Remove ALL-CAPS tracking-wide labels except for very small status badges
- Use sentence case for section titles and descriptions
- Reduce letter-spacing on headings from `-0.055em` to `-0.02em`
- Remove decorative eyebrow text (e.g., "Scan -> Monitor -> Export")

---

## Spacing & Layout

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Inline spacing |
| `--space-3` | 12px | Component internal padding |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-6` | 24px | Major section separation |
| `--space-8` | 32px | Page-level margins |

### Border Radius

| Use | Radius |
|-----|--------|
| Buttons, inputs | 8px |
| Cards, panels | 12px |
| Modal/page containers | 16px |

**Removal:** Eliminate `rounded-[28px]`, `rounded-[24px]`, `rounded-[22px]` mega-radius values. Maximum radius should be 16px.

---

## Component Simplification

### Landing Page

**Before:** Dense feature showcase with nested preview frames, multiple badges, and decorative sections.

**After:** Clean, scannable layout with:

1. **Header:** Logo + single CTA button ("Book Demo")
2. **Hero:** Clear headline, 1-2 sentence value prop, single CTA
3. **Product Visual:** One clean screenshot or illustration (not nested UI previews)
4. **How It Works:** 3 simple steps with icons - no product preview frames
5. **Social Proof:** Optional testimonial or "Trusted by X businesses"
6. **CTA Footer:** Repeat primary action

**Specific Removals:**
- Remove `ProductPreviewFrame` component - replace with static images or simple illustrations
- Remove nested component demos (ScanActionPanel, ShiftStatusPanel in landing)
- Remove "QR-first attendance" badge
- Remove "Scan -> Monitor -> Export" tagline in header
- Remove feature chips ("No app install", "No staff login")
- Remove "Best fit" section listing business types

**Additions:**
- Add breathing room with larger section padding
- Add one testimonial or trust indicator
- Add subtle background texture or gradient (not the grid pattern)

### Dashboard Page

**Before:** Heavy header with supporting content chips, eyebrow text, multiple badges, and dense stat cards.

**After:**

1. **Minimal Header:**
   - Store name as page title
   - Current date/time as subtle meta
   - Single "Open Reports" link (text link, not button)
   - Remove eyebrow, status badge, supporting content chips

2. **Summary Stats:**
   - Reduce from 4 cards to 2-3 essential metrics
   - Remove icons from stat cards
   - Remove descriptions from stat cards
   - Simple: "On Shift: 2" and "Total Employees: 6"

3. **Shift Panels:**
   - Remove WorkspacePanel wrapper header (eyebrow, descriptions)
   - Simple section title: "Currently Working" and "Off Shift"
   - Cleaner list items without status tone colors

**Component Changes:**
- `ManagerWorkspaceHeader`: Remove `eyebrow`, `statusBadge`, `supportingContent` props
- `WorkspaceStatCard`: Remove `description`, `icon` props - value + label only
- `ShiftStatusPanel`: Simplify to minimal list without decorative elements

### Reports Page

**Before:** Complex export controls panel, multiple stat cards, dense header.

**After:**

1. **Simple Header:**
   - "Reports" as page title
   - Date range picker inline (not in a panel)
   - Export button in header

2. **Quick Stats:**
   - Total hours and employee count only
   - Remove "Rows" and "View" stat cards

3. **Data Table:**
   - Remove panel wrapper
   - Direct table with clear headers
   - Remove mobile card layout complexity - use responsive table

**Specific Removals:**
- Remove `WorkspacePanel` wrapper around date controls
- Remove panel descriptions
- Remove eyebrow text throughout

---

## Button Styles

### Primary

```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
}
```

### Secondary

```css
.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-foreground);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
}
```

**Removal:**
- Remove uppercase text on buttons
- Remove letter-spacing on buttons
- Remove icon + text buttons where text alone suffices
- Remove minimum height constraints (use padding instead)

---

## Input Styles

```css
input, select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  background: var(--color-background);
}

input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.1);
}
```

---

## Card Styles

```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
}
```

**Removal:**
- Remove `shadow-[var(--shadow-panel)]` heavy shadows
- Remove `border-border-strong` - use single border token
- Remove gradient backgrounds on cards

---

## BrandMark Simplification

**Before:** Complex QR-grid with multiple colored squares and decorative pattern.

**After:** Simple wordmark or minimal logomark.

```tsx
// Simplified BrandMark
export function BrandMark({ showWordmark = true }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-white font-bold text-sm">QR</span>
      </div>
      {showWordmark && (
        <span className="font-semibold text-lg text-foreground">QRShift</span>
      )}
    </div>
  );
}
```

**Removal:**
- Remove `qr-grid-accent` background
- Remove multi-colored corner squares
- Remove "Scan. Track. Export." tagline

---

## Navigation Simplification

### ManagerWorkspaceShell

**Before:** Heavy frame with grid pattern, workspace label, nested navigation.

**After:** Clean top bar with:
- Logo (left)
- Tab navigation: Dashboard | Reports (center or left-aligned)
- Lock/Settings icon (right)

Remove:
- `qr-grid-accent` header background
- "Manager workspace" label
- Decorative borders and shadows
- Nested border frames

---

## Scan Page

The scan page for employees should remain simple and focused:

1. Large employee name
2. Current status indicator
3. Single action button (Clock In / Clock Out)
4. Success confirmation

**Simplifications:**
- Remove "QRShift action" eyebrow
- Remove "Review your status" instructional text
- Remove "Next action" info box - the button label is sufficient
- Remove back button text - use simple arrow icon

---

## CSS Variables Update

Replace `globals.css` with:

```css
:root {
  --color-primary: #1a56db;
  --color-primary-hover: #1648b8;
  --color-foreground: #111827;
  --color-muted: #6b7280;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-success: #059669;
  --color-error: #dc2626;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

.dark {
  --color-primary: #3b82f6;
  --color-primary-hover: #60a5fa;
  --color-foreground: #f9fafb;
  --color-muted: #9ca3af;
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: 'Inter', system-ui, sans-serif;
}
```

---

## File-by-File Changes

### High Priority

| File | Action |
|------|--------|
| `globals.css` | Replace color system, remove decorative utilities |
| `tailwind.config.ts` | Simplify color tokens, update radius scale |
| `layout.tsx` | Switch to Inter font, remove Space Grotesk |
| `page.tsx` (landing) | Complete rewrite with simplified sections |
| `BrandMark.tsx` | Simplify to minimal mark + wordmark |

### Medium Priority

| File | Action |
|------|--------|
| `ManagerWorkspaceShell.tsx` | Remove decorative header, simplify nav |
| `ManagerWorkspaceHeader.tsx` | Remove eyebrow, statusBadge, supportingContent |
| `WorkspaceStatCard.tsx` | Remove description, icon, simplify styling |
| `WorkspacePanel.tsx` | Reduce padding, remove heavy borders |
| `dashboard/[qr_token]/page.tsx` | Reduce stat cards, simplify header |
| `reports/[qr_token]/page.tsx` | Inline controls, reduce panels |

### Lower Priority

| File | Action |
|------|--------|
| `ShiftStatusPanel.tsx` | Simplify list styling |
| `ScanActionPanel.tsx` | Remove instructional text |
| `AllEmployeesTimesheetTable.tsx` | Simplify table styling |

---

## Implementation Order

1. **Foundation:** Update `globals.css` and `tailwind.config.ts` with new tokens
2. **Typography:** Switch fonts in `layout.tsx`
3. **Brand:** Simplify `BrandMark.tsx`
4. **Shell:** Update `ManagerWorkspaceShell.tsx`
5. **Components:** Simplify stat cards and panels
6. **Pages:** Update dashboard and reports pages
7. **Landing:** Complete landing page redesign

---

## Success Metrics

After redesign, the interface should:

- Load visually in < 1 second (reduced CSS complexity)
- Be scannable in < 3 seconds (clear hierarchy)
- Have < 5 distinct visual treatments per page
- Use maximum 2 font weights per page
- Feel "quiet" and professional, not "busy" and startup-y
