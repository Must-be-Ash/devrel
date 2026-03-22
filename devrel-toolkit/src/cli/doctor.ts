import type { Command } from "commander";
import { execSync } from "node:child_process";
import { loadConfig } from "../utils/config.js";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

function checkCommand(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

async function checkNodeVersion(): Promise<CheckResult> {
  const version = process.version;
  const major = parseInt(version.slice(1).split(".")[0], 10);
  if (major >= 18) {
    return { name: "Node.js", status: "pass", detail: `${version} (>= 18 required)` };
  }
  return { name: "Node.js", status: "fail", detail: `${version} — Node.js 18+ is required` };
}

async function checkFfmpeg(): Promise<CheckResult> {
  const output = checkCommand("ffmpeg -version");
  if (output) {
    const firstLine = output.split("\n")[0];
    return { name: "FFmpeg", status: "pass", detail: firstLine };
  }
  return {
    name: "FFmpeg",
    status: "fail",
    detail: "Not found. Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)",
  };
}

async function checkBrowserAutomation(): Promise<CheckResult> {
  const browserUse = checkCommand("browser-use --version");
  if (browserUse) {
    return { name: "Browser Automation", status: "pass", detail: `Browser-Use CLI ${browserUse}` };
  }

  const playwright = checkCommand("npx playwright --version");
  if (playwright) {
    return {
      name: "Browser Automation",
      status: "pass",
      detail: `Playwright ${playwright} (fallback)`,
    };
  }

  return {
    name: "Browser Automation",
    status: "warn",
    detail: "Neither Browser-Use CLI nor Playwright found. Install browser-use or npx playwright install",
  };
}

async function checkDidApiKey(): Promise<CheckResult> {
  const config = loadConfig();
  if (!config.didApiKey) {
    return {
      name: "D-ID API Key",
      status: "fail",
      detail: "DID_API_KEY not set. Add it to .env.local or set as environment variable",
    };
  }

  // Test the key with a lightweight API call
  try {
    const response = await fetch("https://api.d-id.com/clips/presenters", {
      headers: {
        Authorization: `Basic ${config.didApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return { name: "D-ID API Key", status: "pass", detail: "Valid (authenticated successfully)" };
    }
    if (response.status === 401) {
      return {
        name: "D-ID API Key",
        status: "fail",
        detail: "Invalid key — authentication failed (401). Check your DID_API_KEY",
      };
    }
    return {
      name: "D-ID API Key",
      status: "warn",
      detail: `Key is set but API returned status ${response.status}`,
    };
  } catch (err) {
    return {
      name: "D-ID API Key",
      status: "warn",
      detail: `Key is set but could not reach D-ID API: ${(err as Error).message}`,
    };
  }
}

function statusIcon(status: "pass" | "fail" | "warn"): string {
  switch (status) {
    case "pass":
      return "\u2705";
    case "fail":
      return "\u274C";
    case "warn":
      return "\u26A0\uFE0F";
  }
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check dependencies and environment setup")
    .action(async () => {
      console.log("\ndevrel-toolkit doctor\n");
      console.log("Checking dependencies...\n");

      const checks = await Promise.all([
        checkNodeVersion(),
        checkFfmpeg(),
        checkBrowserAutomation(),
        checkDidApiKey(),
      ]);

      for (const check of checks) {
        console.log(`  ${statusIcon(check.status)}  ${check.name}: ${check.detail}`);
      }

      const failures = checks.filter((c) => c.status === "fail");
      const warnings = checks.filter((c) => c.status === "warn");

      console.log("");
      if (failures.length === 0 && warnings.length === 0) {
        console.log("All checks passed! Ready to create demos.\n");
      } else {
        if (failures.length > 0) {
          console.log(`${failures.length} check(s) failed. Fix the issues above to proceed.\n`);
        }
        if (warnings.length > 0) {
          console.log(`${warnings.length} warning(s). Some features may not work.\n`);
        }
        process.exitCode = failures.length > 0 ? 1 : 0;
      }
    });
}
