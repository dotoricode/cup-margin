import { chromium, devices } from "playwright";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const axeSource = await fs.readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const rawDir = path.resolve("reports/cup-margin-audit/raw");
const baseUrl = resolveBaseUrl();
const targets = [
  { id: "landing", url: makeUrl("/") },
  { id: "calculator", url: makeUrl("/calculator") },
];
const viewports = [
  { id: "m360", width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: "d1440", width: 1440, height: 1000, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];
const maxViolations = {
  "landing:m360": Number(process.env.AXE_MAX_LANDING_MOBILE ?? 0),
  "landing:d1440": Number(process.env.AXE_MAX_LANDING_DESKTOP ?? 0),
  "calculator:m360": Number(process.env.AXE_MAX_CALCULATOR_MOBILE ?? 0),
  "calculator:d1440": Number(process.env.AXE_MAX_CALCULATOR_DESKTOP ?? 0),
};

await fs.mkdir(rawDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

for (const target of targets) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      ...devices["Desktop Chrome"],
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      deviceScaleFactor: viewport.deviceScaleFactor,
      locale: "ko-KR",
    });
    const page = await context.newPage();
    await page.goto(target.url, { waitUntil: "networkidle", timeout: 45000 });
    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      });
    });
    const key = `${target.id}:${viewport.id}`;
    const violationCount = axe.violations.length;
    const allowed = maxViolations[key] ?? 0;
    results.push({
      id: target.id,
      viewport: viewport.id,
      url: target.url,
      allowedViolations: allowed,
      violations: axe.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.slice(0, 10).map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
    });
    await context.close();
    console.log(`${target.id} ${viewport.id}: ${violationCount} violations (allowed ${allowed})`);
    if (violationCount > allowed) {
      failures.push(`${key}: ${violationCount} > ${allowed}`);
    }
  }
}

await browser.close();
await fs.writeFile(path.join(rawDir, "axe-results.json"), JSON.stringify(results, null, 2));

if (failures.length > 0) {
  console.error("axe regression detected:");
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
