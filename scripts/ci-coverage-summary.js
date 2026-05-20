const fs = require("node:fs");
const path = require("node:path");

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
const lcovPath =
  process.env.COVERAGE_LCOV ||
  path.join(process.cwd(), "coverage", "lcov.info");

let line =
  "**Coverage:** fichier `coverage/lcov.info` introuvable. Vérifiez Vitest en CI.";

if (fs.existsSync(lcovPath)) {
  const content = fs.readFileSync(lcovPath, "utf8");
  let totalLines = 0;
  let coveredLines = 0;

  for (const record of content.split("end_of_record")) {
    const lfMatch = record.match(/^LF:(\d+)/m);
    const lhMatch = record.match(/^LH:(\d+)/m);
    if (lfMatch && lhMatch) {
      totalLines += Number.parseInt(lfMatch[1], 10);
      coveredLines += Number.parseInt(lhMatch[1], 10);
    }
  }

  if (totalLines > 0) {
    const pct = ((100 * coveredLines) / totalLines).toFixed(2);
    line = `**Lines: ${pct}%** (${coveredLines} / ${totalLines} lines)`;
  } else {
    line = "**Coverage:** 0 line mesurée dans lcov.info.";
  }
}

const markdown = `## Frontend Coverage\n\n${line}\n`;

process.stderr.write(
  `Frontend coverage summary: ${line.replace(/\*\*/g, "")}\n`
);

if (summaryPath) {
  fs.appendFileSync(summaryPath, markdown);
} else {
  process.stdout.write(markdown);
}
