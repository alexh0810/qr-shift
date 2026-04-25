---
status: investigating
trigger: "Investigate why manager dashboard requests return 401 even though MANAGER_SESSION_SECRET is configured. Focus on the manager session flow in this workspace: `src/components/PinGuard.tsx`, `src/app/dashboard/[qr_token]/page.tsx`, `src/app/reports/[qr_token]/page.tsx`, `src/app/api/manager/session/route.ts`, `src/app/api/manager/[qr_token]/dashboard/route.ts`, and `src/lib/server-auth.ts`. Determine the most likely root cause and whether the issue is session creation/verification or page flow timing. Return a concise diagnosis with file references and a recommended fix. Do not edit files."
created: 2026-04-25T00:00:00+03:00
updated: 2026-04-25T00:00:00+03:00
---

## Current Focus

hypothesis: manager dashboard 401s are caused either by invalid/absent session cookies during verification or by dashboard/report pages requesting protected data before the session cookie is established
test: read the manager session creation, verification, and page request flow end-to-end; then compare cookie write timing and cookie read expectations
expecting: one of the code paths will show a deterministic mismatch that explains 401s despite a configured MANAGER_SESSION_SECRET
next_action: read the manager session flow files completely and trace the request sequence

## Symptoms

expected: manager dashboard requests should authenticate successfully after manager PIN unlock when MANAGER_SESSION_SECRET is configured
actual: manager dashboard requests return 401
errors: HTTP 401 from manager dashboard requests
reproduction: unlock manager access and load dashboard/report data for a store token
started: unknown

## Eliminated

## Evidence

## Resolution

root_cause:
fix:
verification:
files_changed: []
