# Requirements: QRShift

**Defined:** 2026-04-09
**Core Value:** Clock in with a QR code. No apps. No logins. Payroll-ready in seconds.

## v1 Requirements

### Marketing Site

- [ ] **MKTG-01**: Visitor can understand what QRShift does within 10 seconds of landing on the homepage
- [ ] **MKTG-02**: Visitor can see QRShift's core benefits and best-fit business types without leaving the homepage
- [ ] **MKTG-03**: Visitor can request a demo through a Calendly call-to-action from the homepage
- [ ] **MKTG-04**: Visitor can contact the founder through a direct email call-to-action from the homepage

### Brand System

- [ ] **BRAND-01**: The product uses a consistent visual system for color, typography, spacing, and core UI patterns
- [ ] **BRAND-02**: The overall interface feels clean, operational, and distinctly QRShift rather than generic dashboard UI
- [ ] **BRAND-03**: Shared styling primitives exist so future product screens can follow the same design language

### Product Experience

- [ ] **UX-01**: Existing scan, dashboard, reports, and admin demo flows remain functional after the visual refresh
- [ ] **UX-02**: Core product screens remain clear and usable on both mobile and desktop after redesign
- [ ] **UX-03**: The landing page gives first-time visitors a clear path into the product demo experience

### Demo Release

- [ ] **DEMO-01**: The overall product presentation is polished enough for customer and investor demos
- [ ] **DEMO-02**: The release can be validated with a concise QA checklist covering the landing page and core app flows

## v2 Requirements

### Authentication

- **AUTH-01**: Manager and admin access use a real authentication and authorization system
- **AUTH-02**: User sessions persist securely without exposing secrets in the browser

### Operations

- **SCHED-01**: Manager can create and manage shift schedules
- **NOTIF-01**: Manager and staff receive useful attendance or shift notifications
- **ANALYT-01**: Manager can view analytics beyond raw attendance and payroll totals

### Commercial

- **BILL-01**: QRShift supports subscriptions, plans, and billing management
- **CMS-01**: Marketing content can be managed without editing code

### Platform

- **LOC-01**: Product supports multiple languages
- **MOB-01**: Product has a dedicated native mobile app experience

## Out of Scope

| Feature | Reason |
|---------|--------|
| User login and account management | Not needed for the QR-plus-PIN demo-first release |
| Role-based permissions | Too heavy for current scope and tied to future auth work |
| Subscription billing and Stripe integration | Not part of the current product validation milestone |
| Multi-language support | English only in this release |
| Native iOS or Android app | Browser-based PWA is sufficient for now |
| Scheduling and shift planning | Does not directly support the immediate clocking/reporting value |
| Notifications and alerts | Deferred until the core demo presentation is stronger |
| Advanced analytics dashboard | Not required for the next release goal |
| AI features | No direct value for this milestone |
| Backend rewrite or microservices | Conflicts with the keep-it-simple solo-builder constraint |
| Blog or CMS | The landing experience should stay simple and code-managed |
| Enterprise payroll compliance tooling | Outside the intended small-business demo scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 1 | Pending |
| BRAND-03 | Phase 1 | Pending |
| MKTG-01 | Phase 2 | Pending |
| MKTG-02 | Phase 2 | Pending |
| MKTG-03 | Phase 2 | Pending |
| MKTG-04 | Phase 2 | Pending |
| UX-03 | Phase 2 | Pending |
| BRAND-02 | Phase 3 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| DEMO-01 | Phase 4 | Pending |
| DEMO-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after roadmap creation*
