import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { RenderHighlight } from "../../utils/schema.js";

const DEFAULT_COLOR = "#4A90D9";

interface HighlightProps {
  highlights: RenderHighlight[];
  durationFrames: number;
}

const HighlightBox: React.FC<{
  highlight: RenderHighlight;
  index: number;
}> = ({ highlight, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { bbox, style, color = DEFAULT_COLOR } = highlight;

  // Stagger entrance: each highlight appears 10 frames after the previous
  const delay = 20 + index * 10;
  const progress = spring({
    fps,
    frame: frame - delay,
    config: style === "underline" ? { damping: 200 } : { damping: 20, stiffness: 200 },
    durationInFrames: 20,
  });

  if (progress <= 0) return null;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: bbox.x,
    top: bbox.y,
    width: bbox.width,
    height: bbox.height,
    pointerEvents: "none",
  };

  switch (style) {
    case "box": {
      // Animated border that draws in
      const borderWidth = 3;
      const pathLength = 2 * (bbox.width + bbox.height);
      const dashOffset = interpolate(progress, [0, 1], [pathLength, 0]);

      return (
        <svg
          style={{
            ...baseStyle,
            overflow: "visible",
          }}
          viewBox={`0 0 ${bbox.width} ${bbox.height}`}
        >
          <rect
            x={borderWidth / 2}
            y={borderWidth / 2}
            width={bbox.width - borderWidth}
            height={bbox.height - borderWidth}
            rx={8}
            ry={8}
            fill="none"
            stroke={color}
            strokeWidth={borderWidth}
            strokeDasharray={pathLength}
            strokeDashoffset={dashOffset}
          />
        </svg>
      );
    }

    case "glow": {
      // Pulsing glow effect
      const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7;
      const glowOpacity = progress * pulse;

      return (
        <div
          style={{
            ...baseStyle,
            borderRadius: 8,
            boxShadow: `0 0 20px 6px ${color}`,
            opacity: glowOpacity,
            border: `2px solid ${color}`,
          }}
        />
      );
    }

    case "arrow": {
      // Animated arrow pointing to element from top-right
      const arrowSize = 40;
      const opacity = progress;

      return (
        <svg
          style={{
            position: "absolute",
            left: bbox.x + bbox.width + 5,
            top: bbox.y - arrowSize - 5,
            width: arrowSize + 20,
            height: arrowSize + 20,
            overflow: "visible",
            opacity,
          }}
        >
          <defs>
            <marker
              id={`arrowhead-${bbox.x}-${bbox.y}`}
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={color} />
            </marker>
          </defs>
          <line
            x1={arrowSize}
            y1={0}
            x2={0}
            y2={arrowSize}
            stroke={color}
            strokeWidth={3}
            markerEnd={`url(#arrowhead-${bbox.x}-${bbox.y})`}
            strokeDasharray={60}
            strokeDashoffset={interpolate(progress, [0, 1], [60, 0])}
          />
        </svg>
      );
    }

    case "underline": {
      // Animated underline beneath element
      const lineWidth = interpolate(progress, [0, 1], [0, bbox.width]);

      return (
        <div
          style={{
            position: "absolute",
            left: bbox.x,
            top: bbox.y + bbox.height + 4,
            width: lineWidth,
            height: 4,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      );
    }

    default:
      return null;
  }
};

export const Highlight: React.FC<HighlightProps> = ({ highlights }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {highlights.map((highlight, index) => (
        <HighlightBox
          key={index}
          highlight={highlight}
          index={index}
        />
      ))}
    </AbsoluteFill>
  );
};
