import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface SubtitlesProps {
  text: string;
  durationFrames: number;
  visible: boolean;
}

export const Subtitles: React.FC<SubtitlesProps> = ({
  text,
  durationFrames,
  visible,
}) => {
  const frame = useCurrentFrame();

  if (!visible || !text) return null;

  const words = text.split(/\s+/);
  const totalWords = words.length;

  // Calculate how many words should be visible at the current frame
  // Leave a small buffer at start and end
  const startFrame = 10;
  const endFrame = durationFrames - 5;
  const visibleWordCount = Math.ceil(
    interpolate(frame, [startFrame, endFrame], [0, totalWords], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Fade in
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "80%",
        opacity: opacity * fadeOut,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          borderRadius: 12,
          padding: "12px 24px",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 24,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: 0.3,
          }}
        >
          {words.slice(0, visibleWordCount).join(" ")}
        </span>
      </div>
    </div>
  );
};
