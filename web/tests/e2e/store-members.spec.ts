import { expect, test } from "@playwright/test";

const store = { id: "s1", name: "Main Cafe", qr_token: "qr-s1", created_at: "2026-04-01T00:00:00.000Z" };

test("owner adds and removes a manager", async ({ page }) => {
  let members = [{ email: "owner@example.com", role: "owner" }];
  let addBody: unknown;
  let removedPath = "";

  await page.context().route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/me") {
      await route.fulfill({ json: { email: "owner@example.com", stores: [{ ...store, role: "owner" }] } });
    } else if (pathname === "/api/admin/stores") {
      await route.fulfill({ json: { stores: [store] } });
    } else if (pathname === "/api/admin/stores/s1/employees") {
      await route.fulfill({ json: { store, employees: [] } });
    } else if (pathname === "/api/admin/stores/s1/members" && request.method() === "GET") {
      await route.fulfill({ json: { members } });
    } else if (pathname === "/api/admin/stores/s1/members") {
      addBody = request.postDataJSON();
      members = [...members, { email: "mia@example.com", role: "manager" }];
      await route.fulfill({ json: { member: members[1] } });
    } else if (request.method() === "DELETE" && pathname.startsWith("/api/admin/stores/s1/members/")) {
      removedPath = pathname;
      members = members.slice(0, 1);
      await route.fulfill({ json: { ok: true } });
    } else {
      await route.abort();
    }
  });

  await page.goto("/admin");
  await page.getByRole("button", { name: "Manage roster" }).click();
  await expect(page.getByText("owner@example.com")).toBeVisible();

  await page.getByLabel("Manager email").fill("mia@example.com");
  await page.getByRole("button", { name: "Add manager" }).click();
  await expect(page.getByText("mia@example.com")).toBeVisible();
  expect(addBody).toEqual({ email: "mia@example.com" });
  await expect(page.getByRole("button", { name: "Remove owner@example.com" })).toHaveCount(0);

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Remove mia@example.com" }).click();
  await expect(page.getByText("mia@example.com")).toHaveCount(0);
  expect(removedPath).toBe("/api/admin/stores/s1/members/mia%40example.com");
});

test("signed-out visitors see the sign-in form on the admin page without loading stores", async ({ page }) => {
  const requested: string[] = [];
  await page.context().route("**/api/**", async (route) => {
    requested.push(new URL(route.request().url()).pathname);
    await route.fulfill({ status: 401, json: { error: "unauthenticated", message: "Sign in to continue." } });
  });

  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Sign in to QRShift" })).toBeVisible();
  await page.waitForTimeout(500);
  expect(requested).not.toContain("/api/admin/stores");
});
