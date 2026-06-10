#!/usr/bin/env node
/**
 * Normalise les chemins dans lcov.info et sonar-report.xml pour SonarCloud.
 * Sonar attend des chemins relatifs POSIX (ex. src/lib/foo.ts).
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd().replace(/\\/g, "/");

function normalizeFilePath(raw) {
  let p = String(raw).replace(/\\/g, "/");
  const rootWithSlash = root.endsWith("/") ? root : `${root}/`;
  if (p.startsWith(rootWithSlash)) p = p.slice(rootWithSlash.length);
  if (p.startsWith(root)) p = p.slice(root.length).replace(/^\//, "");
  p = p.replace(/^\/home\/runner\/work\/[^/]+\/[^/]+\//, "");
  p = p.replace(/^\/github\/workspace\//, "");
  p = p.replace(/^[A-Za-z]:\//, "");
  return p;
}

function fixLcov(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`::error::Missing ${filePath}`);
    process.exit(1);
  }
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  let fixed = 0;
  const out = lines.map((line) => {
    if (!line.startsWith("SF:")) return line;
    const normalized = `SF:${normalizeFilePath(line.slice(3))}`;
    if (normalized !== line) fixed += 1;
    return normalized;
  });
  fs.writeFileSync(filePath, out.join("\n"));
  const sfLines = out.filter((l) => l.startsWith("SF:"));
  const sample = sfLines[0];
  console.log(`Fixed ${fixed} path(s) in ${filePath} (${sfLines.length} source file(s))`);
  if (sample) console.log(`Sample: ${sample}`);
  if (sfLines.length === 0) {
    console.error("::error::lcov.info ne contient aucune entrée SF:");
    process.exit(1);
  }
}

function fixSonarReport(filePath) {
  if (!fs.existsSync(filePath)) return;
  const before = fs.readFileSync(filePath, "utf8");
  const after = before.replace(/path="([^"]+)"/g, (_, filePath) => {
    return `path="${normalizeFilePath(filePath)}"`;
  });
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log(`Normalized test report paths in ${filePath}`);
  }
}

fixLcov(path.join("coverage", "lcov.info"));
fixSonarReport("sonar-report.xml");
