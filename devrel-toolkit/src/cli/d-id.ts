import type { Command } from "commander";
import { DIDClient } from "../d-id/client.js";
import { requireDidApiKey } from "../utils/config.js";
import { generateAvatarClips } from "../d-id/generate.js";

export function registerDidCommand(program: Command): void {
  const did = program
    .command("d-id")
    .description("D-ID avatar generation commands");

  did
    .command("avatars")
    .description("List available D-ID avatars")
    .action(async () => {
      const apiKey = requireDidApiKey();
      const client = new DIDClient(apiKey);

      console.log("\nFetching available avatars...\n");

      const avatars = await client.listAvatars();

      if (avatars.length === 0) {
        console.log("No avatars found.");
        return;
      }

      // Print table header
      const idWidth = 40;
      const nameWidth = 30;
      console.log(
        `${"AVATAR ID".padEnd(idWidth)}  ${"NAME".padEnd(nameWidth)}  SENTIMENTS`
      );
      console.log(`${"-".repeat(idWidth)}  ${"-".repeat(nameWidth)}  ${"-".repeat(30)}`);

      for (const avatar of avatars) {
        const sentimentNames = avatar.sentiments
          ?.map((s) => s.name || s.id)
          .join(", ") ?? "—";
        const id = (avatar.id ?? "").padEnd(idWidth);
        const name = (avatar.name ?? "unknown").padEnd(nameWidth);
        console.log(`${id}  ${name}  ${sentimentNames}`);
      }

      console.log(`\n${avatars.length} avatar(s) found.\n`);
    });

  did
    .command("generate")
    .description("Generate avatar clips from a script")
    .requiredOption("-s, --script <path>", "Path to avatar script JSON")
    .option("-o, --output <dir>", "Output directory for avatar clips", "./avatars")
    .option("-a, --avatar <id>", "Avatar ID to use")
    .option("--sentiment <id>", "Sentiment ID to use")
    .option("-c, --concurrency <n>", "Max concurrent generations", "2")
    .action(async (opts) => {
      await generateAvatarClips({
        scriptPath: opts.script,
        outputDir: opts.output,
        defaultAvatarId: opts.avatar,
        defaultSentimentId: opts.sentiment,
        concurrency: parseInt(opts.concurrency, 10),
      });
    });
}
