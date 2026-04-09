# Concerns

## Security and Privacy

- `Critical`: Manager PIN protection is client-side only. The PIN is fetched into the browser, compared locally, cached in `localStorage`, and surfaced in the unlock experience. That is acceptable for a private demo but not a real security boundary.
- `Critical`: Store PINs are stored and returned as plain client-readable data rather than protected secrets.
- `High`: Attendance writes, store creation, and demo seeding are all client-originated. Without a backend policy layer in the repo, production safety depends entirely on Firestore rules outside version control.
- `High`: The QR scan page exposes employee names and current working status to anyone with the QR URL.

## Operational and Demo Risks

- `High`: Admin onboarding and demo seeding are publicly reachable from the home page, which can allow uncontrolled data creation if Firestore rules are permissive.
- `High`: The scan page allows any person at the QR page to clock any listed employee in or out.
- `Medium`: Report corrections currently live only in UI state, so exported payroll can diverge from stored timelogs without any audit trail.
- `Medium`: Session resume and unlock flows rely on `localStorage`, which is risky on shared demo devices.

## Scalability Risks

- `High`: The scan view performs N+1-style timelog reads and derives status by loading and sorting full employee histories.
- `High`: The dashboard subscribes to all timelogs for a store and recomputes current status from the full dataset on each update.
- `Medium`: Reports fetch full store timelog history for the selected period and aggregate in the browser, which will become costly for larger stores or long reporting ranges.

## Maintainability Risks

- `High`: Firestore rules and backend enforcement are not present in the repository, leaving the highest-risk control surface undocumented in code.
- `Medium`: CI does not currently run a production build or broader integration checks.
- `Medium`: Automated tests are concentrated in payroll math while authentication, data access, export behavior, and PWA flows remain lightly covered.
- `Low`: PWA details are still demo-grade, including a naming mismatch between `QRShift` and `Shiftly` and a network-only service worker.

## Recommended Follow-Up Themes

- Introduce a real authorization boundary for manager and admin actions.
- Version Firestore rules in the repository and review them alongside application changes.
- Add purpose-built status queries or summaries to reduce repeated full-history scans.
- Expand CI to include `next build` and targeted integration tests for the highest-risk user flows.
