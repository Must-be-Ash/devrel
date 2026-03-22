import type { Command } from "commander";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerInstallSkillCommand(program: Command): void {
  program
    .command("install-skill")
    .description("Install the make-demo skill to ~/.claude/skills/")
    .option("--dest <path>", "Custom destination directory")
    .action(async (opts) => {
      // Source: skills/make-demo/ relative to the package root
      const packageRoot = resolve(__dirname, "../..");
      const skillSource = join(packageRoot, "skills", "make-demo");

      // In the built dist, skills/ is at the repo root not in dist/
      // Try multiple locations
      const candidates = [
        skillSource,
        resolve(__dirname, "../../skills/make-demo"),
        resolve(__dirname, "../../../skills/make-demo"),
      ];

      let source: string | null = null;
      for (const candidate of candidates) {
        if (existsSync(join(candidate, "SKILL.md"))) {
          source = candidate;
          break;
        }
      }

      if (!source) {
        console.error(
          "Could not find make-demo skill directory. Expected skills/make-demo/SKILL.md relative to package root."
        );
        process.exitCode = 1;
        return;
      }

      const dest = opts.dest
        ? resolve(opts.dest)
        : join(homedir(), ".claude", "skills", "make-demo");

      // Ensure parent directory exists
      mkdirSync(dirname(dest), { recursive: true });

      // Copy the skill directory
      cpSync(source, dest, { recursive: true });

      console.log(`\nSkill installed to: ${dest}`);
      console.log("Files copied:");
      console.log("  - SKILL.md");
      console.log("  - references/demo-script-schema.md");
      console.log("  - references/render-props-schema.md");
      console.log("  - references/toolkit-commands.md");
      console.log("\nThe /make-demo skill is now available in Claude Code.\n");
    });
}
