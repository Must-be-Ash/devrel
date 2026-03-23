import { z } from "zod";

// ─── Demo Script Schema (produced by Claude Code skill, consumed by toolkit) ───

export const NavigationStepSchema = z.object({
  action: z.enum(["goto", "click", "scroll", "type", "wait", "hover"]),
  target: z.string().optional(),
  value: z.string().optional(),
  waitAfter: z.number().optional(),
});

export const HighlightSchema = z.object({
  selector: z.string(),
  style: z.enum(["box", "glow", "arrow", "underline"]),
  color: z.string().optional(),
});

export const ZoomTargetSchema = z.object({
  selector: z.string(),
  level: z.number(),
});

export const SceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  narration: z.string(),
  navigation: z.array(NavigationStepSchema),
  highlights: z.array(HighlightSchema),
  zoom: ZoomTargetSchema.optional(),
  transition: z.enum(["fade", "slide", "cut"]),
});

export const DemoScriptSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }),
  fps: z.number(),
  scenes: z.array(SceneSchema),
});

// ─── Render Props Schema (toolkit input for Remotion rendering) ───

export const RenderHighlightSchema = z.object({
  bbox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  style: z.enum(["box", "glow", "arrow", "underline"]),
  color: z.string().optional(),
});

export const RenderZoomSchema = z.object({
  bbox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  level: z.number(),
});

export const CursorPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  timestamp: z.number(),
});

export const RenderSceneSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  screenshotPath: z.string(),
  avatarClipPath: z.string().optional(),
  avatarDuration: z.number(),
  narration: z.string(),
  highlights: z.array(RenderHighlightSchema),
  zoom: RenderZoomSchema.optional(),
  transition: z.enum(["fade", "slide", "cut"]),
  cursorPath: z.array(CursorPointSchema).optional(),
});

export const IntroOutroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  logoPath: z.string().optional(),
  durationSeconds: z.number().optional(),
});

export const RenderPropsSchema = z.object({
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }),
  fps: z.number(),
  scenes: z.array(RenderSceneSchema),
  avatarPosition: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left", "split-right", "split-left"])
    .optional(),
  avatarSize: z.number().optional(),
  avatarClipPath: z.string().optional(),
  showSubtitles: z.boolean().optional(),
  intro: IntroOutroSchema.optional(),
  outro: IntroOutroSchema.optional(),
  backgroundMusic: z.string().optional(),
});

// ─── Inferred TypeScript types ───

export type NavigationStep = z.infer<typeof NavigationStepSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type ZoomTarget = z.infer<typeof ZoomTargetSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type DemoScript = z.infer<typeof DemoScriptSchema>;

export type RenderHighlight = z.infer<typeof RenderHighlightSchema>;
export type RenderZoom = z.infer<typeof RenderZoomSchema>;
export type RenderScene = z.infer<typeof RenderSceneSchema>;
export type CursorPoint = z.infer<typeof CursorPointSchema>;
export type IntroOutro = z.infer<typeof IntroOutroSchema>;
export type RenderProps = z.infer<typeof RenderPropsSchema>;
