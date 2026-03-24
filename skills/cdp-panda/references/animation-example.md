# Animation Patterns for CDP Panda

Every element animates in sequentially. Nothing visible at frame 0. Prioritize visual storytelling over text layouts — use orbital visualizations, animated SVG paths, traveling light dots, and gradient typography instead of grids and boxes.

## Core helpers

```tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

// Staggered entrance with natural damping
const useStagger = (frame: number, fps: number, index: number, gap = 18) =>
  spring({ frame: frame - index * gap, fps, config: { damping: 60, stiffness: 120 } });

// Phase transition (crossfade between two views within one scene)
const usePhaseTransition = (frame: number, transitionFrame: number) => ({
  phase1: interpolate(frame, [transitionFrame - 30, transitionFrame - 5], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }),
  phase2: interpolate(frame, [transitionFrame, transitionFrame + 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }),
});
```

## Animated gradient mesh background

Use on every scene. The background should feel alive — slowly shifting hue and angle.

```tsx
const frame = useCurrentFrame();
const gradAngle = 135 + Math.sin(frame * 0.015) * 10;
const g1 = `hsl(${220 + Math.sin(frame * 0.01) * 8}, 70%, 7%)`;
const g2 = `hsl(${235 + Math.cos(frame * 0.015) * 10}, 50%, 4%)`;

<AbsoluteFill style={{ background: `linear-gradient(${gradAngle}deg, #0a0a0a 0%, ${g2} 50%, ${g1} 100%)` }}>
  {/* Animated grid overlay */}
  <div style={{
    position: "absolute", inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,82,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,82,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    backgroundPosition: `${Math.sin(frame * 0.008) * 8}px ${Math.cos(frame * 0.006) * 8}px`,
    opacity: 0.5,
  }} />
  {/* Scene content here */}
</AbsoluteFill>
```

## Pattern 1: Orbital visualization (items orbiting with depth illusion)

Use for showing collections of items (tokens, features, services). Far more engaging than grids.

```tsx
const TokenNode: React.FC<{
  name: string;
  angle: number;
  radius: number;
  highlighted: boolean;
  progress: number;
  frame: number;
  orbitSpeed: number;
}> = ({ name, angle, radius, highlighted, progress, frame, orbitSpeed }) => {
  const currentAngle = angle + frame * orbitSpeed;
  const rad = (currentAngle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius * 0.45; // elliptical for depth
  const scale = 0.85 + (Math.sin(rad) * 0.15); // items "behind" are smaller
  const zIndex = Math.sin(rad) > 0 ? 2 : 0;

  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      transform: `translate(${x - 30}px, ${y - 20}px) scale(${scale * progress})`,
      opacity: progress * (0.6 + scale * 0.4),
      zIndex,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: highlighted
          ? "radial-gradient(circle, #00D632 30%, rgba(0,214,50,0.3) 100%)"
          : "radial-gradient(circle, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.1) 100%)",
        boxShadow: highlighted ? "0 0 12px rgba(0,214,50,0.4)" : "0 0 8px rgba(255,255,255,0.1)",
      }} />
      <span style={{
        fontSize: 16, fontWeight: 700, fontFamily: "monospace", letterSpacing: 1,
        color: highlighted ? "rgba(0,214,50,0.9)" : "rgba(255,255,255,0.45)",
      }}>
        {name}
      </span>
    </div>
  );
};

// Usage: items orbit in an ellipse with an SVG orbit ring
<div style={{ position: "relative", width: 500, height: 220 }}>
  <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 500 220">
    <ellipse cx="250" cy="110" rx="220" ry="95" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
  </svg>
  {items.map((item, i) => (
    <TokenNode key={i} angle={i * 60} radius={220} orbitSpeed={0.25}
      highlighted={item.active} progress={useStagger(frame, fps, i)} frame={frame} name={item.name} />
  ))}
</div>
```

## Pattern 2: Network diagram with arc paths and traveling dots

Use for showing relationships and flows between entities.

```tsx
// Animated SVG arc path that draws itself
const ArcPath: React.FC<{ d: string; progress: number; color: string; length: number }> = ({ d, progress, color, length }) => (
  <path d={d} fill="none" stroke={color} strokeWidth="1.5"
    strokeDasharray={length} strokeDashoffset={interpolate(progress, [0, 1], [length, 0])}
    strokeLinecap="round" opacity={0.5} />
);

// Traveling light dot (glowing effect)
{arcProgress > 0.1 && (() => {
  const t = Math.min(arcProgress, 1);
  const dotX = startX + (endX - startX) * t;
  const dotY = startY + (controlY - startY) * 4 * t * (1 - t); // bezier approx
  return (
    <>
      <circle cx={dotX} cy={dotY} r="12" fill={color} opacity={0.15} />
      <circle cx={dotX} cy={dotY} r="5" fill={color} opacity={0.9} />
      <circle cx={dotX} cy={dotY} r="2" fill="#fff" opacity={0.8} />
    </>
  );
})()}

// Circular node with rotating dashed ring
<div style={{ position: "relative" }}>
  <svg style={{ position: "absolute", left: -40, top: -40, width: 80, height: 80,
    transform: `rotate(${frame * 0.3}deg)` }} viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="36" fill="none" stroke="#0052FF"
      strokeWidth="1" strokeDasharray="6 10" opacity={0.25} />
  </svg>
  <div style={{
    width: 56, height: 56, borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(0,82,255,0.2) 0%, rgba(0,82,255,0.05) 100%)",
    border: "1.5px solid rgba(0,82,255,0.4)",
    boxShadow: "0 0 30px rgba(0,82,255,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    {/* Icon inside */}
  </div>
</div>
```

## Pattern 3: Journey path with waypoints and traveling dot

Use for showing processes and flows. Replace step-by-step text lists with visual paths.

```tsx
// Waypoint that lights up when the dot arrives
const Waypoint: React.FC<{
  x: number; y: number; label: string; progress: number; color: string;
}> = ({ x, y, label, progress, color }) => (
  <>
    <circle cx={x} cy={y} r="8" fill="none" stroke={color} strokeWidth="1" opacity={progress * 0.4} />
    <circle cx={x} cy={y} r="4" fill={color} opacity={progress * 0.8} />
    <text x={x} y={y - 16} textAnchor="middle" fill="white" fontSize="12"
      fontFamily="system-ui" fontWeight="500" opacity={progress * 0.7}>
      {label}
    </text>
  </>
);

// Traveling dot along multi-point path
const TravelingDot: React.FC<{ progress: number; points: number[][]; color: string }> = ({ progress, points, color }) => {
  if (progress <= 0) return null;
  const t = Math.min(progress, 1);
  const totalSegments = points.length - 1;
  const segFloat = t * totalSegments;
  const segIndex = Math.min(Math.floor(segFloat), totalSegments - 1);
  const segT = segFloat - segIndex;
  const x = points[segIndex][0] + (points[segIndex + 1][0] - points[segIndex][0]) * segT;
  const y = points[segIndex][1] + (points[segIndex + 1][1] - points[segIndex][1]) * segT;
  return (
    <>
      <circle cx={x} cy={y} r="12" fill={color} opacity={0.15} />
      <circle cx={x} cy={y} r="5" fill={color} opacity={0.9} />
      <circle cx={x} cy={y} r="2" fill="#fff" opacity={0.8} />
    </>
  );
};

// Usage: define points, draw path with strokeDasharray, place waypoints and dot
const points = [[80, 200], [200, 200], [320, 200], [440, 200], [560, 200]];
const pathD = `M ${points.map(p => p.join(",")).join(" L ")}`;
const dotProgress = interpolate(frame, [startFrame, endFrame], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});

<svg width="640" height="400" viewBox="0 0 640 400">
  <path d={pathD} fill="none" stroke={color} strokeWidth="2" opacity={0.2}
    strokeDasharray={totalLength} strokeDashoffset={interpolate(pathP, [0, 1], [totalLength, 0])} />
  {points.map((pt, i) => <Waypoint key={i} x={pt[0]} y={pt[1]} label={labels[i]} progress={wpProgress[i]} color={color} />)}
  <TravelingDot progress={dotProgress} points={points} color={color} />
</svg>
```

## Pattern 4: SVG self-drawing checkmark

```tsx
const DrawCheck: React.FC<{ progress: number }> = ({ progress }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="#00D632" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={24} strokeDashoffset={interpolate(progress, [0, 1], [24, 0])} />
  </svg>
);
```

## Pattern 5: Gradient hero typography

Use for titles and closing text. Text IS the visual — make it large, bold, with gradient fills.

```tsx
<div style={{
  fontSize: 52, fontWeight: 900,
  background: "linear-gradient(135deg, #0052FF 0%, #4d8bff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  fontFamily: "system-ui",
  letterSpacing: -2,
  opacity: interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
  transform: `translateY(${(1 - progress) * 40}px) scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
}}>
  Any Token.
</div>
```

## Pattern 6: Light sweep effect

Apply to images or closing text for a cinematic feel.

```tsx
{/* Overlay div that slides across */}
<div style={{
  position: "absolute", top: 0,
  left: interpolate(frame, [startFrame, endFrame], [-100, containerWidth], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }),
  width: 80, height: "100%",
  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
  pointerEvents: "none",
}} />
```

## Pattern 7: Floating particles (lightweight, no CSS blur)

```tsx
const Particle: React.FC<{
  x: number; y: number; size: number; speed: number; delay: number; color: string; frame: number;
}> = ({ x, y, size, speed, delay, color, frame }) => {
  const t = (frame - delay) * speed;
  const px = x + Math.sin(t * 0.7) * 40 + Math.cos(t * 0.3) * 20;
  const py = y + Math.cos(t * 0.5) * 30 + Math.sin(t * 0.8) * 15;
  const opacity = frame > delay ? interpolate(frame, [delay, delay + 20], [0, 0.6], { extrapolateRight: "clamp" }) : 0;
  const scale = 0.8 + Math.sin(t * 0.4) * 0.2;
  return (
    <div style={{
      position: "absolute", left: px, top: py, width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: opacity * scale,
    }} />
  );
};
```

## Layout note for split-screen

The panda avatar takes up the **left 33.33%** of the frame (`split-left` at `avatarSplitRatio: 33.33`). All motion graphics must render within the **right 66.67%**. Use this wrapper for all content:

```tsx
const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: "33.33%",
  width: "66.67%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px 50px",
};
```

## Performance note

**NEVER use CSS `filter: blur()` on per-frame animated elements** — it makes rendering extremely slow in Remotion's headless Chrome. Use opacity, radial-gradient, and boxShadow for soft glow effects instead.

## Style guide

- Background: Animated gradient mesh (not flat `#0a0a0a`)
- Primary: `#0052FF` (Coinbase blue) — use gradient: `linear-gradient(135deg, #0052FF, #4d8bff)`
- Success: `#00D632` (green) — use gradient: `linear-gradient(135deg, #00D632, #4dff7a)`
- Text: `#FFFFFF` and `rgba(255,255,255,0.6)`
- Glass morphism: `background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))` + `border: 1px solid rgba(255,255,255,0.1)` + `backdropFilter: blur(12px)`
- Code/mono: `fontFamily: "monospace"`
- Headings: `fontFamily: "system-ui"`, weight 700-900, negative letter-spacing (-1 to -2)
- Use inline SVG icons, never emojis
- Use `WebkitBackgroundClip: "text"` with gradients for hero typography
