#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npm.cmd" : "npm";

function run(args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["run", "cf:bootstrap"]);
run(["run", "build"]);
run(["run", "db:migrate"]);
run(["exec", "wrangler", "deploy"]);
