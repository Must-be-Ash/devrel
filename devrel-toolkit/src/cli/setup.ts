import type { Command } from "commander";
import { execSync } from "node:child_process";
import { loadConfig } from "../utils/config.js";

function runSilent(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

function checkInstalled(cmd: string): boolean {
  return runSilent(`which ${cmd}`);
}

export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Install everything needed for /make-demo")
    .action(async () => {
      console.log("\ndevrel-toolkit setup\n");

      // 1. Check FFmpeg
      if (checkInstalled("ffmpeg")) {
        console.log("  \u2705 FFmpeg is installed");
      } else {
        console.log("  \u2699\uFE0F  Installing FFmpeg...");
        if (process.platform === "darwin") {
          const ok = runSilent("brew install ffmpeg");
          console.log(ok ? "  \u2705 FFmpeg installed" : "  \u274C Failed — run: brew install ffmpeg");
        } else {
          console.log("  \u274C Not installed. Run: apt install ffmpeg (Linux) or brew install ffmpeg (macOS)");
        }
      }

      // 2. Check Browser-Use CLI
      if (checkInstalled("browser-use")) {
        console.log("  \u2705 Browser-Use CLI is installed");
      } else {
        console.log("  \u2699\uFE0F  Installing Browser-Use CLI...");
        const ok = runSilent("curl -fsSL https://browser-use.com/cli/install.sh | bash");
        console.log(
          ok
            ? "  \u2705 Browser-Use CLI installed"
            : "  \u274C Failed — run: curl -fsSL https://browser-use.com/cli/install.sh | bash"
        );
      }

      // 3. Check D-ID API key
      const config = loadConfig();
      if (config.didApiKey) {
        console.log("  \u2705 D-ID API key is set");
      } else {
        console.log("  \u274C D-ID API key not found");
        console.log("     Sign up at https://d-id.com and add DID_API_KEY to your .env.local");
      }

      // 4. Install skill
      console.log("\n  To install the Claude Code skill:");
      console.log("  npx skills add <repo-url> --skill make-demo\n");
    });
}
