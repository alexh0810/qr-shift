# Phase 03 Smoke Checklist

Use this checklist after Phase 3 UI work and before external demos. Verify each route at one phone width and one desktop width.

## Viewports

- Mobile: `390 x 844`
- Desktop: `1440 x 900`

## Route Checks

### `/`

- Confirm the landing page loads without redirecting unless local session resume intentionally applies.
- Confirm the hero tells the `Scan -> Monitor -> Export` story and the dashboard is the dominant preview.
- Confirm the landing preview uses shipped product components rather than a conceptual mock panel or invented dashboard cards.
- Confirm the landing preview framing is decorative only: no conceptual mock data blocks, fake sidebars, or alternate manager navigation patterns.

### `/scan/[qr_token]`

- Confirm the scan route stays standalone and does not show manager workspace navigation.
- Confirm the employee can pick a name, see the next action clearly, and complete the clock flow.
- Confirm loading, success, and error states stay readable on mobile and desktop widths.

### `/dashboard/[qr_token]`

- Confirm the manager shell loads with branded workspace framing and dashboard navigation.
- Confirm `PinGuard` still blocks access until the manager PIN is entered.
- Confirm the unlock copy states this is a demo gate on the current device and does not imply full authentication.
- Confirm the dashboard still shows current on-shift and off-shift status correctly.
- Confirm the lock action clears the local device unlock and requires the PIN again.
- Confirm the install banner can appear from `beforeinstallprompt`, matches the workspace styling, and can be dismissed.

### `/reports/[qr_token]`

- Confirm the reports page uses the same manager shell language as the dashboard.
- Confirm the date range controls, refresh action, employee filter, inline edits, and `Export Payroll Report` still work.
- Confirm totals, counts, and table content remain readable on mobile and desktop widths.
- Confirm the lock action still removes the device unlock and returns the route to `PinGuard`.

### `/admin/create-store`

- Confirm the admin route remains separate from the manager workspace and scan route.
- Confirm store creation still works, including QR generation and PIN creation.
- Confirm the page hierarchy, helper copy, and form controls remain usable on mobile and desktop widths.

## PWA Reinstall Note

- If an already-installed PWA still shows old branding, reinstall the PWA and reopen the route checks above.
- Confirm the installed app name, icon treatment, and launch surface match QRShift after reinstall the PWA on the test device.
