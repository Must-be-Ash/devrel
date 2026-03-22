import type { Command } from "commander";
import { readFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { RenderPropsSchema } from "../utils/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function doRender(opts: {
  props: string;
  output: string;
  resolution?: string;
  fps?: string;
  codec?: string;
  transparent?: boolean;
  preview?: boolean;
}): Promise<void> {
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");

  // Read and validate render props
  const propsPath = resolve(opts.props);
  const raw = readFileSync(propsPath, "utf-8");
  const parseResult = RenderPropsSchema.safeParse(JSON.parse(raw));

  if (!parseResult.success) {
    console.error("Invalid render props:");
    console.error(parseResult.error.issues);
    process.exitCode = 1;
    return;
  }

  const inputProps = parseResult.data;

  // Validate that all referenced files exist
  const missingFiles: string[] = [];
  for (const scene of inputProps.scenes) {
    if (!existsSync(scene.screenshotPath)) {
      missingFiles.push(`Screenshot: ${scene.screenshotPath} (scene: ${scene.id})`);
    }
    if (scene.avatarClipPath && !existsSync(scene.avatarClipPath)) {
      missingFiles.push(`Avatar clip: ${scene.avatarClipPath} (scene: ${scene.id})`);
    }
  }
  if (inputProps.backgroundMusic && !existsSync(inputProps.backgroundMusic)) {
    missingFiles.push(`Background music: ${inputProps.backgroundMusic}`);
  }
  if (missingFiles.length > 0) {
    console.error("Missing files referenced in render props:");
    for (const f of missingFiles) {
      console.error(`  - ${f}`);
    }
    process.exitCode = 1;
    return;
  }

  // Override resolution/fps for preview mode
  if (opts.preview) {
    inputProps.resolution = { width: 854, height: 480 };
    inputProps.fps = 15;
  }
  if (opts.resolution) {
    const h = parseInt(opts.resolution, 10);
    const w = Math.round(h * (16 / 9));
    inputProps.resolution = { width: w, height: h };
  }
  if (opts.fps) {
    inputProps.fps = parseInt(opts.fps, 10);
  }

  const outputPath = resolve(opts.output);
  const isTransparent = opts.transparent === true;
  const codec = isTransparent ? "prores" as const : (opts.codec ?? "h264") as "h264" | "h265";

  // Copy all referenced assets (screenshots, avatar clips, music) into a temp
  // public directory. Remotion serves assets from publicDir — absolute filesystem
  // paths don't work in the browser-based renderer.
  const publicDir = join(tmpdir(), `devrel-toolkit-assets-${Date.now()}`);
  mkdirSync(publicDir, { recursive: true });

  let fileCounter = 0;
  function copyAsset(absolutePath: string): string {
    const name = `${fileCounter++}-${basename(absolutePath)}`;
    copyFileSync(absolutePath, join(publicDir, name));
    return name; // just the filename — Remotion resolves it from publicDir
  }

  console.log("\nCopying assets...");
  for (const scene of inputProps.scenes) {
    scene.screenshotPath = copyAsset(scene.screenshotPath);
    if (scene.avatarClipPath) {
      scene.avatarClipPath = copyAsset(scene.avatarClipPath);
    }
  }
  if (inputProps.backgroundMusic) {
    inputProps.backgroundMusic = copyAsset(inputProps.backgroundMusic);
  }
  if (inputProps.intro?.logoPath) {
    inputProps.intro.logoPath = copyAsset(inputProps.intro.logoPath);
  }
  if (inputProps.outro?.logoPath) {
    inputProps.outro.logoPath = copyAsset(inputProps.outro.logoPath);
  }

  console.log("Bundling Remotion project...");

  // Bundle the compositor entry point with the temp publicDir
  const entryPoint = resolve(__dirname, "../compositor/index.js");
  const bundleLocation = await bundle({
    entryPoint,
    publicDir,
    webpackOverride: (config) => config,
  });

  console.log("Selecting composition...");

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "DemoVideo",
    inputProps,
  });

  console.log(
    `Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps (${composition.durationInFrames} frames)...`
  );

  let lastProgress = 0;
  const renderOptions: Record<string, unknown> = {
    composition,
    serveUrl: bundleLocation,
    codec,
    outputLocation: outputPath,
    inputProps,
    crf: opts.preview ? 28 : 18,
  };

  if (isTransparent) {
    renderOptions.imageFormat = "png";
    renderOptions.pixelFormat = "yuva444p10le";
    renderOptions.proResProfile = "4444";
    delete renderOptions.crf;
  }

  await renderMedia({
    ...renderOptions as Parameters<typeof renderMedia>[0],
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct > lastProgress) {
        lastProgress = pct;
        process.stdout.write(`\r  Rendering: ${pct}%`);
      }
    },
  });

  console.log(`\r  Rendering: 100%`);

  // Clean up temp assets directory
  try {
    rmSync(publicDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  console.log(`\nOutput: ${outputPath}\n`);
}

export function registerRenderCommand(program: Command): void {
  program
    .command("render")
    .description("Render demo video from props JSON")
    .requiredOption("-p, --props <path>", "Path to render props JSON")
    .option("-o, --output <path>", "Output MP4 file path", "demo-output.mp4")
    .option("-r, --resolution <res>", "Output resolution (720 or 1080)")
    .option("--fps <n>", "Frames per second")
    .option("--codec <codec>", "Video codec (h264 or h265)", "h264")
    .option("--transparent", "Export ProRes 4444 with transparency for compositing")
    .action(async (opts) => {
      await doRender({
        props: opts.props,
        output: opts.output,
        resolution: opts.resolution,
        fps: opts.fps,
        codec: opts.codec,
        transparent: opts.transparent,
      });
    });
}

export function registerPreviewCommand(program: Command): void {
  program
    .command("preview")
    .description("Quick low-res preview render (480p, 15fps, no avatar)")
    .requiredOption("-p, --props <path>", "Path to render props JSON")
    .option("-o, --output <path>", "Output MP4 file path", "preview-output.mp4")
    .action(async (opts) => {
      await doRender({
        props: opts.props,
        output: opts.output,
        preview: true,
      });
    });
}
