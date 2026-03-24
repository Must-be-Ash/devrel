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
  border?: string;
  borderRadius?: number;
  margin?: number;
  splitRatio?: number;
}

const DEFAULT_MARGIN = 24;
const DEFAULT_BORDER = "3px solid rgba(255, 255, 255, 0.8)";
const DEFAULT_BORDER_RADIUS = 20;
const DEFAULT_SPLIT_RATIO = 50;

function getPositionStyle(
  position: AvatarPiPProps["position"],
  size: number,
  margin: number,
  splitRatio: number,
): React.CSSProperties {
  const splitWidth = `${splitRatio}%`;

  if (position === "split-right") {
    return {
      position: "absolute",
      top: 0,
      right: 0,
      width: splitWidth,
      height: "100%",
    };
  }
  if (position === "split-left") {
    return {
      position: "absolute",
      top: 0,
      left: 0,
      width: splitWidth,
      height: "100%",
    };
  }

  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
  };

  switch (position) {
    case "bottom-right":
      return { ...base, bottom: margin, right: margin };
    case "bottom-left":
      return { ...base, bottom: margin, left: margin };
    case "top-right":
      return { ...base, top: margin, right: margin };
    case "top-left":
      return { ...base, top: margin, left: margin };
  }
}

export const AvatarPiP: React.FC<AvatarPiPProps> = ({
  clipPath,
  position,
  size,
  durationFrames,
  border,
  borderRadius,
  margin,
  splitRatio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isSplit = position === "split-right" || position === "split-left";

  if (!clipPath) return null;

  const resolvedMargin = margin ?? DEFAULT_MARGIN;
  const resolvedSplitRatio = splitRatio ?? DEFAULT_SPLIT_RATIO;
  const resolvedBorder = isSplit ? undefined : (border ?? DEFAULT_BORDER);
  const resolvedBorderRadius = isSplit ? 0 : (borderRadius ?? DEFAULT_BORDER_RADIUS);

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
        ...getPositionStyle(position, size, resolvedMargin, resolvedSplitRatio),
        borderRadius: resolvedBorderRadius,
        overflow: "hidden",
        transform: isSplit ? undefined : `scale(${scale})`,
        opacity,
        boxShadow: isSplit ? undefined : "0 4px 20px rgba(0, 0, 0, 0.3)",
        border: resolvedBorder === "none" ? undefined : resolvedBorder,
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
