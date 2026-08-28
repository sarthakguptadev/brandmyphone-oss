#!/usr/bin/env node
import { readFileSync } from "node:fs";

const [logPath] = process.argv.slice(2);
if (!logPath) process.exit(0);

const matches = readFileSync(logPath, "utf8").match(
  /https:\/\/[A-Za-z0-9-]+\.[A-Za-z0-9-]+\.workers\.dev/g,
);

if (matches?.length) console.log(matches.at(-1));
