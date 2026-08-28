/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare D1. Bound as `env.DB` in the Worker; call `setDb`
 * once per request before handlers run.
 */

let db: D1Database | null = null;

export function setDb(binding: D1Database | null | undefined) {
  db = binding ?? null;
}

export function getDb(): D1Database | null {
  return db;
}

export function requireDb(): D1Database {
  if (!db) throw new Error("Cloudflare D1 is not configured");
  return db;
}
