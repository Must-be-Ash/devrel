import type { RenderProps, RenderScene } from "../utils/schema.js";

const TRANSITION_DURATION_SECONDS = 0.5;

/**
 * Calculate total duration in frames for the entire composition.
 * Accounts for transition overlaps between scenes.
 * Used by calculateMetadata in Root.tsx.
 */
export function calculateTotalFrames(props: RenderProps): number {
  const { fps, scenes } = props;
  if (scenes.length === 0) return 0;

  const transitionFrames = Math.ceil(TRANSITION_DURATION_SECONDS * fps);

  // Sum all scene durations
  let total = 0;
  for (const scene of scenes) {
    total += Math.ceil(scene.avatarDuration * fps);
  }

  // Subtract transition overlaps between consecutive non-cut scenes
  for (let i = 0; i < scenes.length - 1; i++) {
    const nextScene = scenes[i + 1];
    if (nextScene && nextScene.transition !== "cut") {
      total -= transitionFrames;
    }
  }

  return total;
}

/**
 * Estimate duration from narration text (~150 words per minute = 2.5 wps).
 */
export function estimateDuration(narration: string): number {
  const words = narration.trim().split(/\s+/).length;
  return Math.max(2, words / 2.5);
}

/**
 * Get the scene duration in seconds.
 */
export function getSceneDuration(scene: RenderScene): number {
  return scene.avatarDuration;
}
