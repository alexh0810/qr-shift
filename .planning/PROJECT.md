# QRShift

## What This Is

QRShift is a simple, QR-based time tracking tool for small businesses to replace paper timesheets and generate payroll-ready reports. Employees clock in and out by scanning a QR code with no app installs or logins, while managers monitor shifts and export clean attendance data. The current milestone is turning the demo into a sharper product experience through a public landing page and a more unified, recognizable QRShift visual identity, and Phases 1 and 2 have already established the brand foundation and public-facing landing page for that work.

## Core Value

Clock in with a QR code. No apps. No logins. Payroll-ready in seconds.

## Requirements

### Validated

- ✓ Employees can clock in and out through a QR-based flow without logging in — existing
- ✓ Managers can view who is currently working from a store dashboard — existing
- ✓ Managers can generate payroll-ready reports and export CSV data — existing
- ✓ QRShift has a documented brand system with shared typography, color tokens, and structured UI rules — Phase 1
- ✓ QRShift has reusable styling primitives and a branded proof surface to guide later screens — Phase 1
- ✓ Visitors can understand QRShift, see core benefits, and identify best-fit business types from the homepage — Phase 2
- ✓ The homepage now exposes public demo and contact CTAs while keeping an internal demo path secondary — Phase 2

### Active

- [ ] The product UI feels clean, operational, and distinctly QRShift across the landing page and core demo flows
- [ ] The demo feels polished enough for customer and investor conversations while preserving the current lightweight attendance workflow

### Out of Scope

- Authentication, role systems, and account management — not needed for the current QR-plus-PIN demo model
- Payments, subscriptions, and Stripe integration — not part of the demo-first release
- Multi-language support — English only for v1
- Native mobile apps — browser-first PWA is sufficient for now
- Scheduling, shift planning, notifications, analytics, and AI features — outside the core clocking and payroll value
- Backend rewrite, microservices, or moving away from Firebase — too heavy for the current solo-builder phase
- Blog, CMS, or broader content marketing system — simple landing page only
- Advanced enterprise security or compliance-heavy payroll workflows — not required for this release

## Context

QRShift already exists as a working demo app built in Next.js with Firebase/Firestore and a mobile-first UI. The current product proves the core operational loop: employees can clock in and out, managers can monitor shifts, and payroll-ready reports can be generated. The codebase map shows that the reports module is already the strongest modular area and that the app remains intentionally lightweight, client-driven, and cost-effective for a solo founder.

The next milestone is about product positioning and visual confidence more than backend complexity. The business face of QRShift needs to live in the same Next.js app for simplicity and cost control. The landing page should clearly explain the product, target small single-location businesses with ten or fewer hourly staff, and convert interest into either a Calendly demo booking or a direct email contact. The app itself should feel more branded and intentional without becoming industrial, generic, or overdesigned.

Best-fit customers for this version are small cafés and bubble tea shops, takeaway restaurants, salons, and small retail shops where the owner is often on-site, staff turnover is relatively high, and time tracking still happens through paper or spreadsheets. The product is explicitly not targeting chains, corporate offices, construction teams, GPS-tracked field teams, or compliance-heavy payroll environments.

## Constraints

- **Tech stack**: Stay within the existing Next.js and Firebase architecture — keep the demo maintainable for a solo builder
- **Cost**: Keep hosting and implementation simple — avoid adding separate marketing infrastructure or heavyweight services
- **Product scope**: Every feature must directly strengthen clock in/out speed, shift visibility, or payroll clarity — prevents overbuilding
- **Delivery priority**: Demo polish comes before pilot-hardening — the next release should improve trust, clarity, and presentation first
- **Platform**: Keep the experience browser-based and mobile-friendly — no native apps in this release
- **Content**: Landing page lives inside the same app and uses simple conversion paths — Calendly for demo booking and `mailto:` for contact
- **Language**: English only — no localization work in this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep the landing page inside the existing Next.js app | Lowest-cost way to add a public business face without creating a second system | ✓ Confirmed |
| Optimize for demo-readiness before pilot-hardening | The immediate need is customer-facing polish and trust during conversations | ✓ Confirmed |
| Use Calendly for demo booking | It gives a fast, no-custom-backend conversion path that notifies the founder automatically | ✓ Implemented via site config |
| Use direct email for contact CTA | It keeps contact simple and avoids building a form backend for v1 | ✓ Implemented via site config |
| Focus on small single-location businesses with hourly staff | This segment matches the current lightweight product shape and founder capacity | ✓ Confirmed |
| Keep QR + PIN as the current access model for this milestone | The goal is polish and positioning, not an auth-system rewrite | ✓ Confirmed |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after Phase 2 completion*
