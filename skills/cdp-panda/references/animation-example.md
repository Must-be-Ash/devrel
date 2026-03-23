# Complete Animation Example

This is a full working Remotion component with motion. Copy this pattern — every element animates in sequentially. Nothing is visible at frame 0.

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

// Helper: creates a staggered spring that starts at 0 and goes to 1
const useStagger = (frame: number, fps: number, index: number, gap = 25) => {
  return spring({
    frame: frame - index * gap,
    fps,
    config: { damping: 200 },
  });
};

export const FlowAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = useStagger(frame, fps, 0);

  // 5 steps, each appearing 25 frames after the previous
  const s1 = useStagger(frame, fps, 1);
  const s2 = useStagger(frame, fps, 2);
  const s3 = useStagger(frame, fps, 3);
  const s4 = useStagger(frame, fps, 4);
  const s5 = useStagger(frame, fps, 5);

  // Connecting lines draw in as the NEXT step appears
  const line1Height = interpolate(s2, [0, 1], [0, 40]);
  const line2Height = interpolate(s3, [0, 1], [0, 40]);
  const line3Height = interpolate(s4, [0, 1], [0, 40]);
  const line4Height = interpolate(s5, [0, 1], [0, 40]);

  // Final result appears last
  const resultProgress = useStagger(frame, fps, 6);

  const stepStyle = (progress: number): React.CSSProperties => ({
    opacity: progress,
    transform: `translateX(${(1 - progress) * 60}px)`,
    padding: "16px 24px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 0,
  });

  const lineStyle = (height: number): React.CSSProperties => ({
    width: 2,
    height,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginLeft: 40,
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: "#0a0a0a",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ width: 800 }}>
        {/* Title slides down */}
        <div style={{
          opacity: titleProgress,
          transform: `translateY(${(1 - titleProgress) * -30}px)`,
          fontSize: 42,
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          marginBottom: 48,
        }}>
          Payment Flow
        </div>

        {/* Step 1 slides in from right */}
        <div style={stepStyle(s1)}>
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>1.</span>
          <span style={{ color: "#fff", marginLeft: 12 }}>Client hits endpoint</span>
        </div>

        {/* Line draws down */}
        <div style={lineStyle(line1Height)} />

        {/* Step 2 */}
        <div style={stepStyle(s2)}>
          <span style={{ color: "#f59e0b", fontWeight: 600 }}>2.</span>
          <span style={{ color: "#fff", marginLeft: 12 }}>Server returns 402</span>
        </div>

        <div style={lineStyle(line2Height)} />

        <div style={stepStyle(s3)}>
          <span style={{ color: "#22c55e", fontWeight: 600 }}>3.</span>
          <span style={{ color: "#fff", marginLeft: 12 }}>Client signs transfer</span>
        </div>

        <div style={lineStyle(line3Height)} />

        <div style={stepStyle(s4)}>
          <span style={{ color: "#f97316", fontWeight: 600 }}>4.</span>
          <span style={{ color: "#fff", marginLeft: 12 }}>Facilitator sponsors gas</span>
        </div>

        <div style={lineStyle(line4Height)} />

        <div style={stepStyle(s5)}>
          <span style={{ color: "#a78bfa", fontWeight: 600 }}>5.</span>
          <span style={{ color: "#fff", marginLeft: 12 }}>Transfer completes</span>
        </div>

        {/* Result pops in */}
        <div style={{
          opacity: resultProgress,
          transform: `scale(${interpolate(resultProgress, [0, 1], [0.8, 1])})`,
          marginTop: 32,
          textAlign: "center",
          fontSize: 28,
          fontWeight: 700,
          color: "#22c55e",
        }}>
          200 OK → &#123; number: 7 &#125;
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

Register with enough frames for all staggered animations:
```tsx
// src/Root.tsx
<Composition id="FlowAnimation" component={FlowAnimation}
  durationInFrames={240} fps={30} width={1920} height={1080} />
```

**What makes this animated (not static):**
- `useCurrentFrame()` is called — this is REQUIRED for any motion
- `useStagger(frame, fps, index)` creates delays: index 0 starts at frame 0, index 1 at frame 25, index 2 at frame 50, etc.
- Each element's opacity goes 0→1 and translateX goes 60→0 over time
- Connecting lines grow in height from 0 to 40px as the next step appears
- At frame 0, nothing is visible (all springs return 0)
- At frame 150, everything has appeared

**For a strikethrough animation** (like crossing out "EIP-3009"):
```tsx
const strikeProgress = useStagger(frame, fps, 2);
const lineWidth = interpolate(strikeProgress, [0, 1], [0, 100]); // percentage

<div style={{ position: "relative", display: "inline-block" }}>
  <span>EIP-3009</span>
  <div style={{
    position: "absolute",
    top: "50%",
    left: 0,
    width: `${lineWidth}%`,
    height: 3,
    backgroundColor: "#ef4444",
  }} />
</div>
```
