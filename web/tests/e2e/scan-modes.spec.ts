import { expect, test } from "@playwright/test";

const store = { id: "store-d", name: "Display Cafe", qr_token: "qr-d", qr_mode: "display" };
const employee = {
  id: "emp-d",
  store_id: "store-d",
  name: "Dana",
  status: "active",
  created_at: "2026-04-01T00:00:00.000Z",
};
const roster = { store, employees: [{ employee, latest_log: null, status: "OUT" }] };
const ticket = { storeId: "store-d", exp: Date.now() + 120_000, mac: "m" };

test("display-mode scan needs a fresh QR and sends the ticket with the clock call", async ({ page }) => {
  let clockBody: unknown = null;
  let clockContentType: string | undefined;

  await page.context().route("**/api/**", async (route) => {
    const { pathname, searchParams } = new URL(route.request().url());
    if (pathname === "/api/stores/qr-d/employees") {
      await route.fulfill({ json: roster });
    } else if (pathname === "/api/stores/qr-d/scan-ticket") {
      if (searchParams.get("sig") === "good") {
        await route.fulfill({ json: { ticket } });
      } else {
        await route.fulfill({ status: 403, json: { error: "qr_expired", message: "expired" } });
      }
    } else if (pathname === "/api/stores/qr-d/clock") {
      clockBody = route.request().postDataJSON();
      clockContentType = route.request().headers()["content-type"];
      await route.fulfill({ json: { action: "IN", timestamp: new Date().toISOString() } });
    } else {
      await route.abort();
    }
  });

  await page.goto("/scan/qr-d?w=1&sig=stale");
  await expect(page.getByRole("heading", { name: "QR code expired" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dana/i })).toHaveCount(0);

  await page.goto("/scan/qr-d");
  await expect(page.getByRole("heading", { name: "QR code expired" })).toBeVisible();

  await page.goto("/scan/qr-d?w=1&sig=good");
  await page.getByRole("button", { name: /Dana/i }).click();
  await expect(page.getByText("Current status")).toBeVisible();
  expect(page.url()).not.toContain("sig=");
  await page.getByRole("button", { name: "Clock In Now" }).click();
  await expect(page.getByRole("heading", { name: "Clocked in" })).toBeVisible();
  expect(clockContentType).toContain("application/json");
  expect(clockBody).toMatchObject({ employeeId: "emp-d", requestedAction: "IN", ticket: { storeId: "store-d", mac: "m" } });
});

test("a ticket that expired mid-session shows the scan-again panel", async ({ page }) => {
  await page.context().route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/stores/qr-d/employees") {
      await route.fulfill({ json: roster });
    } else if (pathname === "/api/stores/qr-d/scan-ticket") {
      await route.fulfill({ json: { ticket } });
    } else if (pathname === "/api/stores/qr-d/clock") {
      await route.fulfill({ status: 403, json: { error: "qr_expired", message: "expired" } });
    } else {
      await route.abort();
    }
  });

  await page.goto("/scan/qr-d?w=1&sig=good");
  await page.getByRole("button", { name: /Dana/i }).click();
  await expect(page.getByText("Current status")).toBeVisible();
  await page.getByRole("button", { name: "Clock In Now" }).click();
  await expect(page.getByRole("heading", { name: "QR code expired" })).toBeVisible();
});

test("a transient ticket failure keeps the signature and blocks clocking", async ({ page }) => {
  await page.context().route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/stores/qr-d/employees") {
      await route.fulfill({ json: roster });
    } else if (pathname === "/api/stores/qr-d/scan-ticket") {
      await route.fulfill({ status: 500, json: { error: "internal_error", message: "boom" } });
    } else {
      await route.abort();
    }
  });

  await page.goto("/scan/qr-d?w=1&sig=good");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dana/i })).toHaveCount(0);
  expect(page.url()).toContain("sig=good");
});
