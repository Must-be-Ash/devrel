import { describe, it, expect } from "vitest";
import {
  calculateTotalFrames,
  estimateDuration,
} from "../compositor/timing.js";
import type { RenderProps } from "../utils/schema.js";

function makeProps(
  scenes: { id: string; duration: number; transition: "fade" | "slide" | "cut" }[],
  fps = 30
): RenderProps {
  return {
    resolution: { width: 1920, height: 1080 },
    fps,
    scenes: scenes.map((s) => ({
      id: s.id,
      screenshotPath: `/tmp/${s.id}.png`,
      avatarDuration: s.duration,
      narration: "test",
      highlights: [],
      transition: s.transition,
    })),
  };
}

describe("calculateTotalFrames", () => {
  it("returns 0 for empty scenes", () => {
    expect(calculateTotalFrames(makeProps([]))).toBe(0);
  });

  it("returns correct frames for a single scene", () => {
    const props = makeProps([{ id: "s1", duration: 5, transition: "fade" }]);
    // 5 seconds * 30fps = 150 frames
    expect(calculateTotalFrames(props)).toBe(150);
  });

  it("accounts for transition overlap between scenes", () => {
    const props = makeProps([
      { id: "s1", duration: 5, transition: "fade" },
      { id: "s2", duration: 5, transition: "fade" },
    ]);
    // Without overlap: 300 frames
    // Transition = 0.5s = 15 frames overlap (between s1 and s2, using s2's transition type)
    // Total: 300 - 15 = 285
    expect(calculateTotalFrames(props)).toBe(285);
  });

  it("has no overlap for cut transitions", () => {
    const props = makeProps([
      { id: "s1", duration: 5, transition: "cut" },
      { id: "s2", duration: 5, transition: "cut" },
    ]);
    // No transition overlap (next scene is "cut")
    expect(calculateTotalFrames(props)).toBe(300);
  });

  it("handles mixed transitions", () => {
    const props = makeProps([
      { id: "s1", duration: 3, transition: "fade" },
      { id: "s2", duration: 3, transition: "cut" },
      { id: "s3", duration: 3, transition: "slide" },
    ]);
    // s1→s2: s2 is cut, no overlap
    // s2→s3: s3 is slide, 15 frames overlap
    // Total: 270 - 15 = 255
    expect(calculateTotalFrames(props)).toBe(255);
  });
});

describe("estimateDuration", () => {
  it("estimates duration from word count", () => {
    // 150 words per minute = 2.5 words per second
    const text = Array(25).fill("word").join(" "); // 25 words
    expect(estimateDuration(text)).toBe(10); // 25 / 2.5 = 10s
  });

  it("returns minimum 2 seconds", () => {
    expect(estimateDuration("hi")).toBe(2);
  });

  it("handles empty-ish strings", () => {
    expect(estimateDuration("hello")).toBe(2);
  });
});
