import {
  lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, rmSync, writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const format = "workbench-test-run-v1";
const retentionMs = 7 * 24 * 60 * 60 * 1000;
const checkout = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const artifactRoot = join(checkout, ".tmp", "tests");

function checkedDirectory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || relative(path, realpathSync(path)) !== "") {
    throw new Error(`Refusing linked or non-directory test artifact path: ${path}`);
  }
}

function checkRoot() {
  checkedDirectory(join(checkout, ".tmp"));
  checkedDirectory(artifactRoot);
}

function readRun(path) {
  checkRoot();
  if (dirname(path) !== artifactRoot || !/^run-[\w-]+$/.test(basename(path))) {
    throw new Error(`Refusing test artifact path outside managed runs: ${path}`);
  }
  checkedDirectory(path);
  const marker = join(path, "run.json");
  const stat = lstatSync(marker);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Invalid test run metadata: ${marker}`);
  }
  const run = JSON.parse(readFileSync(marker, "utf8"));
  if (run?.format !== format || run.id !== basename(path)
    || !Number.isSafeInteger(run.pid) || run.pid <= 0
    || !Number.isSafeInteger(run.startedAt) || run.startedAt <= 0
    || !["running", "finished"].includes(run.state)) {
    throw new Error(`Unrecognized test run: ${path}`);
  }
  return run;
}

function removeRun(path) {
  readRun(path);
  rmSync(path, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
}

function pruneCompletedRuns() {
  for (const entry of readdirSync(artifactRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || !entry.name.startsWith("run-")) continue;
    const path = join(artifactRoot, entry.name);
    let run;
    try { run = readRun(path); } catch { continue; }
    if (run.state !== "finished" || !Number.isSafeInteger(run.finishedAt)
      || run.finishedAt < run.startedAt || !Number.isInteger(run.exitCode)
      || Date.now() - run.finishedAt < retentionMs) continue;
    try { removeRun(path); } catch (error) {
      console.warn(`Could not clean expired test artifacts at ${path}: ${error.message}`);
    }
  }
}

export function createTestRun(label) {
  for (const path of [join(checkout, ".tmp"), artifactRoot]) {
    try { mkdirSync(path); } catch (error) { if (error.code !== "EEXIST") throw error; }
    checkedDirectory(path);
  }
  pruneCompletedRuns();
  const path = mkdtempSync(join(artifactRoot, "run-"));
  const run = { format, id: basename(path), label, pid: process.pid, startedAt: Date.now(), state: "running" };
  writeFileSync(join(path, "run.json"), JSON.stringify(run));
  const temporary = join(path, "tmp");
  mkdirSync(temporary);
  process.env.WORKBENCH_TEST_ARTIFACTS = path;
  for (const name of ["TMP", "TEMP", "TMPDIR"]) process.env[name] = temporary;
  console.log(`Test artifacts (${label}): ${path}`);

  process.once("exit", exitCode => {
    try {
      readRun(path);
      writeFileSync(join(path, "run.json"), JSON.stringify({ ...run, state: "finished", finishedAt: Date.now(), exitCode }));
      if (exitCode === 0) removeRun(path);
      else console.error(`Test failed; artifacts retained for 7 days: ${path}`);
    } catch (error) {
      console.error(`Test artifacts retained at ${path}; cleanup failed: ${error.message}`);
    }
  });
  return path;
}
