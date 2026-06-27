import { scryptSync, randomBytes, timingSafeEqual, createHmac, randomInt } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "lovon_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Derive a stable signing secret (stateless HMAC sessions, no DB needed)
const SESSION_SECRET = process.env.SESSION_SECRET || scryptSync(
  process.env.DATABASE_URL || "lovon-fallback-secret",
  "lovon-session-salt",
  32
).toString("hex");

function sign(data: string): string {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(scryptSync(password, salt, 64));
  const storedBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== storedBuf.length) return false;
  return timingSafeEqual(hashBuf, storedBuf);
}

export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

export function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function createSession(userId: string) {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = JSON.stringify({ userId, expires });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = sign(encoded);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${signature}.${encoded}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return signature;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length < 2) return null;
  try {
    const signature = parts[0];
    const encoded = parts.slice(1).join(".");
    // Verify HMAC signature to prevent session forgery
    const expectedSig = sign(encoded);
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (!payload.userId || !payload.expires) return null;
    if (Date.now() > payload.expires) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
