#!/usr/bin/env node
/**
 * One-time Cloudflare provisioning through the authenticated Wrangler CLI.
 * `--update-config` writes each generated binding ID to wrangler.jsonc.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, loadProjectConfig } from "./project-config.mjs";

const { workerName, databaseName } = loadProjectConfig();
const WRANGLER_PATH = resolve(ROOT, "wrangler.jsonc");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(args) {
  const result = spawnSync(npx, ["wrangler", ...args], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function bindings() {
  const config = JSON.parse(readFileSync(WRANGLER_PATH, "utf8"));
  return {
    d1: config.d1_databases?.some(
      (database) => database.binding === "DB" && database.database_id,
    ),
    kv: config.kv_namespaces?.some(
      (namespace) => namespace.binding === "KV" && namespace.id,
    ),
    kvPreview: config.kv_namespaces?.some(
      (namespace) => namespace.binding === "KV" && namespace.preview_id,
    ),
  };
}

let existing = bindings();
if (!existing.d1) {
  run(["d1", "create", databaseName, "--binding", "DB", "--update-config"]);
}

existing = bindings();
if (!existing.kv) {
  run(["kv", "namespace", "create", workerName, "--binding", "KV", "--update-config"]);
}

existing = bindings();
if (!existing.kvPreview) {
  run([
    "kv",
    "namespace",
    "create",
    `${workerName}-preview`,
    "--preview",
    "--binding",
    "KV",
    "--update-config",
  ]);
}

console.log("Cloudflare bindings are ready.");
