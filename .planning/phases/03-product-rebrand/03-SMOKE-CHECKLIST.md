# Phase 03 Smoke Checklist

Use this checklist after Phase 3 UI changes land. Verify on one phone-width viewport and one desktop-width viewport.

## Setup

1. Open a fresh browser session or private window.
2. If QRShift was already installed to the home screen, reinstall the PWA after manifest or icon changes so the latest branding is visible.
3. Use a valid demo `qr_token` that has store, employee, and timelog data available.

## `/scan/[qr_token]`

1. Visit `/scan/[qr_token]` on a phone-width viewport.
2. Confirm the page loads without manager workspace navigation and remains focused on clock in/out.
3. Confirm employee selection, current status messaging, and scan actions still work.
4. Repeat on a desktop-width viewport and confirm spacing still feels readable without stretching the main scan card too wide.

## `/dashboard/[qr_token]`

1. Visit `/dashboard/[qr_token]`.
2. Confirm the manager PIN gate appears first on a locked browser, unlock still works, and locking the workspace clears access on refresh.
3. Confirm the install prompt can appear when supported and dismiss cleanly.
4. Confirm live attendance groups still separate on-shift and off-shift employees correctly.
5. Check phone-width and desktop-width layouts to ensure header controls, cards, and lists remain usable.

## `/reports/[qr_token]`

1. Visit `/reports/[qr_token]`.
2. Confirm the same manager PIN unlock behavior still applies if the device is locked.
3. Change the date range, refresh calculations, switch employee views, and verify report data still updates.
4. Export a CSV and confirm the download still succeeds.
5. Check phone-width and desktop-width layouts, including horizontal table overflow where needed.

## `/admin/create-store`

1. Visit `/admin/create-store`.
2. Confirm the form still creates a store and generates a QR code without browser alert regressions.
3. Confirm helper copy, hierarchy, and spacing stay readable on phone-width and desktop-width viewports.
4. If store creation seeds demo data, confirm the seeded flow still points to a working `/scan/[qr_token]` path.
