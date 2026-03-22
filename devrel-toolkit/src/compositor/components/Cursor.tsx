import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface CursorPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorProps {
  cursorPath?: CursorPoint[];
  durationFrames: number;
}

export const Cursor: React.FC<CursorProps> = ({ cursorPath, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!cursorPath || cursorPath.length === 0) return null;

  // Find the two points we're between based on timestamp
  const currentTime = (frame / fps) * 1000; // ms
  let prevPoint = cursorPath[0];
  let nextPoint = cursorPath[0];

  for (let i = 0; i < cursorPath.length - 1; i++) {
    if (
      currentTime >= cursorPath[i].timestamp &&
      currentTime <= cursorPath[i + 1].timestamp
    ) {
      prevPoint = cursorPath[i];
      nextPoint = cursorPath[i + 1];
      break;
    }
    if (currentTime > cursorPath[i].timestamp) {
      prevPoint = cursorPath[i];
      nextPoint = cursorPath[i];
    }
  }

  // Smooth bezier interpolation between points
  const segmentDuration = nextPoint.timestamp - prevPoint.timestamp;
  const segmentProgress =
    segmentDuration > 0
      ? (currentTime - prevPoint.timestamp) / segmentDuration
      : 1;

  // Ease the progress for smoother motion
  const easedProgress = Math.min(1, Math.max(0, segmentProgress));
  const smoothProgress = easedProgress * easedProgress * (3 - 2 * easedProgress); // smoothstep

  const x = prevPoint.x + (nextPoint.x - prevPoint.x) * smoothProgress;
  const y = prevPoint.y + (nextPoint.y - prevPoint.y) * smoothProgress;

  // Click effect: show ripple when cursor is at a waypoint (frame-based detection)
  const isAtWaypoint = cursorPath.some((p) => {
    const waypointFrame = Math.round((p.timestamp / 1000) * fps);
    return Math.abs(frame - waypointFrame) < 2;
  });
  const clickScale = isAtWaypoint
    ? spring({
        fps,
        frame: frame % 15,
        config: { damping: 50, stiffness: 200 },
        durationInFrames: 15,
      })
    : 0;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {/* Click ripple */}
      {clickScale > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 20,
            top: y - 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(66, 133, 244, 0.6)",
            transform: `scale(${1 + clickScale})`,
            opacity: 1 - clickScale,
          }}
        />
      )}

      {/* Cursor */}
      <svg
        style={{
          position: "absolute",
          left: x - 2,
          top: y - 2,
          width: 24,
          height: 24,
        }}
        viewBox="0 0 24 24"
      >
        <path
          d="M5 3l14 8-7 2-3 7z"
          fill="#fff"
          stroke="#000"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
