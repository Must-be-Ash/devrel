import React from "react";
import { AbsoluteFill, Sequence, staticFile, interpolate, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type { RenderProps } from "../utils/schema.js";
import { calculateTotalFrames } from "./timing.js";
import { BrowserFrame } from "./components/BrowserFrame.js";
import { Highlight } from "./components/Highlight.js";
import { AvatarPiP } from "./components/AvatarPiP.js";
import { Subtitles } from "./components/Subtitles.js";
import { Cursor } from "./components/Cursor.js";
import { IntroOutroCard } from "./components/IntroOutro.js";

const INTRO_OUTRO_DEFAULT_SECONDS = 3;
const TRANSITION_DURATION_FRAMES = 15; // 0.5s at 30fps

function getPresentation(type: "fade" | "slide" | "cut") {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      return slide({ direction: "from-right" });
    case "cut":
      return null;
  }
}

export const DemoVideo: React.FC<RenderProps> = (props) => {
  const {
    scenes,
    fps,
    avatarPosition = "bottom-right",
    avatarSize = 280,
    showSubtitles = true,
    intro,
    outro,
    backgroundMusic,
  } = props;

  if (scenes.length === 0 && !intro && !outro) {
    return <AbsoluteFill style={{ backgroundColor: "#000" }} />;
  }

  const introFrames = intro
    ? Math.ceil((intro.durationSeconds ?? INTRO_OUTRO_DEFAULT_SECONDS) * fps)
    : 0;
  const outroFrames = outro
    ? Math.ceil((outro.durationSeconds ?? INTRO_OUTRO_DEFAULT_SECONDS) * fps)
    : 0;

  const transitionFrames = Math.ceil(TRANSITION_DURATION_FRAMES * (fps / 30));

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background music */}
      {backgroundMusic && <BackgroundMusic src={backgroundMusic} />}

      <TransitionSeries>
        {/* Intro card */}
        {intro && (
          <>
            <TransitionSeries.Sequence durationInFrames={introFrames} premountFor={Math.ceil(fps * 0.5)}>
              <IntroOutroCard data={intro} type="intro" durationFrames={introFrames} />
            </TransitionSeries.Sequence>
            {scenes.length > 0 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />
            )}
          </>
        )}

        {/* Main scenes */}
        {scenes.map((scene, index) => {
          const sceneDurationFrames = Math.ceil(scene.avatarDuration * fps);
          const nextScene = scenes[index + 1];

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence
                durationInFrames={sceneDurationFrames}
                premountFor={Math.ceil(fps * 0.5)}
              >
                <SceneContent
                  scene={scene}
                  durationFrames={sceneDurationFrames}
                  avatarPosition={avatarPosition}
                  avatarSize={avatarSize}
                  showSubtitles={showSubtitles}
                />
              </TransitionSeries.Sequence>

              {/* Transition to next scene (or outro) */}
              {(nextScene || outro) && scene.transition !== "cut" && nextScene?.transition !== "cut" && (
                <TransitionSeries.Transition
                  presentation={getPresentation(nextScene?.transition ?? "fade") ?? fade()}
                  timing={linearTiming({ durationInFrames: transitionFrames })}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Outro card */}
        {outro && (
          <TransitionSeries.Sequence durationInFrames={outroFrames} premountFor={Math.ceil(fps * 0.5)}>
            <IntroOutroCard data={outro} type="outro" durationFrames={outroFrames} />
          </TransitionSeries.Sequence>
        )}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/**
 * Scene content — renders all layers for a single scene.
 */
const SceneContent: React.FC<{
  scene: RenderProps["scenes"][number];
  durationFrames: number;
  avatarPosition: NonNullable<RenderProps["avatarPosition"]>;
  avatarSize: number;
  showSubtitles: boolean;
}> = ({ scene, durationFrames, avatarPosition, avatarSize, showSubtitles }) => {
  return (
    <AbsoluteFill>
      {/* Browser screenshot with zoom animation */}
      <BrowserFrame
        screenshotPath={scene.screenshotPath}
        url={scene.url}
        zoom={scene.zoom}
        durationFrames={durationFrames}
      />

      {/* Highlight overlays */}
      {scene.highlights.length > 0 && (
        <Highlight
          highlights={scene.highlights}
          durationFrames={durationFrames}
        />
      )}

      {/* Cursor animation */}
      {scene.cursorPath && scene.cursorPath.length > 0 && (
        <Cursor
          cursorPath={scene.cursorPath}
          durationFrames={durationFrames}
        />
      )}

      {/* Avatar picture-in-picture */}
      {scene.avatarClipPath && (
        <AvatarPiP
          clipPath={scene.avatarClipPath}
          position={avatarPosition}
          size={avatarSize}
          durationFrames={durationFrames}
        />
      )}

      {/* Subtitles */}
      {showSubtitles && scene.narration && (
        <Subtitles
          text={scene.narration}
          durationFrames={durationFrames}
          visible={true}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Background music with fade in/out and low volume.
 * Uses @remotion/media Audio with volume callback.
 */
const BackgroundMusic: React.FC<{
  src: string;
}> = ({ src }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = Math.ceil(2 * fps);
  const fadeOut = Math.ceil(2 * fps);
  const total = durationInFrames;

  return (
    <Audio
      src={staticFile(src)}
      volume={(f) =>
        interpolate(f, [0, fadeIn, total - fadeOut, total], [0, 0.15, 0.15, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};
