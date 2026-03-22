import React from "react";
import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo.js";
import { calculateTotalFrames } from "./timing.js";
import type { RenderProps } from "../utils/schema.js";

export const RemotionRoot: React.FC = () => {
  const defaultProps: RenderProps = {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    scenes: [],
    avatarPosition: "bottom-right",
    avatarSize: 280,
    showSubtitles: true,
  };

  return (
    <>
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={Math.max(1, calculateTotalFrames(defaultProps))}
        fps={defaultProps.fps}
        width={defaultProps.resolution.width}
        height={defaultProps.resolution.height}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const introDur = props.intro
            ? Math.ceil((props.intro.durationSeconds ?? 3) * props.fps)
            : 0;
          const outroDur = props.outro
            ? Math.ceil((props.outro.durationSeconds ?? 3) * props.fps)
            : 0;
          const total = introDur + calculateTotalFrames(props) + outroDur;
          return {
            durationInFrames: Math.max(1, total),
            fps: props.fps,
            width: props.resolution.width,
            height: props.resolution.height,
          };
        }}
      />
    </>
  );
};
