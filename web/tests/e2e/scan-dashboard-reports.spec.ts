import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

type TimelogRecord = {
  id: string;
  employee_id: string;
  store_id: string;
  type: "IN" | "OUT";
  timestamp: string;
};

const qrToken = "e2e-qr-token";
const store = {
  id: "store-1",
  name: "Demo Store",
  qr_token: qrToken,
};
const employee = {
  id: "emp-1",
  name: "Alex",
  store_id: store.id,
  created_at: "2026-04-26T06:00:00.000Z",
};

const me = {
  email: "manager@example.com",
  stores: [{ id: store.id, name: store.name, qr_token: qrToken, role: "manager" }],
};

function todayAt(hour: number, minute: number) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

test("employee can clock in, manager can verify dashboard, and reports can export csv", async ({ page }) => {
  const timelogs: TimelogRecord[] = [];

  const latestLogForEmployee = () => timelogs.at(-1) ?? null;

  const buildRosterPayload = () => ({
    store,
    employees: [
      {
        employee,
        latest_log: latestLogForEmployee(),
        status: latestLogForEmployee()?.type === "IN" ? "IN" : "OUT",
      },
    ],
  });

  const buildDashboardPayload = () => ({
    store,
    employees: [
      {
        employee,
        latest_log: latestLogForEmployee(),
        status: latestLogForEmployee()?.type === "IN" ? "IN" : "OUT",
      },
    ],
  });

  const buildReportsPayload = () => ({
    store,
    employees: [employee],
    timelogs,
  });

  await page.context().route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname === `/api/stores/${qrToken}`) {
      await route.fulfill({ json: { store } });
      return;
    }

    if (pathname === `/api/stores/${qrToken}/employees`) {
      await route.fulfill({ json: buildRosterPayload() });
      return;
    }

    if (pathname === `/api/stores/${qrToken}/clock`) {
      const body = request.postDataJSON() as { employeeId?: string; requestedAction?: "IN" | "OUT" };
      const latestLog = latestLogForEmployee();
      const expectedAction = latestLog?.type === "IN" ? "OUT" : "IN";

      if (body.employeeId !== employee.id || body.requestedAction !== expectedAction) {
        await route.fulfill({
          status: 400,
          json: { error: "This shift status changed. Go back and try again." },
        });
        return;
      }

      const timestamp = todayAt(9, 0);
      timelogs.push({
        id: `log-${timelogs.length + 1}`,
        employee_id: employee.id,
        store_id: store.id,
        type: body.requestedAction,
        timestamp,
      });

      await route.fulfill({
        json: {
          action: body.requestedAction,
          timestamp,
        },
      });
      return;
    }

    if (pathname === "/api/me") {
      await route.fulfill({ json: me });
      return;
    }

    if (pathname === `/api/manager/${qrToken}/dashboard`) {
      await route.fulfill({ json: buildDashboardPayload() });
      return;
    }

    if (pathname === `/api/manager/${qrToken}/reports`) {
      await route.fulfill({ json: buildReportsPayload() });
      return;
    }

    await route.abort();
  });

  await page.goto(`/scan/${qrToken}`);

  await expect(page.getByRole("heading", { name: "Clock in or out" })).toBeVisible();
  await page.getByRole("button", { name: /Alex/i }).click();
  await expect(page.getByText("Current status")).toBeVisible();
  await page.getByRole("button", { name: "Clock In Now" }).click();
  await expect(page.getByRole("heading", { name: "Clocked in" })).toBeVisible();

  await page.goto(`/dashboard/${qrToken}`);


  await expect(page.getByRole("heading", { name: "Demo Store" })).toBeVisible();
  await expect(page.getByText("1 on shift")).toBeVisible();
  await expect(page.getByText("Alex")).toBeVisible();

  await page.getByRole("link", { name: "Open Reports" }).click();

  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: /^All employees$/ })).toBeVisible();
  await expect(page.getByRole("table").getByText("Alex")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(download.suggestedFilename()).toContain("Timesheet.csv");
  expect(downloadPath).not.toBeNull();

  const csvContent = await readFile(downloadPath as string, "utf8");
  expect(csvContent).toContain(
    "\"Employee Name\",\"Work Day\",\"Clock In\",\"Clock Out\",\"Shift Duration\",\"Total Hours Worked\",\"Days Worked\",\"Location\"",
  );
  expect(csvContent).toContain("\"Alex\"");
  expect(csvContent).toContain("\"Ongoing\"");
});

test("signed-out visitors see the sign-in form instead of the dashboard", async ({ page }) => {
  await page.context().route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/me") {
      await route.fulfill({ status: 401, json: { error: "unauthenticated", message: "Sign in to continue." } });
      return;
    }
    await route.abort();
  });

  await page.goto(`/dashboard/${qrToken}`);

  await expect(page.getByRole("heading", { name: "Sign in to QRShift" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create your QRShift account" })).toBeVisible();
});

test("signed-in users without membership of the store see no dashboard", async ({ page }) => {
  await page.context().route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/me") {
      await route.fulfill({ json: { email: "stranger@example.com", stores: [] } });
      return;
    }
    await route.abort();
  });

  await page.goto(`/dashboard/${qrToken}`);

  await expect(page.getByText("You don't have access to this store.")).toBeVisible();
  await expect(page.getByText("stranger@example.com")).toBeVisible();
});
