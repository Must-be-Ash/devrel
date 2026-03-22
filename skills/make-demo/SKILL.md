---
name: make-demo
description: >
  Create professional product demo videos with AI avatar presenter.
  Use when the user wants to record a product demo, create a video walkthrough,
  showcase app features, or generate a DevRel-style demo video. Analyzes your
  codebase, captures browser screenshots, generates D-ID avatar narration, and
  composites everything into a polished MP4.
---

# /make-demo — Product Demo Video Creator

You are creating a professional product demo video. Follow this workflow precisely.

## Parsing the Command

The user invokes this skill with:
```
/make-demo "<prompt>"
/make-demo --url <url> "<prompt>"
/make-demo --no-avatar "<prompt>"
/make-demo --preview "<prompt>"
/make-demo --script <path>
```

Parse the invocation:
- `<prompt>`: What the demo should show (required unless `--script` is used)
- `--url <url>`: Target URL (optional — default: detect local dev server)
- `--no-avatar`: Skip D-ID avatar generation, browser recording only
- `--preview`: Fast low-res preview (480p, 15fps, no avatar)
- `--script <path>`: Use a pre-written demo-script.json instead of planning

## Workflow

### Step 0: Verify Dependencies

```bash
npx devrel-toolkit doctor
```

If any checks fail, run `npx devrel-toolkit setup`.

**Browser automation**: You MUST use `browser-use` CLI for all browser interactions. It is a standalone Python CLI binary, NOT an npm package. Try running `browser-use` first. If not found in PATH, use the full path `~/.browser-use-env/bin/browser-use`. Never use `npx browser-use`.

If browser-use is not installed at all, install it:
```bash
curl -fsSL https://browser-use.com/cli/install.sh | bash
```
Then use `~/.browser-use-env/bin/browser-use` for all commands.

If browser-use fails with timeout errors on `open`, it may be a browser-use daemon bug. In that case, use Playwright as a fallback:
```bash
npx playwright install chromium  # one-time setup
```
Then use Playwright's Node.js API for screenshots — `page.goto()`, `page.screenshot()`, `page.locator().boundingBox()`.

**D-ID API key**: Check if `DID_API_KEY` is set (in `.env.local` or environment). If it is NOT set and the user did NOT pass `--no-avatar`:
- Ask the user: "I need a D-ID API key to generate the avatar presenter. You can get one at https://studio.d-id.com. Would you like to provide your key, or should I skip the avatar and create a video without a presenter?"
- Do NOT silently skip avatar generation. Always ask.

### Step 1: Understand the App

1. If you're in a project directory, read the codebase to understand:
   - What the app does, its pages/routes, key UI elements
   - Tech stack (React, Next.js, etc.)
   - How to start it if not running
2. Determine the target URL:
   - If `--url` was provided, use that
   - Otherwise check if a local dev server is running (try `curl -s http://localhost:3000` or similar)
   - If not running, start it: `npm run dev` (or the appropriate command)
3. Wait for the app to be accessible before proceeding.

### Step 2: Plan the Demo

Plan the demo based on the user's prompt. If the user gave a detailed description of what they want, build on top of it — improve pacing, narration, and structure, but don't discard their intent. If the prompt is brief, use your codebase knowledge to decide what to show and how.

You have two tools for creating scenes — use whichever makes sense for each part of the video:

- **App footage** — capture screenshots of the real app UI via browser-use. Good for showing the actual product.
- **Custom Remotion animations** — write React components for motion graphics, flow diagrams, explainers, or anything that communicates better with animation than a static screenshot. Render them to MP4 clips.

You decide the scene count, scene types, narration, zoom targets, and pacing. Mix app footage and custom animations however best serves the demo.

Produce a `demo-script.json` file:

```json
{
  "title": "App Demo",
  "description": "A walkthrough of the key features",
  "url": "http://localhost:3000",
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "scenes": [
    {
      "id": "scene-1-landing",
      "title": "Landing Page",
      "narration": "Welcome to our platform. Let me show you how easy it is to get started.",
      "navigation": [
        { "action": "goto", "target": "http://localhost:3000" },
        { "action": "wait", "value": "2000" }
      ],
      "highlights": [],
      "zoom": { "selector": ".hero-section", "level": 1.5 },
      "transition": "fade"
    }
  ]
}
```

### Step 3: Capture Browser Screenshots

Create a timestamped working directory to avoid conflicts between runs:
```bash
mkdir -p ./demo-work-$(date +%s)/screenshots
mkdir -p ./demo-work-$(date +%s)/avatars
```

Use `~/.browser-use-env/bin/browser-use` (full path) if `browser-use` is not in PATH.

**First command — open the URL** (use a long timeout, the first browser launch is slow):
```bash
~/.browser-use-env/bin/browser-use open <url>
```

Do NOT use `--headed` or `--profile` flags — headed mode times out in Claude Code's bash, and `--profile` causes macOS permission errors on Chrome cookies. Use plain headless mode. The built-in Chromium works fine for screenshots.

After the first `open`, subsequent commands are fast (~50ms) because the daemon stays alive:

```bash
browser-use state                          # See available elements with indices
browser-use click <index>                  # Click elements
browser-use input <index> "text"           # Fill forms
browser-use scroll down                    # Scroll
browser-use wait text "loaded"             # Wait for content

# Take screenshot
browser-use screenshot ./demo-work/screenshots/scene-<id>.png
browser-use screenshot --full ./demo-work/screenshots/scene-<id>.png  # full page

# Get bounding boxes for zoom targets
browser-use get bbox <index>               # Returns { x, y, width, height }

# When done
browser-use close
```

Save all screenshots and record bounding box data for zoom targets.

**CRITICAL — Bounding boxes**: You MUST use `browser-use get bbox <index>` to get exact bounding box coordinates for every zoom target. NEVER guess or estimate bbox values. Wrong coordinates cause the zoom to frame empty space or cut off content. Run `browser-use state` to find the element index, then `browser-use get bbox <index>` to get the precise `{ x, y, width, height }`.

**Zoom framing**: The zoom bbox should include some padding around the target element (add ~50px on each side) so content isn't clipped at the edges. The zoom `level` controls magnification — use 1.3-1.5 for sections, 1.8-2.0 for small elements.

**Sync zoom with narration**: Each scene's zoom should target what the avatar is currently talking about. If the avatar says "the server checks the balance", the zoom should be on the balance check element, not the whole page.

**Important**: Use `browser-use state` after each navigation to see the current element indices. Element indices change between pages.

**Do NOT use Playwright, Puppeteer, or custom scripts.** Use `browser-use` CLI commands above. If a command fails, retry it — do not switch to a different browser automation tool.

### Step 3b: Create Custom Animation Scenes (if planned)

For scenes that need animated explainers, flow diagrams, or motion graphics instead of static screenshots:

1. Create a temporary Remotion project in the working directory:
   ```bash
   cd ./demo-work
   npx create-video@latest --blank --no-tailwind --no-install custom-animations
   cd custom-animations && npm install
   ```

2. Write a React component for each animation scene. You have the Remotion best-practices skill — use it. Example for a flow diagram:
   ```tsx
   // src/FlowDiagram.tsx
   import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

   export const FlowDiagram: React.FC = () => {
     const frame = useCurrentFrame();
     const { fps } = useVideoConfig();
     // Animate arrows, labels, flow steps using interpolate/spring
     // ...
   };
   ```

3. Register it as a composition in `src/Root.tsx` and render to MP4:
   ```bash
   npx remotion render FlowDiagram ./demo-work/screenshots/scene-flow-diagram.mp4
   ```

4. Use the rendered MP4 as the `screenshotPath` for that scene in render-props.json. The toolkit will include it in the final video alongside the app screenshot scenes.

**Tips for custom animations**:
- Match the resolution (1920x1080) and dark background (#0a0a0a) for consistency
- Keep animations 3-8 seconds — they should complement the narration, not replace it
- Use the app's color scheme for visual consistency
- Prefer simple, clean motion graphics over complex 3D or particle effects

### Step 4: Generate Avatar Video

Skip this step if `--no-avatar` or `--preview` was specified.

Generate **one single continuous avatar video** with all the narration combined. Do NOT generate separate clips per scene — separate clips create jarring cuts between sentences. One continuous video gives natural speech flow.

1. Check available avatars:
   ```bash
   npx devrel-toolkit d-id avatars
   ```

2. Concatenate ALL scene narrations into one text, in order, with natural pauses between sections. Use `npx devrel-toolkit d-id generate` with a single-scene script:
   ```json
   [
     {
       "id": "full-narration",
       "narration": "Welcome to our platform. Let me show you how easy it is to get started. ... Signing up is simple. Just click the button and fill in your details. ... And that's it — you're ready to go.",
       "avatarId": "<chosen-avatar-id>"
     }
   ]
   ```

3. Generate:
   ```bash
   npx devrel-toolkit d-id generate \
     --script ./demo-work/avatar-script.json \
     --output ./demo-work/avatars/ \
     --avatar "<avatar-id>"
   ```

4. This takes 1–5 minutes. The output includes a `manifest.json` with the clip path and total duration. Use this single avatar clip as `avatarClipPath` for the **first scene only** — the PiP will play continuously across all scenes.

### Step 5: Assemble Render Props

Combine screenshots, avatar clips, bounding boxes, and timing into `render-props.json`:

```json
{
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "avatarClipPath": "/absolute/path/to/demo-work/avatars/full-narration.mp4",
  "avatarPosition": "bottom-right",
  "avatarSize": 280,
  "showSubtitles": true,
  "scenes": [
    {
      "id": "scene-1-landing",
      "screenshotPath": "/absolute/path/to/demo-work/screenshots/scene-1-landing.png",
      "avatarDuration": 5.0,
      "narration": "Welcome to our platform. Let me show you how easy it is to get started.",
      "highlights": [],
      "zoom": {
        "bbox": { "x": 150, "y": 80, "width": 900, "height": 500 },
        "level": 1.4
      },
      "transition": "fade"
    },
    {
      "id": "scene-2-flow",
      "screenshotPath": "/absolute/path/to/demo-work/screenshots/scene-2-flow.mp4",
      "avatarDuration": 6.0,
      "narration": "The server verifies your wallet and checks the on-chain balance.",
      "highlights": [],
      "transition": "fade"
    }
  ]
}
```

**Important**:
- All file paths must be **absolute paths**
- `avatarClipPath` at the top level is the single continuous avatar video — it plays across all scenes
- Each scene still needs `avatarDuration` — this controls how long that scene lasts (divide the total avatar duration across scenes proportionally based on narration word count)
- `screenshotPath` can be a PNG (app screenshot) or MP4 (custom animation from Step 3b)
- Get the total avatar duration from `manifest.json`. Divide it across scenes based on word count.

### Step 6: Render the Video

```bash
# Full quality render
npx devrel-toolkit render \
  --props ./demo-work/render-props.json \
  --output demo-output.mp4

# Or preview mode (fast, low-res)
npx devrel-toolkit preview \
  --props ./demo-work/render-props.json \
  --output preview-output.mp4
```

Wait for the render to complete. This may take a few minutes.

### Step 7: Deliver

1. Report the output file path to the user
2. Mention the video resolution, duration, and scene count
3. Offer to iterate: "Want me to adjust any scenes, change the narration, or re-render?"
4. Clean up: `browser-use close`

## Narration Writing Guide

- **Conversational tone**: Write as if explaining to a colleague, not reading a manual
- **Short sentences**: 10–15 words per sentence, 30–60 words per scene
- **Active voice**: "Click the sign-up button" not "The sign-up button can be clicked"
- **No filler**: Skip "as you can see" and "now I'm going to"
- **Match the audience**: Technical demos can use jargon; product demos should be accessible

## Error Handling

**browser-use not found:**
- Install it: `curl -fsSL https://browser-use.com/cli/install.sh | bash`
- Or run `npx devrel-toolkit setup` which handles the installation
- Do NOT use `pip install browser-use` — that installs the Python SDK, not the CLI
- Do NOT fall back to Playwright — install browser-use

**Browser navigation fails:**
- Retry the action once
- Try alternative selectors (by text, by role, by index)
- If still failing, skip the scene with a warning to the user

**D-ID generation fails:**
- Check error message: 401 → API key issue, 402 → credits exhausted
- Offer to render without avatar: `--no-avatar` mode
- If timeout: the D-ID API may be slow, suggest retrying

**Remotion render fails:**
- Verify all file paths in render-props.json exist
- Check that screenshot files are valid PNGs
- Try preview mode first to isolate issues

**Always clean up:**
```bash
browser-use close
```

## Debugging Compositions

For debugging video compositions before rendering, you can run Remotion Studio:
```bash
cd <devrel-toolkit-directory>
npx remotion studio
```
This opens a browser preview where you can scrub through the timeline, inspect individual scenes, and verify animations before committing to a full render.

## References

- **DemoScript schema** (Step 2 output): see `references/demo-script-schema.md`
- **RenderProps schema** (Step 5 output): see `references/render-props-schema.md`
- **Toolkit CLI commands**: see `references/toolkit-commands.md`
- **Browser-Use CLI**: refer to the browser-use skill for full command reference. Key commands used: `state`, `click`, `input`, `screenshot`, `get bbox`, `scroll`, `wait text`, `close`.
- **Remotion best practices**: refer to the Remotion agent skills for animation patterns, spring configs, and composition best practices.
