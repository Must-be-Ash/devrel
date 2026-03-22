import React from "react";
import {
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";

interface AvatarPiPProps {
  clipPath?: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size: number;
  durationFrames: number;
}

const MARGIN = 24;

function getPositionStyle(
  position: AvatarPiPProps["position"],
  size: number
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
  };

  switch (position) {
    case "bottom-right":
      return { ...base, bottom: MARGIN, right: MARGIN };
    case "bottom-left":
      return { ...base, bottom: MARGIN, left: MARGIN };
    case "top-right":
      return { ...base, top: MARGIN + 40, right: MARGIN }; // +40 for browser chrome
    case "top-left":
      return { ...base, top: MARGIN + 40, left: MARGIN };
  }
}

export const AvatarPiP: React.FC<AvatarPiPProps> = ({
  clipPath,
  position,
  size,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!clipPath) return null;

  // Entrance: scale from 0 → 1 with spring
  const entranceScale = spring({
    fps,
    frame: frame - 5,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 25,
  });

  // Exit: fade out in last 15 frames
  const exitOpacity = interpolate(
    frame,
    [durationFrames - 15, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = exitOpacity;
  const scale = entranceScale;

  return (
    <div
      style={{
        ...getPositionStyle(position, size),
        borderRadius: 20,
        overflow: "hidden",
        transform: `scale(${scale})`,
        opacity,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        border: "3px solid rgba(255, 255, 255, 0.8)",
      }}
    >
      <Video
        src={staticFile(clipPath)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
};
