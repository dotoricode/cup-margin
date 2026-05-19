import { chromium, devices } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("reports/cup-margin-audit");
const assetsDir = path.join(root, "assets");
const rawDir = path.join(root, "raw");

const pages = [
  { id: "cup-landing", url: "https://cup-margin.vercel.app", name: "Cup Margin landing" },
  { id: "cup-calculator", url: "https://cup-margin.vercel.app/calculator", name: "Cup Margin calculator" },
  { id: "cashnote", url: "https://cashnote.kr/", name: "Cashnote" },
  { id: "finda", url: "https://www.finda.co.kr/finance/calculator/debt-repayment", name: "Finda loan interest calculator" },
  { id: "shopify", url: "https://www.shopify.com/tools/profit-margin-calculator/retail", name: "Shopify retail margin calculator" },
  { id: "square", url: "https://squareup.com/us/en/restaurants", name: "Square for Restaurants" },
  { id: "bls", url: "https://www.bls.gov/data/inflation_calculator.htm", name: "BLS CPI inflation calculator" },
];

const viewports = [
  { id: "m360", width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { id: "m414", width: 414, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { id: "d1440", width: 1440, height: 1000, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

await fs.mkdir(assetsDir, { recursive: true });
await fs.mkdir(rawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const pageInfo of pages) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      ...devices["Desktop Chrome"],
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      locale: pageInfo.url.includes("finda") || pageInfo.url.includes("cashnote") || pageInfo.url.includes("cup-margin") ? "ko-KR" : "en-US",
    });
    const page = await context.newPage();
    const startedAt = Date.now();
    const record = {
      ...pageInfo,
      viewport: viewport.id,
      screenshot: `assets/${pageInfo.id}-${viewport.id}.png`,
      ok: false,
      status: null,
      title: "",
      h1: [],
      headings: [],
      buttonsAndLinks: [],
      formControls: [],
      metrics: {},
      smallTapTargets: [],
      textSample: "",
      error: null,
    };
    try {
      const response = await page.goto(pageInfo.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      record.status = response?.status() ?? null;
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.screenshot({ path: path.join(root, record.screenshot), fullPage: true });
      record.ok = true;
      record.metrics = await page.evaluate((startedAt) => {
        const paint = performance.getEntriesByType("paint").map((entry) => ({ name: entry.name, startTime: Math.round(entry.startTime) }));
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          elapsedMs: Date.now() - startedAt,
          paint,
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadMs: nav ? Math.round(nav.loadEventEnd) : null,
          transferSize: nav ? nav.transferSize : null,
        };
      }, startedAt);
      const dom = await page.evaluate(() => {
        const text = (node) => (node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim();
        const compact = (items) => items.map((item) => text(item)).filter(Boolean).slice(0, 30);
        const tapTargets = Array.from(document.querySelectorAll("a,button,input,select,textarea,summary"))
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const label = text(el) || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || el.tagName;
            return { label: String(label).slice(0, 80), width: Math.round(rect.width), height: Math.round(rect.height) };
          })
          .filter((item) => item.width > 0 && item.height > 0 && (item.width < 44 || item.height < 44))
          .slice(0, 20);
        return {
          title: document.title,
          h1: compact(Array.from(document.querySelectorAll("h1"))),
          headings: compact(Array.from(document.querySelectorAll("h1,h2,h3"))),
          buttonsAndLinks: compact(Array.from(document.querySelectorAll("button,a"))),
          formControls: Array.from(document.querySelectorAll("input,select,textarea")).map((el) => ({
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute("type"),
            label: el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "",
          })).slice(0, 30),
          smallTapTargets: tapTargets,
          textSample: text(document.body).slice(0, 2500),
        };
      });
      Object.assign(record, dom);
    } catch (error) {
      record.error = error instanceof Error ? error.message : String(error);
    } finally {
      await context.close();
    }
    results.push(record);
    console.log(`${record.ok ? "ok" : "fail"} ${pageInfo.id} ${viewport.id}`);
  }
}

await browser.close();
await fs.writeFile(path.join(rawDir, "capture-results.json"), JSON.stringify(results, null, 2));
