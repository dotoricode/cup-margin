import pa11y from "pa11y";
import fs from "node:fs/promises";
import path from "node:path";

const rawDir = path.resolve("reports/cup-margin-audit/raw");
const baseUrl = resolveBaseUrl();
const targets = [
  { id: "landing", url: makeUrl("/"), allowedIssues: Number(process.env.PA11Y_MAX_LANDING ?? 0) },
  { id: "calculator", url: makeUrl("/calculator"), allowedIssues: Number(process.env.PA11Y_MAX_CALCULATOR ?? 0) },
];
const failures = [];
const results = [];

await fs.mkdir(rawDir, { recursive: true });

for (const target of targets) {
  const result = await pa11y(target.url, {
    timeout: 45000,
    wait: 1000,
    standard: "WCAG2AA",
    chromeLaunchConfig: {
      args: ["--no-sandbox"],
    },
  });
  const issues = result.issues.map((issue) => ({
    code: issue.code,
    type: issue.type,
    typeCode: issue.typeCode,
    message: issue.message,
    context: issue.context,
    selector: issue.selector,
    runner: issue.runner,
    runnerExtras: issue.runnerExtras,
  }));
  results.push({
    id: target.id,
    url: target.url,
    allowedIssues: target.allowedIssues,
    issues,
  });
  await fs.writeFile(path.join(rawDir, `pa11y-${target.id}.json`), JSON.stringify(issues, null, 2));
  console.log(`${target.id}: ${issues.length} issues (allowed ${target.allowedIssues})`);
  if (issues.length > target.allowedIssues) {
    failures.push(`${target.id}: ${issues.length} > ${target.allowedIssues}`);
  }
}

await fs.writeFile(path.join(rawDir, "pa11y-results.json"), JSON.stringify(results, null, 2));

if (failures.length > 0) {
  console.error("pa11y regression detected:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}

function resolveBaseUrl() {
  const argUrl = process.argv.find((arg) => arg.startsWith("--url="))?.slice("--url=".length) || process.argv[2];
  return normalizeBaseUrl(argUrl || process.env.npm_config_url || process.env.BASE_URL || "https://cup-margin.vercel.app");
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function makeUrl(pathname) {
  return new URL(pathname, baseUrl).toString();
}
