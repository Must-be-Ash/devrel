---
name: make-demo
description: >
  Create professional product demo videos with AI avatar presenter.
  Use when the user wants to record a product demo, create a video walkthrough,
  showcase app features, or generate a DevRel-style demo video. Analyzes your
  codebase, captures browser screenshots, generates HeyGen avatar narration, and
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
- `--no-avatar`: Skip HeyGen avatar generation, browser recording only
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

If browser-use fails with timeout errors on `open` (even after 120s), the machine likely has an enterprise policy blocking Chrome DevTools remote debugging (CDP). Browser-use depends on CDP and cannot work in this environment. Use Playwright instead — it ships its own Chromium binary that bypasses enterprise policies:
```bash
npx playwright install chromium  # one-time setup
```
Then use Playwright's Node.js API — write a small `.mjs` script for each capture task using `chromium.launch()`, `page.goto()`, `page.screenshot()`, `page.locator().boundingBox()`.

**HeyGen API key**: Check if `HEYGEN_API_KEY` is set (in `.env.local` or environment). If it is NOT set and the user did NOT pass `--no-avatar`:
- Ask the user: "I need a HeyGen API key to generate the avatar presenter. You can get one at https://app.heygen.com/settings. Would you like to provide your key, or should I skip the avatar and create a video without a presenter?"
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

# Take screenshot — viewport only, NOT full page
browser-use screenshot ./demo-work/screenshots/scene-<id>.png

# Get bounding boxes for zoom targets
browser-use get bbox <index>               # Returns { x, y, width, height }

# When done
browser-use close
```

Save all screenshots and record bounding box data for zoom targets.

**Screenshots must show content, not empty space.** Before taking each screenshot, scroll to the section you want to capture so it fills the viewport. If the page has a hero at the top, take the screenshot there. If you need to show a section further down, `browser-use scroll down` first until that section is visible, then screenshot. Never capture black/empty space above or below the content — the video frame should be filled with the actual UI.

**CRITICAL — Bounding boxes**: You MUST use `browser-use get bbox <index>` to get exact bounding box coordinates for every zoom target. NEVER guess or estimate bbox values. Wrong coordinates cause the zoom to frame empty space or cut off content. Run `browser-use state` to find the element index, then `browser-use get bbox <index>` to get the precise `{ x, y, width, height }`.

**Zoom framing**: The zoom bbox should include some padding around the target element (add ~50px on each side) so content isn't clipped at the edges. The zoom `level` controls magnification — use 1.3-1.5 for sections, 1.8-2.0 for small elements.

**Sync zoom with narration**: Each scene's zoom should target what the avatar is currently talking about. If the avatar says "the server checks the balance", the zoom should be on the balance check element, not the whole page.

**Important**: Use `browser-use state` after each navigation to see the current element indices. Element indices change between pages.

**Do NOT use Playwright, Puppeteer, or custom scripts.** Use `browser-use` CLI commands above. If a command fails, retry it — do not switch to a different browser automation tool.

### Step 3b: Create Custom Animation Scenes (if planned)

For scenes that need animated explainers, flow diagrams, or motion graphics instead of static screenshots.

**BEFORE writing any Remotion code:**
1. Read `references/animation-example.md` — it has a complete, working animated component you can copy and adapt. Use the `useStagger` helper pattern from that file.
2. Load the `remotion-best-practices` skill rules for `timing` and `animations`.

**Non-negotiable animation rules:**
- You MUST call `useCurrentFrame()` in every animation component — without it, nothing moves
- Use `spring({ frame: frame - DELAY, fps })` with increasing DELAY for sequential reveals
- At frame 0, NOTHING should be visible — every element starts at opacity 0
- Connecting lines must animate their width/height from 0 to full
- Strikethroughs must draw across from left to right
- Set `durationInFrames` to at least `(number_of_elements × 25) + 60`

1. Create a Remotion project (non-interactive — no prompts):
   ```bash
   cd ./demo-work
   mkdir -p custom-animations && cd custom-animations
   npm init -y
   npm install remotion @remotion/cli @remotion/bundler react react-dom
   mkdir -p src public
   ```
   Then create `src/Root.tsx` and `src/index.ts` manually — do NOT use `npx create-video` (it requires interactive input that Claude Code cannot provide).

2. Read `references/animation-example.md` and use it as your starting template. Adapt the content to match your scenes. The file has a complete `useStagger` helper and working examples for flow diagrams and strikethrough animations.

3. Register it as a composition in `src/Root.tsx`. The `durationInFrames` MUST be long enough for all animations to complete (e.g., if you have 5 elements with 20-frame stagger, you need at least 100+ frames):
   ```tsx
   <Composition id="FlowDiagram" component={FlowDiagram}
     durationInFrames={180} fps={30} width={1920} height={1080} />
   ```
   Then render to MP4:
   ```bash
   npx remotion render FlowDiagram ./demo-work/screenshots/scene-flow-diagram.mp4
   ```
   **Test first**: run `npx remotion studio` and scrub through the timeline to verify elements animate in sequentially. If everything appears at once, your springs have no delays or your duration is too short.

4. Use the rendered MP4 as the `screenshotPath` for that scene in render-props.json.

**Animation rules**:
- **Every element must animate in** — nothing should just "be there" from frame 1
- Use staggered delays (20-30 frames apart) so elements appear one by one
- Arrows should draw in (width/height animating from 0 to full)
- Labels should fade + slide in (opacity 0→1 + translateY)
- Match the resolution (1920x1080) and dark background (#0a0a0a)
- Use the app's color scheme for visual consistency

### Step 4: Generate Avatar Video

Skip this step if `--no-avatar` or `--preview` was specified.

Generate **one single continuous avatar video** with all the narration combined. Do NOT generate separate clips per scene — separate clips create jarring cuts between sentences. One continuous video gives natural speech flow.

**Use the HeyGen API** directly via curl. Default avatar: Armando (casual, close-up, male).

```bash
HEYGEN_KEY=$(grep HEYGEN_API_KEY .env.local | cut -d= -f2)

# Concatenate ALL scene narrations into one string
NARRATION="Full narration text here. Each scene's narration joined together with natural pauses."

# Create the video
RESPONSE=$(curl -s -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-Api-Key: $HEYGEN_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_inputs\": [{
      \"character\": {
        \"type\": \"avatar\",
        \"avatar_id\": \"Armando_Casual_Front_public\",
        \"avatar_style\": \"closeUp\"
      },
      \"voice\": {
        \"type\": \"text\",
        \"input_text\": \"$NARRATION\",
        \"voice_id\": \"453c20e1525a429080e2ad9e4b26f2cd\"
      },
      \"background\": {
        \"type\": \"color\",
        \"value\": \"#1a1a1a\"
      }
    }],
    \"dimension\": { \"width\": 1080, \"height\": 1080 }
  }")

VIDEO_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['video_id'])")
echo "Video ID: $VIDEO_ID"

# Poll until done (takes 1-3 minutes)
for i in $(seq 1 60); do
  RESULT=$(curl -s "https://api.heygen.com/v1/video_status.get?video_id=$VIDEO_ID" \
    -H "X-Api-Key: $HEYGEN_KEY")
  STATUS=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('status','unknown'))")
  echo "[$i] Status: $STATUS"
  if [ "$STATUS" = "completed" ]; then
    VIDEO_URL=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['video_url'])")
    curl -sL "$VIDEO_URL" -o ./demo-work/avatars/full-narration.mp4
    echo "Downloaded avatar video!"
    break
  fi
  if [ "$STATUS" = "failed" ]; then
    echo "FAILED: $RESULT"
    break
  fi
  sleep 10
done
```

**Avatar settings** (hardcoded — these are tested and confirmed):
- Avatar: `Armando_Casual_Front_public` (casual male presenter)
- Style: `closeUp` (chest-up framing, not waist-up)
- Voice: `453c20e1525a429080e2ad9e4b26f2cd` (Archer — natural male voice)
- Background: `#1a1a1a` (dark, matches video aesthetic)
- Dimensions: `1080x1080` (1:1 square for PiP overlay)
- Text limit: 5000 characters per video

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
- **The total of all scene `avatarDuration` values must equal the avatar video duration + 2 seconds.** Transitions eat into the total time, so if the avatar is 48s, make the scene durations sum to 50s. Add the extra time to the last scene. This prevents the video from cutting off the avatar's closing line.

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

**HeyGen generation fails:**
- Check error message: 401 → API key issue, 402 → credits exhausted
- Offer to render without avatar: `--no-avatar` mode
- If timeout: the HeyGen API may be slow, suggest retrying

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
