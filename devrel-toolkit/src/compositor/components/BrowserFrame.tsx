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

interface BrowserFrameProps {
  screenshotPath: string;
  url?: string;
  zoom?: {
    bbox: { x: number; y: number; width: number; height: number };
    level: number;
  };
  durationFrames: number;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  screenshotPath,
  url,
  zoom,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Chrome bar height (0 when chrome is hidden)
  const chromeHeight = 0;

  // Calculate zoom animation
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (zoom) {
    const { bbox, level } = zoom;

    // Zoom in: start at frame 15, ease in with spring
    const zoomIn = spring({
      fps,
      frame: frame - 15,
      config: { damping: 200 },
      durationInFrames: 30,
    });

    // Zoom out: ease out before scene ends
    const zoomOut = spring({
      fps,
      frame: frame - (durationFrames - 20),
      config: { damping: 200 },
      durationInFrames: 20,
    });

    const zoomProgress = zoomIn - zoomOut;
    scale = interpolate(zoomProgress, [0, 1], [1, level], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Center the zoom on the target bbox
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const offsetX = width / 2 - centerX;
    const offsetY = (height - chromeHeight) / 2 - centerY;

    translateX = interpolate(zoomProgress, [0, 1], [0, offsetX], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    translateY = interpolate(zoomProgress, [0, 1], [0, offsetY], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // Skip browser chrome — it wastes vertical space and causes black bars
  const showChrome = false;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Fake browser chrome (disabled by default — causes black bar issues) */}
      {showChrome && <div
        style={{
          height: chromeHeight,
          backgroundColor: "#e8e8e8",
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          gap: 6,
        }}
      >
        {/* Traffic light dots */}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#ff5f57",
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#febc2e",
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#28c840",
          }}
        />
        {/* URL bar */}
        <div
          style={{
            marginLeft: 16,
            flex: 1,
            marginRight: 16,
            height: 26,
            backgroundColor: "#fff",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            paddingLeft: 10,
            fontSize: 13,
            color: "#666",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {url ?? ""}
        </div>
      </div>}

      {/* Screenshot area with zoom */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
            transformOrigin: "center center",
          }}
        >
          <Img
            src={staticFile(screenshotPath)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
