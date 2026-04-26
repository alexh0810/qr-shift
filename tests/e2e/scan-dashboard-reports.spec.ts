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
const managerPin = "1234";
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

function todayAt(hour: number, minute: number) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

test("employee can clock in, manager can verify dashboard, and reports can export csv", async ({ page }) => {
  let managerAuthenticated = false;
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
    const { pathname, searchParams } = url;

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

    if (pathname === "/api/manager/session" && searchParams.get("qr_token") === qrToken) {
      await route.fulfill({ json: { authenticated: managerAuthenticated } });
      return;
    }

    if (pathname === "/api/manager/session") {
      if (request.method() === "POST") {
        const body = request.postDataJSON() as { qr_token?: string; pin?: string };
        if (body.qr_token === qrToken && body.pin === managerPin) {
          managerAuthenticated = true;
          await route.fulfill({ json: { ok: true } });
          return;
        }

        await route.fulfill({ status: 401, json: { error: "Incorrect PIN. Please try again." } });
        return;
      }

      if (request.method() === "DELETE") {
        managerAuthenticated = false;
        await route.fulfill({ json: { ok: true } });
        return;
      }
    }

    if (pathname === `/api/manager/${qrToken}/dashboard`) {
      if (!managerAuthenticated) {
        await route.fulfill({ status: 401, json: { error: "Manager access is required." } });
        return;
      }

      await route.fulfill({ json: buildDashboardPayload() });
      return;
    }

    if (pathname === `/api/manager/${qrToken}/reports`) {
      if (!managerAuthenticated) {
        await route.fulfill({ status: 401, json: { error: "Manager access is required." } });
        return;
      }

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

  await page.getByLabel("Manager PIN").fill(managerPin);
  await page.getByRole("button", { name: "Open dashboard" }).click();

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
    "\"Employee Name\",\"Work Day\",\"Clock In\",\"Clock Out\",\"Shift Duration\",\"Total Hours Worked\",\"Days Worked\"",
  );
  expect(csvContent).toContain("\"Alex\"");
  expect(csvContent).toContain("\"Ongoing\"");
});
