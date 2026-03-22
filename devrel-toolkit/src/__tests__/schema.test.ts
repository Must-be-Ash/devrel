import { describe, it, expect } from "vitest";
import {
  DemoScriptSchema,
  RenderPropsSchema,
  NavigationStepSchema,
  HighlightSchema,
  RenderSceneSchema,
} from "../utils/schema.js";

describe("NavigationStepSchema", () => {
  it("accepts valid navigation steps", () => {
    const steps = [
      { action: "goto", target: "http://localhost:3000" },
      { action: "click", target: "#btn" },
      { action: "type", target: "#input", value: "hello" },
      { action: "wait", value: "2000" },
      { action: "scroll", value: "down" },
      { action: "hover", target: ".menu" },
    ];
    for (const step of steps) {
      expect(NavigationStepSchema.safeParse(step).success).toBe(true);
    }
  });

  it("rejects invalid action", () => {
    const result = NavigationStepSchema.safeParse({ action: "jump" });
    expect(result.success).toBe(false);
  });
});

describe("HighlightSchema", () => {
  it("accepts valid highlights", () => {
    expect(
      HighlightSchema.safeParse({ selector: ".btn", style: "box" }).success
    ).toBe(true);
    expect(
      HighlightSchema.safeParse({
        selector: "#cta",
        style: "glow",
        color: "#ff0000",
      }).success
    ).toBe(true);
  });

  it("rejects invalid style", () => {
    expect(
      HighlightSchema.safeParse({ selector: ".btn", style: "sparkle" }).success
    ).toBe(false);
  });
});

describe("DemoScriptSchema", () => {
  const validScript = {
    title: "Test Demo",
    description: "A test demo",
    url: "http://localhost:3000",
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    scenes: [
      {
        id: "scene-1",
        title: "Intro",
        narration: "Welcome",
        navigation: [{ action: "goto", target: "http://localhost:3000" }],
        highlights: [{ selector: ".btn", style: "box" }],
        transition: "fade",
      },
    ],
  };

  it("accepts a valid demo script", () => {
    expect(DemoScriptSchema.safeParse(validScript).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(DemoScriptSchema.safeParse({}).success).toBe(false);
    expect(DemoScriptSchema.safeParse({ title: "only title" }).success).toBe(
      false
    );
  });

  it("accepts script with zoom target", () => {
    const withZoom = {
      ...validScript,
      scenes: [
        {
          ...validScript.scenes[0],
          zoom: { selector: ".hero", level: 2.0 },
        },
      ],
    };
    expect(DemoScriptSchema.safeParse(withZoom).success).toBe(true);
  });

  it("rejects invalid transition type", () => {
    const invalid = {
      ...validScript,
      scenes: [{ ...validScript.scenes[0], transition: "wipe" }],
    };
    expect(DemoScriptSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("RenderPropsSchema", () => {
  const validProps = {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    scenes: [
      {
        id: "scene-1",
        screenshotPath: "/tmp/scene-1.png",
        avatarDuration: 5.2,
        narration: "Welcome",
        highlights: [
          {
            bbox: { x: 100, y: 200, width: 300, height: 50 },
            style: "glow",
          },
        ],
        transition: "slide",
      },
    ],
    avatarPosition: "bottom-right",
    showSubtitles: true,
  };

  it("accepts valid render props", () => {
    expect(RenderPropsSchema.safeParse(validProps).success).toBe(true);
  });

  it("accepts render props with intro/outro", () => {
    const withIntroOutro = {
      ...validProps,
      intro: { title: "My Demo", subtitle: "A walkthrough" },
      outro: { title: "Thanks!", durationSeconds: 4 },
    };
    expect(RenderPropsSchema.safeParse(withIntroOutro).success).toBe(true);
  });

  it("accepts render props with background music", () => {
    const withMusic = { ...validProps, backgroundMusic: "/tmp/music.mp3" };
    expect(RenderPropsSchema.safeParse(withMusic).success).toBe(true);
  });

  it("accepts render props with cursor path", () => {
    const withCursor = {
      ...validProps,
      scenes: [
        {
          ...validProps.scenes[0],
          cursorPath: [
            { x: 100, y: 200, timestamp: 0 },
            { x: 300, y: 400, timestamp: 1000 },
          ],
        },
      ],
    };
    expect(RenderPropsSchema.safeParse(withCursor).success).toBe(true);
  });

  it("rejects invalid avatar position", () => {
    const invalid = { ...validProps, avatarPosition: "center" };
    expect(RenderPropsSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("RenderSceneSchema", () => {
  it("accepts scene without optional fields", () => {
    const minimal = {
      id: "s1",
      screenshotPath: "/tmp/s1.png",
      avatarDuration: 3,
      narration: "Hello",
      highlights: [],
      transition: "cut",
    };
    expect(RenderSceneSchema.safeParse(minimal).success).toBe(true);
  });

  it("accepts scene with all optional fields", () => {
    const full = {
      id: "s1",
      screenshotPath: "/tmp/s1.png",
      avatarClipPath: "/tmp/s1-avatar.mp4",
      avatarDuration: 5,
      narration: "Welcome to the demo",
      highlights: [
        {
          bbox: { x: 0, y: 0, width: 100, height: 50 },
          style: "box",
          color: "#00ff00",
        },
      ],
      zoom: {
        bbox: { x: 100, y: 100, width: 400, height: 300 },
        level: 1.8,
      },
      transition: "fade",
      cursorPath: [{ x: 50, y: 50, timestamp: 0 }],
    };
    expect(RenderSceneSchema.safeParse(full).success).toBe(true);
  });
});
