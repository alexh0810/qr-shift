# Phase 03 Smoke Checklist

Run these checks at phone width and desktop width after Phase 3 changes land.

## Landing `/`

- Confirm the home route opens on landing by default with no automatic session resume redirect.
- Confirm the landing hero leads with scan-first product proof before manager workspace proof.
- Confirm the landing page is organized into four sections: Hero, Product Snapshot, Best Fit, and CTA.
- Confirm the manager proof uses real QRShift product framing rather than invented marketing-only UI.
- Confirm the main CTA still opens the demo booking link and the contact CTA still uses `mailto:`.

## Scan `/scan/[qr_token]`

- Confirm the scan route remains standalone and does not show manager workspace navigation.
- Confirm an employee can select a name, see the current action, and complete clock in or clock out.
- Confirm the scan surface still feels mobile-first and the primary action remains easy to tap on phone width.

## Dashboard `/dashboard/[qr_token]`

- Confirm `PinGuard` still requires the manager PIN when `localStorage` does not contain `store_[qr_token]_unlocked`.
- Confirm the unlock copy explicitly describes a device-level demo workspace boundary and says it is not full account authentication.
- Confirm the dashboard renders inside the shared manager workspace frame with dashboard and reports navigation.
- Confirm the install panel can be dismissed and the install CTA still depends on `beforeinstallprompt`.
- Confirm live on-shift and off-shift panels still render correctly after unlock.

## Reports `/reports/[qr_token]`

- Confirm reports load inside the same manager workspace shell used by the dashboard.
- Confirm date-range refresh still works and CSV export remains available when report data exists.
- Confirm the page still supports all-employees and single-employee review without layout breakage on mobile or desktop.

## Admin `/admin/create-store`

- Confirm the admin route still creates a store, generates the QR route, and stays visually separate from the manager workspace.
- Confirm the success state still exposes the generated `/scan/[qr_token]`, `/dashboard/[qr_token]`, and `/reports/[qr_token]` routes clearly.

## Installed PWA Note

- If QRShift was already installed before the Phase 3 rebrand, refresh the installed app or reinstall it so the updated name, theme, and icon metadata replace stale cached PWA branding.
