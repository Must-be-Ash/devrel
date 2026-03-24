# Animation Patterns for CDP Panda

Every element animates in sequentially. Nothing visible at frame 0. Copy and adapt these patterns.

## Core helper — staggered reveals

```tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const useStagger = (frame: number, fps: number, index: number, gap = 25) => {
  return spring({ frame: frame - index * gap, fps, config: { damping: 200 } });
};
```

## Pattern 1: Flow diagram (steps appearing one by one with connecting lines)

```tsx
export const FlowDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = ["Client hits endpoint", "Server returns 402", "Client signs Permit2", "Facilitator sponsors gas", "Transfer completes"];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", padding: 60, justifyContent: "center" }}>
      {steps.map((text, i) => {
        const progress = useStagger(frame, fps, i);
        const lineProgress = useStagger(frame, fps, i + 1);
        const lineHeight = interpolate(lineProgress, [0, 1], [0, 30]);

        return (
          <React.Fragment key={i}>
            <div style={{
              opacity: progress,
              transform: `translateX(${(1 - progress) * 50}px)`,
              padding: "14px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 22,
            }}>
              <span style={{ color: "#0052FF", fontWeight: 700, marginRight: 12 }}>{i + 1}</span>
              {text}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 2, height: lineHeight, backgroundColor: "#0052FF", marginLeft: 30 }} />
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
```

## Pattern 2: Kinetic typography (big number/word that scales in with impact)

```tsx
export const BigReveal: React.FC<{ text: string; subtitle: string }> = ({ text, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main text: bouncy entrance
  const mainScale = spring({ frame: frame - 10, fps, config: { damping: 8 } });
  const mainOpacity = interpolate(mainScale, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  // Subtitle slides up after
  const subProgress = spring({ frame: frame - 35, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
      <div style={{
        fontSize: 120,
        fontWeight: 900,
        color: "#0052FF",
        transform: `scale(${mainScale})`,
        opacity: mainOpacity,
        fontFamily: "system-ui",
      }}>
        {text}
      </div>
      <div style={{
        fontSize: 32,
        color: "rgba(255,255,255,0.8)",
        opacity: subProgress,
        transform: `translateY(${(1 - subProgress) * 20}px)`,
        marginTop: 16,
      }}>
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
```

## Pattern 3: Before/After comparison (old slides out, new slides in)

```tsx
export const BeforeAfter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const showBefore = spring({ frame, fps, config: { damping: 200 } });
  const crossOut = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const slideAway = spring({ frame: frame - 60, fps, config: { damping: 200 } });
  const showAfter = spring({ frame: frame - 70, fps, config: { damping: 200 } });

  const strikeWidth = interpolate(crossOut, [0, 1], [0, 100]);
  const beforeX = interpolate(slideAway, [0, 1], [0, -400]);
  const afterX = interpolate(showAfter, [0, 1], [400, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
      {/* Before */}
      <div style={{ transform: `translateX(${beforeX}px)`, opacity: 1 - slideAway, position: "relative" }}>
        <div style={{ fontSize: 48, color: "#fff", fontFamily: "monospace" }}>
          price: "$0.02"
        </div>
        <div style={{
          position: "absolute", top: "50%", left: 0,
          width: `${strikeWidth}%`, height: 3, backgroundColor: "#ef4444",
        }} />
      </div>

      {/* After */}
      <div style={{ transform: `translateX(${afterX}px)`, opacity: showAfter }}>
        <div style={{ fontSize: 48, color: "#00D632", fontFamily: "monospace" }}>
          price: {"{"} amount: "20000", asset: "USDT" {"}"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

## Pattern 4: Pulsing highlight (draw attention to a key element)

```tsx
const pulse = Math.sin(frame * 0.1) * 0.15 + 0.85; // oscillates 0.7-1.0

<div style={{
  border: `2px solid #0052FF`,
  borderRadius: 8,
  padding: "8px 16px",
  transform: `scale(${pulse})`,
  boxShadow: `0 0 ${20 * pulse}px rgba(0,82,255,0.3)`,
}}>
  Zero gas for buyers
</div>
```

## Pattern 5: Counter/number animating up

```tsx
const progress = spring({ frame: frame - 20, fps, config: { damping: 200 } });
const count = Math.round(interpolate(progress, [0, 1], [0, 1287]));

<div style={{ fontSize: 80, fontWeight: 900, color: "#0052FF" }}>
  {count.toLocaleString()}+
</div>
<div style={{ color: "rgba(255,255,255,0.6)", fontSize: 24 }}>
  ERC-20 tokens supported
</div>
```

## Layout note

The panda avatar takes up the **right 40%** of the frame (split-right at 40% ratio). All motion graphics and text must fit within the **left 60%** (0-1152px of 1920px width). Left-align or center content within that area. Never place important elements past x=1100.

## Style guide

- Background: `#0a0a0a`
- Primary: `#0052FF` (Coinbase blue)
- Success: `#00D632` (green)
- Text: `#FFFFFF` and `rgba(255,255,255,0.6)`
- Code/mono: `fontFamily: "monospace"`
- Headings: `fontFamily: "system-ui"`, weight 700-900
