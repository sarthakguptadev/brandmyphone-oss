/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare KV - used for visit analytics cache only.
 * Bound as `env.KV`; call `setKv` once per request.
 */

let kv: KVNamespace | null = null;

export function setKv(binding: KVNamespace | null | undefined) {
  kv = binding ?? null;
}

export function getKv(): KVNamespace | null {
  return kv;
}

export async function kvGetText(key: string): Promise<string | null> {
  const store = getKv();
  if (!store) return null;
  return store.get(key);
}

export async function kvPutText(key: string, value: string) {
  const store = getKv();
  if (!store) return;
  await store.put(key, value);
}
