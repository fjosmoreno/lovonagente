import { db } from "./db";

// Lovon domain validation
const LOVON_DOMAINS = ["lovon.com.br", "lovon.bio", "lovon.com"];

export function isValidLovonUrl(url: string): boolean {
  if (!url) return false;
  try {
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return LOVON_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

export function extractHandle(url: string): string {
  try {
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const parsed = new URL(u);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || parsed.hostname.split(".")[0];
  } catch {
    return "";
  }
}

export async function generateUniqueHandle(base: string): Promise<string> {
  let handle = base.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "agente";
  let candidate = handle;
  let i = 1;
  while (true) {
    const exists = await db.agent.findUnique({ where: { handle: candidate } });
    if (!exists) return candidate;
    candidate = `${handle}-${i++}`;
    if (i > 999) return `${handle}-${Date.now().toString(36)}`;
  }
}

// shadeColor: lighten/darken a hex color by percent (-100..100)
export function shadeColor(hex: string, percent: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const amt = Math.round(2.55 * percent);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

// Email validation
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// normalize: lowercase + remove accents
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1);
}

// Rate limiting (in-memory) with periodic cleanup to prevent memory leaks
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_MAP_MAX = 10000;
let lastCleanup = Date.now();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  // Periodic cleanup of expired entries (every 60s or when map grows too large)
  if (now - lastCleanup > 60000 || rateMap.size > RATE_MAP_MAX) {
    for (const [k, v] of rateMap) {
      if (now > v.resetAt) rateMap.delete(k);
    }
    lastCleanup = now;
  }
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs };
  }
  if (entry.count >= max) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count++;
  return { ok: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// base64 size check (max 2MB)
export function isBase64UnderSize(base64: string, maxMB: number): boolean {
  try {
    const data = base64.split(",")[1] || base64;
    const sizeBytes = Math.ceil((data.length * 3) / 4);
    return sizeBytes <= maxMB * 1024 * 1024;
  } catch {
    return false;
  }
}

export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
