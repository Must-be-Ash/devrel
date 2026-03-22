import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { IntroOutro } from "../../utils/schema.js";

interface IntroOutroProps {
  data: IntroOutro;
  type: "intro" | "outro";
  durationFrames: number;
}

export const IntroOutroCard: React.FC<IntroOutroProps> = ({ data, type, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleScale = spring({
    fps,
    frame: frame - 10,
    config: { damping: 200 },
    durationInFrames: 30,
  });

  // Subtitle fade in
  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit fade — uses the passed-in durationFrames (not total composition duration)
  const exitOpacity = interpolate(
    frame,
    [durationFrames - 15, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      {/* Logo */}
      {data.logoPath && (
        <Img
          src={staticFile(data.logoPath)}
          style={{
            width: 80,
            height: 80,
            marginBottom: 24,
            opacity: subtitleOpacity,
          }}
        />
      )}

      {/* Title */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          transform: `scale(${titleScale})`,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {data.title}
      </div>

      {/* Subtitle */}
      {data.subtitle && (
        <div
          style={{
            fontSize: 28,
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginTop: 16,
            opacity: subtitleOpacity,
            textAlign: "center",
            maxWidth: "70%",
          }}
        >
          {data.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
