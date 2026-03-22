import type { Command } from "commander";

export function registerRenderCommand(program: Command): void {
  program
    .command("render")
    .description("Render demo video from props JSON")
    .requiredOption("-p, --props <path>", "Path to render props JSON")
    .option("-o, --output <path>", "Output MP4 file path", "demo-output.mp4")
    .option("-r, --resolution <res>", "Output resolution (720 or 1080)", "1080")
    .option("--fps <n>", "Frames per second", "30")
    .option("--codec <codec>", "Video codec (h264 or h265)", "h264")
    .action(async (_opts) => {
      console.log("render — not yet implemented (Phase 4)");
    });
}

export function registerPreviewCommand(program: Command): void {
  program
    .command("preview")
    .description("Quick low-res preview render (480p, 15fps, no avatar)")
    .requiredOption("-p, --props <path>", "Path to render props JSON")
    .option("-o, --output <path>", "Output MP4 file path", "preview-output.mp4")
    .action(async (_opts) => {
      console.log("preview — not yet implemented (Phase 4)");
    });
}
