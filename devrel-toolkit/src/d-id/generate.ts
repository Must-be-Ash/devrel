import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { DIDClient } from "./client.js";
import { requireDidApiKey } from "../utils/config.js";

export interface GenerateOptions {
  scriptPath: string;
  outputDir: string;
  defaultAvatarId?: string;
  defaultSentimentId?: string;
  concurrency: number;
}

interface SceneInput {
  id: string;
  narration: string;
  avatarId?: string;
  sentimentId?: string;
}

interface ManifestEntry {
  id: string;
  clipPath: string;
  duration: number;
}

export async function generateAvatarClips(options: GenerateOptions): Promise<void> {
  const apiKey = requireDidApiKey();
  const client = new DIDClient(apiKey);

  // Read and parse script
  const scriptPath = resolve(options.scriptPath);
  const raw = readFileSync(scriptPath, "utf-8");
  const scenes: SceneInput[] = JSON.parse(raw);

  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error("Script must be a non-empty array of scenes with { id, narration }");
  }

  // Ensure output directory exists
  const outputDir = resolve(options.outputDir);
  mkdirSync(outputDir, { recursive: true });

  const total = scenes.length;
  const manifest: ManifestEntry[] = [];
  let completed = 0;

  console.log(`\nGenerating ${total} avatar clip(s)...\n`);

  // Process scenes with concurrency limit
  const queue = [...scenes];
  const inFlight: Promise<void>[] = [];

  async function processScene(scene: SceneInput): Promise<void> {
    const avatarId = scene.avatarId ?? options.defaultAvatarId;
    if (!avatarId) {
      throw new Error(
        `No avatar ID for scene "${scene.id}". Provide --avatar or set avatarId per scene.`
      );
    }

    const sentimentId = scene.sentimentId ?? options.defaultSentimentId;

    console.log(`  [${completed + 1}/${total}] Generating avatar for "${scene.id}"...`);

    // Rate limit: minimum 500ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create the video
    const created = await client.createVideo({
      avatarId,
      sentimentId,
      script: scene.narration,
      config: { result_format: "mp4", output_resolution: 1080 },
      background: { type: "color", value: "#1a1a1a" },
    });

    // Poll until done
    const result = await client.pollUntilDone(created.id, {
      interval: 5000,
      timeout: 600000,
    });

    if (!result.result_url) {
      throw new Error(`No result URL for scene "${scene.id}" (id: ${created.id})`);
    }

    // Download the clip
    const clipPath = join(outputDir, `${scene.id}.mp4`);
    await client.downloadVideo(result.result_url, clipPath);

    completed++;
    console.log(`  [${completed}/${total}] Done: ${scene.id} (${result.duration ?? "?"}s)`);

    manifest.push({
      id: scene.id,
      clipPath,
      duration: result.duration ?? 0,
    });
  }

  // Run with concurrency limit
  for (const scene of queue) {
    const promise = processScene(scene).then(() => {
      const idx = inFlight.indexOf(promise);
      if (idx !== -1) inFlight.splice(idx, 1);
    });
    inFlight.push(promise);

    if (inFlight.length >= options.concurrency) {
      await Promise.race(inFlight);
    }
  }

  // Wait for remaining
  await Promise.all(inFlight);

  // Write manifest
  const manifestPath = join(outputDir, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({ scenes: manifest }, null, 2),
    "utf-8"
  );

  console.log(`\nAll ${total} clip(s) generated.`);
  console.log(`Manifest: ${manifestPath}\n`);
}
