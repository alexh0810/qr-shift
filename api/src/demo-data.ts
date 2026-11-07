import { subDays, set } from "date-fns";

export interface DemoTimelogInput {
  employeeName: string;
  type: "IN" | "OUT";
  timestamp: Date;
}

export interface DemoStoreSeed {
  storeName: string;
  pin: string;
  employeeNames: string[];
  timelogs: DemoTimelogInput[];
}

const DEMO_EMPLOYEES = ["Kim", "Alex", "Maria", "Noah"];

function atDay(baseDate: Date, daysAgo: number, hours: number, minutes: number): Date {
  return set(subDays(baseDate, daysAgo), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  });
}

function addShift(
  collection: DemoTimelogInput[],
  employeeName: string,
  clockIn: Date,
  clockOut?: Date,
) {
  collection.push({
    employeeName,
    type: "IN",
    timestamp: clockIn,
  });

  if (clockOut) {
    collection.push({
      employeeName,
      type: "OUT",
      timestamp: clockOut,
    });
  }
}

export function buildDemoStoreSeed(referenceDate = new Date()): DemoStoreSeed {
  const timelogs: DemoTimelogInput[] = [];

  addShift(timelogs, "Kim", atDay(referenceDate, 6, 9, 0), atDay(referenceDate, 6, 13, 0));
  addShift(timelogs, "Kim", atDay(referenceDate, 6, 14, 0), atDay(referenceDate, 6, 18, 0));
  addShift(timelogs, "Kim", atDay(referenceDate, 2, 19, 30), atDay(referenceDate, 2, 19, 35));
  addShift(timelogs, "Kim", atDay(referenceDate, 2, 19, 38), atDay(referenceDate, 2, 21, 50));

  addShift(timelogs, "Alex", atDay(referenceDate, 5, 8, 30), atDay(referenceDate, 5, 16, 45));
  addShift(timelogs, "Alex", atDay(referenceDate, 4, 8, 45), atDay(referenceDate, 4, 12, 0));
  addShift(timelogs, "Alex", atDay(referenceDate, 4, 12, 30), atDay(referenceDate, 4, 17, 15));
  addShift(timelogs, "Alex", atDay(referenceDate, 0, 9, 0));

  addShift(timelogs, "Maria", atDay(referenceDate, 3, 7, 0), atDay(referenceDate, 3, 15, 0));
  addShift(timelogs, "Maria", atDay(referenceDate, 1, 10, 0), atDay(referenceDate, 1, 10, 0));
  addShift(timelogs, "Maria", atDay(referenceDate, 1, 10, 5), atDay(referenceDate, 1, 14, 35));

  addShift(timelogs, "Noah", atDay(referenceDate, 6, 22, 0), atDay(referenceDate, 5, 2, 0));
  addShift(timelogs, "Noah", atDay(referenceDate, 2, 11, 0), atDay(referenceDate, 2, 17, 0));
  addShift(timelogs, "Noah", atDay(referenceDate, 2, 17, 20), atDay(referenceDate, 2, 20, 0));

  return {
    storeName: "Demo Payroll Store",
    pin: "1234",
    employeeNames: DEMO_EMPLOYEES,
    timelogs: timelogs.sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime()),
  };
}
