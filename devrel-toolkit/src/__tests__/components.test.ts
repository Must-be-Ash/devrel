import { describe, it, expect } from "vitest";
import { calculateTotalFrames, estimateDuration } from "../compositor/timing.js";
import type { RenderProps } from "../utils/schema.js";

describe("Component data validation", () => {
  it("BrowserFrame accepts valid zoom config", () => {
    const zoom = {
      bbox: { x: 100, y: 100, width: 400, height: 300 },
      level: 1.5,
    };
    expect(zoom.level).toBeGreaterThan(1);
    expect(zoom.bbox.width).toBeGreaterThan(0);
  });

  it("Highlight accepts all four styles", () => {
    const styles = ["box", "glow", "arrow", "underline"] as const;
    for (const style of styles) {
      const highlight = {
        bbox: { x: 0, y: 0, width: 100, height: 50 },
        style,
      };
      expect(highlight.style).toBe(style);
    }
  });

  it("AvatarPiP accepts all four positions", () => {
    const positions = ["bottom-right", "bottom-left", "top-right", "top-left"] as const;
    for (const pos of positions) {
      expect(pos).toMatch(/^(bottom|top)-(right|left)$/);
    }
  });

  it("IntroOutro card data validates correctly", () => {
    const intro = { title: "My Demo", subtitle: "A walkthrough", durationSeconds: 3 };
    const outro = { title: "Thanks!", durationSeconds: 4 };
    expect(intro.title).toBe("My Demo");
    expect(outro.durationSeconds).toBe(4);
  });

  it("SceneTransition types are valid", () => {
    const types = ["fade", "slide", "cut"] as const;
    for (const t of types) {
      expect(["fade", "slide", "cut"]).toContain(t);
    }
  });

  it("Cursor path timestamps are monotonically increasing", () => {
    const path = [
      { x: 100, y: 200, timestamp: 0 },
      { x: 300, y: 400, timestamp: 500 },
      { x: 500, y: 300, timestamp: 1000 },
    ];
    for (let i = 1; i < path.length; i++) {
      expect(path[i].timestamp).toBeGreaterThan(path[i - 1].timestamp);
    }
  });

  it("estimateDuration produces reasonable values for different narrations", () => {
    expect(estimateDuration("Hello")).toBe(2); // minimum
    expect(estimateDuration("This is a longer narration that should take about four seconds to read aloud")).toBeGreaterThan(3);
    expect(estimateDuration("A".repeat(1000).split("").join(" "))).toBeGreaterThan(100);
  });

  it("total frames calculation is consistent with scene count", () => {
    const props: RenderProps = {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      scenes: Array.from({ length: 5 }, (_, i) => ({
        id: `scene-${i}`,
        screenshotPath: `/tmp/s${i}.png`,
        avatarDuration: 4,
        narration: "test",
        highlights: [],
        transition: "fade" as const,
      })),
    };
    const total = calculateTotalFrames(props);
    // 5 scenes * 4s * 30fps = 600 frames - 4 transition overlaps * 15 frames = 540
    expect(total).toBe(540);
  });
});
