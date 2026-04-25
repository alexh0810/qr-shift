import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

const MANAGER_SESSION_COOKIE = "qrshift_manager_session";
const OWNER_SESSION_COOKIE = "qrshift_owner_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface ManagerSessionPayload {
  kind: "manager";
  storeId: string;
  qrToken: string;
  exp: number;
}

export interface OwnerSessionPayload {
  kind: "owner";
  exp: number;
}

function getRequiredEnv(name: "MANAGER_SESSION_SECRET" | "OWNER_SETUP_SECRET") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function createSignedValue(payload: ManagerSessionPayload | OwnerSessionPayload, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function verifySignedValue(
  value: string,
  secret: string,
): ManagerSessionPayload | OwnerSessionPayload | null {
  const [encodedPayload, providedSignature] = value.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as
      | ManagerSessionPayload
      | OwnerSessionPayload;

    if (!payload.exp || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function createManagerSessionValue(storeId: string, qrToken: string) {
  return createSignedValue(
    {
      kind: "manager",
      storeId,
      qrToken,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    },
    getRequiredEnv("MANAGER_SESSION_SECRET"),
  );
}

export function createOwnerSessionValue() {
  return createSignedValue(
    {
      kind: "owner",
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    },
    getRequiredEnv("OWNER_SETUP_SECRET"),
  );
}

export function readManagerSessionFromValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const payload = verifySignedValue(value, getRequiredEnv("MANAGER_SESSION_SECRET"));
  return payload?.kind === "manager" ? payload : null;
}

export function readOwnerSessionFromValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const payload = verifySignedValue(value, getRequiredEnv("OWNER_SETUP_SECRET"));
  return payload?.kind === "owner" ? payload : null;
}

export function getManagerSession(request: NextRequest) {
  return readManagerSessionFromValue(request.cookies.get(MANAGER_SESSION_COOKIE)?.value);
}

export function getOwnerSession(request: NextRequest) {
  return readOwnerSessionFromValue(request.cookies.get(OWNER_SESSION_COOKIE)?.value);
}

export function setManagerSessionCookie(response: NextResponse, storeId: string, qrToken: string) {
  response.cookies.set(MANAGER_SESSION_COOKIE, createManagerSessionValue(storeId, qrToken), buildCookieOptions());
}

export function clearManagerSessionCookie(response: NextResponse) {
  response.cookies.set(MANAGER_SESSION_COOKIE, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
}

export function setOwnerSessionCookie(response: NextResponse) {
  response.cookies.set(OWNER_SESSION_COOKIE, createOwnerSessionValue(), buildCookieOptions());
}

export function clearOwnerSessionCookie(response: NextResponse) {
  response.cookies.set(OWNER_SESSION_COOKIE, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
}

export function isManagerSessionAuthorized(session: ManagerSessionPayload | null, qrToken: string) {
  return Boolean(session && session.qrToken === qrToken);
}

export function verifyOwnerSecret(secret: string) {
  const expectedSecret = getRequiredEnv("OWNER_SETUP_SECRET");
  const providedBuffer = Buffer.from(secret);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
