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
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "split-right" | "split-left";
  size: number;
  durationFrames: number;
}

const MARGIN = 24;

function getPositionStyle(
  position: AvatarPiPProps["position"],
  size: number
): React.CSSProperties {
  // Split modes: avatar takes up half the screen
  if (position === "split-right") {
    return {
      position: "absolute",
      top: 0,
      right: 0,
      width: "50%",
      height: "100%",
    };
  }
  if (position === "split-left") {
    return {
      position: "absolute",
      top: 0,
      left: 0,
      width: "50%",
      height: "100%",
    };
  }

  // PiP modes: small corner overlay
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
      return { ...base, top: MARGIN, right: MARGIN };
    case "top-left":
      return { ...base, top: MARGIN, left: MARGIN };
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
  const isSplit = position === "split-right" || position === "split-left";

  if (!clipPath) return null;

  // Entrance: scale from 0 → 1 with spring (skip for split mode)
  const entranceScale = isSplit ? 1 : spring({
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
        borderRadius: isSplit ? 0 : 20,
        overflow: "hidden",
        transform: isSplit ? undefined : `scale(${scale})`,
        opacity,
        boxShadow: isSplit ? undefined : "0 4px 20px rgba(0, 0, 0, 0.3)",
        border: isSplit ? undefined : "3px solid rgba(255, 255, 255, 0.8)",
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
