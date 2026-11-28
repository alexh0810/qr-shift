import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "UTC" });

const qrToken = "e2e-corrections";
const store = { id: "store-1", name: "Demo Store", qr_token: qrToken };
const employee = { id: "emp-1", name: "Alex", store_id: store.id, created_at: "2026-04-01T06:00:00.000Z" };
const me = {
  email: "manager@example.com",
  stores: [{ id: store.id, name: store.name, qr_token: qrToken, role: "manager" }],
};
const timelogs = [
  { id: "in-1", employee_id: employee.id, store_id: store.id, type: "IN", timestamp: "2026-04-20T08:00:00.000Z" },
  { id: "out-1", employee_id: employee.id, store_id: store.id, type: "OUT", timestamp: "2026-04-20T16:00:00.000Z" },
];

async function openReports(page: Page, handleReports: (method: string, body: unknown) => unknown) {
  await page.context().route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/me") {
      await route.fulfill({ json: me });
      return;
    }
    if (pathname === `/api/manager/${qrToken}/reports`) {
      const result = handleReports(request.method(), request.method() === "POST" ? request.postDataJSON() : null);
      await route.fulfill(result as Parameters<typeof route.fulfill>[0]);
      return;
    }
    await route.abort();
  });

  await page.goto(`/reports/${qrToken}`);
  const dates = page.locator('input[type="date"]');
  await dates.nth(0).fill("2026-04-20");
  await dates.nth(1).fill("2026-04-20");
  await page.getByRole("combobox").selectOption(employee.id);
}

test("manager saves a correction with a reason and sees the Edited badge", async ({ page }) => {
  const corrections: unknown[] = [];
  let posted: Record<string, unknown> | null = null;

  await openReports(page, (method, body) => {
    if (method === "POST") {
      posted = body as Record<string, unknown>;
      corrections.push({
        id: "c1",
        timelog_id: "out-1",
        old_timestamp: "2026-04-20T16:00:00.000Z",
        new_timestamp: posted.clockOutAt,
        changed_by: me.email,
        reason: posted.reason,
        created_at: "2026-04-21T09:00:00.000Z",
      });
      return { json: { ok: true, clockOutLogId: "out-1" } };
    }
    return { json: { store, employees: [employee], timelogs, corrections } };
  });

  const clockOut = page.locator('input[type="text"]:visible').nth(1);
  await clockOut.fill("18:00");
  await clockOut.press("Enter");

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Add a reason of at least 3 characters.");
  await dialog.getByLabel("Reason").fill("Forgot to clock out");
  await dialog.getByRole("button", { name: "Save change" }).click();

  await expect(dialog).toBeHidden();
  expect(posted).toMatchObject({ reason: "Forgot to clock out" });
  await expect(page.getByText("Edited")).toBeVisible();
  await page.getByText("Edited").click();
  await expect(page.getByText(/by manager@example\.com/)).toContainText("Forgot to clock out");
});

test("cancelling the reason dialog saves nothing", async ({ page }) => {
  let posts = 0;

  await openReports(page, (method) => {
    if (method === "POST") {
      posts += 1;
      return { json: { ok: true, clockOutLogId: "out-1" } };
    }
    return { json: { store, employees: [employee], timelogs, corrections: [] } };
  });

  const clockOut = page.locator('input[type="text"]:visible').nth(1);
  const before = await clockOut.inputValue();
  await clockOut.fill("18:00");
  await clockOut.press("Enter");
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(clockOut).toHaveValue(before);
  expect(posts).toBe(0);
});

test("a failed save shows the error and reverts the edit", async ({ page }) => {
  await openReports(page, (method) =>
    method === "POST"
      ? { status: 400, json: { error: "reason_required", message: "Add a reason of at least 3 characters." } }
      : { json: { store, employees: [employee], timelogs, corrections: [] } },
  );

  const clockOut = page.locator('input[type="text"]:visible').nth(1);
  const before = await clockOut.inputValue();
  await clockOut.fill("18:00");
  await clockOut.press("Enter");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason").fill("Forgot to clock out");
  await dialog.getByRole("button", { name: "Save change" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Add a reason of at least 3 characters.")).toBeVisible();
  await expect(clockOut).toHaveValue(before);
});
