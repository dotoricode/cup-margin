import { spawn } from "node:child_process";
import { rm, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const formFactor = process.env.LHCI_FORM_FACTOR || "mobile";
const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "reports", "cup-margin-audit", "lhci", formFactor);
const chromeUserDataDir = path.join(os.tmpdir(), `cup-margin-lhci-${formFactor}-${process.pid}`);

await mkdir(outputDir, { recursive: true });
await rmWithRetry(chromeUserDataDir, { force: true, recursive: true });
await mkdir(chromeUserDataDir, { recursive: true });

const env = {
  ...process.env,
  LHCI_FORM_FACTOR: formFactor,
  LHCI_OUTPUT_DIR: outputDir,
  LHCI_CHROME_USER_DATA_DIR: chromeUserDataDir,
};

const exitCode = await runLhci(env);
await rmWithRetry(chromeUserDataDir, { force: true, recursive: true });
process.exit(exitCode);

function runLhci(env) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["lhci", "autorun", "--config=./lighthouserc.cjs"], {
      cwd: repoRoot,
      env,
      shell: true,
      stdio: "inherit",
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", (error) => {
      console.error(`[lhci] failed to start: ${error.message}`);
      resolve(1);
    });
  });
}

async function rmWithRetry(target, options, attempts = 6) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      await rm(target, options);
      return;
    } catch (error) {
      if (error?.code === "ENOENT") return;
      if (index === attempts - 1) {
        console.warn(`[lhci] cleanup skipped for ${target}: ${error.message}`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (index + 1)));
    }
  }
}
