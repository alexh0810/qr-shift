# Testing

## Current Coverage

- The main automated coverage is a custom payroll-oriented unit test suite.
- Tests focus on report and payroll math behaviors such as:
  - basic IN and OUT pairing
  - missing OUT fallback handling
  - duplicate IN handling
  - cross-day shifts
  - micro-shift filtering
  - grouped summaries
  - demo data behavior
  - performance expectations on larger datasets

## Test Tooling

- Tests run through `npm test`.
- The current setup uses `sucrase-node` rather than a full framework like Jest or Vitest.
- CI runs `npm ci`, `npm run lint`, and `npm test`.

## What Is Working Well

- The most business-critical calculation logic is pure and testable.
- Report math changes can be validated quickly without a browser.
- CI is lightweight and fast, which supports rapid demo iteration.

## Current Gaps

- No component tests for report views, employee filtering, or inline corrections.
- No integration tests for Firestore data access behavior.
- No end-to-end tests for QR scan flow, dashboard flow, or CSV export.
- No automated verification that `next build` passes in CI.
- No coverage reporting or quality gates beyond lint and the current test script.

## Highest-Value Next Tests

- Firestore mapping tests for document-to-app model conversion.
- Report UI tests for employee filtering, subtotal rendering, and export behavior.
- End-to-end tests for manager PIN gating and clock in/out behavior.
- A CI build step using `next build` to catch production-only regressions.

## Confidence Level

- Confidence is strongest in payroll calculation logic.
- Confidence is weaker in security-sensitive flows, realtime behavior, and browser-only interactions because they are largely untested.
