import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "..");
export const CONFIG_PATH = resolve(ROOT, "boilerplate.config.json");

const slugPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function normalizeUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Site URL must start with http:// or https://");
  }
  return url.toString().replace(/\/$/, "");
}

export function assertSlug(value, label) {
  if (!slugPattern.test(value)) {
    throw new Error(
      `${label} must use lowercase letters, numbers, and dashes (1–63 characters).`,
    );
  }
  return value;
}

export function loadProjectConfig() {
  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch (error) {
    throw new Error(
      `Could not read boilerplate.config.json: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    projectName: assertSlug(config.projectName, "projectName"),
    workerName: assertSlug(config.workerName, "workerName"),
    databaseName: assertSlug(config.databaseName, "databaseName"),
    siteUrl: normalizeUrl(config.siteUrl),
    customDomain:
      typeof config.customDomain === "string" && config.customDomain.trim()
        ? config.customDomain.trim().toLowerCase()
        : null,
  };
}
