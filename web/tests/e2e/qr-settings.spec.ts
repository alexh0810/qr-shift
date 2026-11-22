import { expect, test } from "@playwright/test";

const store = { id: "s1", name: "Main Cafe", qr_token: "qr-s1", created_at: "2026-04-01T00:00:00.000Z" };

test("owner switches to display mode, sets location and resets the link", async ({ page }) => {
  let settings = { qr_mode: "printed", has_location: false, lat: null, lng: null, radius_m: 100, display_key: null } as Record<string, unknown>;
  let locationBody: unknown;
  let reissued = 0;

  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 60.1699, longitude: 24.9384 });
  await page.context().route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const base = "/api/admin/stores/s1/";
    if (pathname === "/api/me") {
      await route.fulfill({ json: { email: "owner@example.com", stores: [{ ...store, role: "owner" }] } });
    } else if (pathname === "/api/admin/stores") {
      await route.fulfill({ json: { stores: [store] } });
    } else if (pathname === `${base}employees`) {
      await route.fulfill({ json: { store, employees: [] } });
    } else if (pathname === `${base}members`) {
      await route.fulfill({ json: { members: [{ email: "owner@example.com", role: "owner" }] } });
    } else if (pathname === `${base}qr-settings`) {
      await route.fulfill({ json: settings });
    } else if (pathname === `${base}qr-mode`) {
      settings = { ...settings, qr_mode: request.postDataJSON().qr_mode, display_key: request.postDataJSON().qr_mode === "display" ? "key-one" : null };
      await route.fulfill({ json: settings });
    } else if (pathname === `${base}location`) {
      locationBody = request.postDataJSON();
      settings = { ...settings, has_location: true, lat: 60.1699, lng: 24.9384 };
      await route.fulfill({ json: settings });
    } else if (pathname === `${base}display-key/reset`) {
      settings = { ...settings, display_key: "key-two" };
      await route.fulfill({ json: settings });
    } else if (pathname === `${base}qr/reissue`) {
      reissued += 1;
      await route.fulfill({ json: { ok: true } });
    } else {
      await route.abort();
    }
  });

  await page.goto("/admin");
  await page.getByRole("button", { name: "Manage roster" }).click();
  await expect(page.getByRole("button", { name: "Printed QR" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Display link")).toHaveCount(0);

  await page.getByRole("button", { name: "Display QR" }).click();
  await expect(page.getByLabel("Display link")).toHaveValue(/\/display\/s1#key-one$/);

  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText("60.16990, 24.93840")).toBeVisible();
  expect(locationBody).toEqual({ lat: 60.1699, lng: 24.9384, radius_m: 100 });

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Reset display link" }).click();
  await expect(page.getByLabel("Display link")).toHaveValue(/#key-two$/);

  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: "Reissue QR" }).click();
  expect(reissued).toBe(0);
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Reissue QR" }).click();
  await expect(page.getByText("QR reissued.")).toBeVisible();
  expect(reissued).toBe(1);
});
