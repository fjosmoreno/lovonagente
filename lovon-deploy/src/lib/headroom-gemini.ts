// Lovon Agent — Headroom compression wrapper for Gemini SDK
// Lazy-loaded only when HEADROOM_ENABLED=1; falls back to raw SDK silently.
import type { GenerativeModel } from "@google/generative-ai";

type WrapFn = <T extends GenerativeModel>(model: T) => T;

let cachedWrap: WrapFn | null = null;
let loadAttempted = false;

function loadHeadroom(): Promise<WrapFn | null> {
  if (loadAttempted) return Promise.resolve(cachedWrap);
  loadAttempted = true;

  if (process.env.HEADROOM_ENABLED !== "1") {
    cachedWrap = null;
    return Promise.resolve(null);
  }

  return import("headroom-ai/gemini")
    .then((mod) => {
      const fn = (mod as { withHeadroom?: WrapFn }).withHeadroom;
      if (typeof fn !== "function") {
        console.warn("[headroom-gemini] withHeadroom not exported by headroom-ai/gemini");
        return null;
      }
      cachedWrap = fn;
      return fn;
    })
    .catch((err: Error) => {
      console.warn(`[headroom-gemini] headroom-ai not available, using raw SDK: ${err?.message ?? err}`);
      cachedWrap = null;
      return null;
    });
}

/**
 * Wrap a Gemini GenerativeModel with Headroom compression if HEADROOM_ENABLED=1
 * and the headroom-ai package is available. Otherwise returns the model unchanged.
 *
 * Each generateContent / generateContentStream call is wrapped in try/catch:
 * if the in-process compression pipeline fails (HuggingFace download blocked,
 * Kompress runtime error), the wrapper transparently falls back to the raw SDK
 * so user requests never break.
 *
 * Environment variables:
 *   HEADROOM_ENABLED=1   opt in (default off — keeps free-tier dev unaffected)
 *   HEADROOM_PROXY_URL   optional override; defaults to http://127.0.0.1:8787
 */
export async function withMaybeHeadroom<T extends GenerativeModel>(model: T): Promise<T> {
  const wrap = await loadHeadroom();
  if (!wrap) return model;
  try {
    const wrapped = wrap(model) as T;
    return new Proxy(wrapped, {
      get(target, prop) {
        if (prop === "generateContent") {
          return async (params: any) => {
            try {
              return await (target as any).generateContent(params);
            } catch (err) {
              console.warn(
                `[headroom-gemini] compressed generateContent failed, falling back to raw: ${(err as Error)?.message ?? err}`
              );
              return await model.generateContent(params);
            }
          };
        }
        if (prop === "generateContentStream") {
          return async (params: any) => {
            try {
              return await (target as any).generateContentStream(params);
            } catch (err) {
              console.warn(
                `[headroom-gemini] compressed generateContentStream failed, falling back to raw: ${(err as Error)?.message ?? err}`
              );
              return await model.generateContentStream(params);
            }
          };
        }
        return (target as any)[prop];
      },
    }) as T;
  } catch (err) {
    console.warn(
      `[headroom-gemini] wrap failed, using raw model: ${(err as Error)?.message ?? err}`
    );
    return model;
  }
}

/**
 * Health probe for the local Headroom proxy.
 * Returns true if HEADROOM_ENABLED=1 and the proxy is reachable.
 */
export async function isHeadroomReachable(): Promise<boolean> {
  if (process.env.HEADROOM_ENABLED !== "1") return false;
  const url = process.env.HEADROOM_PROXY_URL || "http://127.0.0.1:8787";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${url}/livez`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
