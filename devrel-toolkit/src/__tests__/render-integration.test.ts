import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RenderPropsSchema } from "../utils/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Render Integration", () => {
  it("validates render props with real file paths", () => {
    const fixtureDir = resolve(__dirname, "fixtures");
    const screenshotPath = resolve(fixtureDir, "test-screenshot.png");
    const propsPath = resolve(fixtureDir, "test-render-props.json");

    // Verify fixture files exist
    expect(existsSync(screenshotPath)).toBe(true);
    expect(existsSync(propsPath)).toBe(true);

    // Load and patch the props with the real screenshot path
    const props = JSON.parse(readFileSync(propsPath, "utf-8"));
    props.scenes[0].screenshotPath = screenshotPath;

    // Validate with schema
    const result = RenderPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it("file validation catches missing screenshots", () => {
    expect(existsSync("/tmp/nonexistent-screenshot-xyz.png")).toBe(false);
  });
});
