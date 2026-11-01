import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type { FastifyReply, FastifyRequest } from "fastify";

// shortcut: PIN + signed-cookie sessions are carried over unchanged so the cutover is transparent; phase 3 replaces them with Firebase Authentication.

export const MANAGER_SESSION_COOKIE = "qrshift_manager_session";
export const OWNER_SESSION_COOKIE = "qrshift_owner_session";
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
  return `${encodedPayload}.${signValue(encodedPayload, secret)}`;
}

function verifySignedValue(value: string, secret: string): ManagerSessionPayload | OwnerSessionPayload | null {
  const [encodedPayload, providedSignature] = value.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(signValue(encodedPayload, secret));
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as
      | ManagerSessionPayload
      | OwnerSessionPayload;
    return payload.exp && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function cookieOptions() {
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
    { kind: "manager", storeId, qrToken, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 },
    getRequiredEnv("MANAGER_SESSION_SECRET"),
  );
}

export function createOwnerSessionValue() {
  return createSignedValue(
    { kind: "owner", exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 },
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

export function getManagerSession(request: FastifyRequest) {
  return readManagerSessionFromValue(request.cookies[MANAGER_SESSION_COOKIE]);
}

export function getOwnerSession(request: FastifyRequest) {
  return readOwnerSessionFromValue(request.cookies[OWNER_SESSION_COOKIE]);
}

export function setManagerSessionCookie(reply: FastifyReply, storeId: string, qrToken: string) {
  reply.setCookie(MANAGER_SESSION_COOKIE, createManagerSessionValue(storeId, qrToken), cookieOptions());
}

export function clearManagerSessionCookie(reply: FastifyReply) {
  reply.setCookie(MANAGER_SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export function setOwnerSessionCookie(reply: FastifyReply) {
  reply.setCookie(OWNER_SESSION_COOKIE, createOwnerSessionValue(), cookieOptions());
}

export function clearOwnerSessionCookie(reply: FastifyReply) {
  reply.setCookie(OWNER_SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export function isManagerSessionAuthorized(session: ManagerSessionPayload | null, qrToken: string) {
  return Boolean(session && session.qrToken === qrToken);
}

export function verifyOwnerSecret(secret: string) {
  const providedBuffer = Buffer.from(secret);
  const expectedBuffer = Buffer.from(getRequiredEnv("OWNER_SETUP_SECRET"));
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

const scrypt = promisify(scryptCallback);
const SCRYPT_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(pin, salt, KEY_LENGTH)) as Buffer;
  return [SCRYPT_PREFIX, salt.toString("base64url"), derivedKey.toString("base64url")].join("$");
}

export async function verifyPin(pin: string, pinHash: string) {
  const [prefix, saltValue, hashValue] = pinHash.split("$");
  if (prefix !== SCRYPT_PREFIX || !saltValue || !hashValue) {
    return false;
  }
  const expected = Buffer.from(hashValue, "base64url");
  const actual = (await scrypt(pin, Buffer.from(saltValue, "base64url"), expected.length)) as Buffer;
  return timingSafeEqual(actual, expected);
}
