import type { Command } from "commander";

export function registerDidCommand(program: Command): void {
  const did = program
    .command("d-id")
    .description("D-ID avatar generation commands");

  did
    .command("avatars")
    .description("List available D-ID avatars")
    .action(async () => {
      console.log("d-id avatars — not yet implemented (Phase 3)");
    });

  did
    .command("generate")
    .description("Generate avatar clips from a script")
    .requiredOption("-s, --script <path>", "Path to avatar script JSON")
    .option("-o, --output <dir>", "Output directory for avatar clips", "./avatars")
    .option("-a, --avatar <id>", "Avatar ID to use")
    .option("--sentiment <id>", "Sentiment ID to use")
    .option("-c, --concurrency <n>", "Max concurrent generations", "2")
    .action(async (_opts) => {
      console.log("d-id generate — not yet implemented (Phase 3)");
    });
}
