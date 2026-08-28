#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { loadProjectConfig } from "./project-config.mjs";

const config = loadProjectConfig();
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["wrangler", "d1", "migrations", "apply", config.databaseName, "--remote"],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
