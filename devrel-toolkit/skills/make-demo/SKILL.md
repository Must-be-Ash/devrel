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

**Browser automation**: You MUST use `browser-use` CLI for all browser interactions (screenshots, clicks, element detection). Do NOT use Playwright, Puppeteer, or write custom browser scripts. browser-use CLI is the required tool. Only fall back to Playwright if browser-use is genuinely not installed and cannot be installed.

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

Based on the user's prompt and your codebase knowledge, plan the demo:

- Break into **3–8 logical scenes** (e.g., "Landing page overview", "Sign up flow", "Dashboard tour")
- Write **natural, conversational narration** for each scene (30–60 words per scene)
- Determine **navigation steps** for each scene (which pages to visit, what to click, what to type)
- Identify **zoom targets** — the element being discussed should fill the frame
- Choose **transitions** between scenes (`fade` for most, `slide` for page changes, `cut` for quick switches)

**How to direct viewer attention**: Use **zoom** as the primary tool, not highlight overlays. Zoom into the element the avatar is talking about so it fills most of the frame. The viewer naturally looks at what's large and centered. Only use highlight overlays (box, glow) sparingly for small elements that need extra emphasis even when zoomed in. Most scenes should have a zoom and NO highlights.

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

**Always use `--headed` mode** so both you and the user can see what's happening:

```bash
browser-use --headed open <url>

# For each scene, execute navigation steps:
browser-use state                          # See available elements
browser-use click <index>                  # Click elements
browser-use input <index> "text"           # Fill forms
browser-use scroll down                    # Scroll
browser-use wait text "loaded"             # Wait for content

# Take screenshot — use viewport for above-the-fold, --full for long pages
browser-use screenshot ./demo-work/screenshots/scene-<id>.png
browser-use screenshot --full ./demo-work/screenshots/scene-<id>.png  # full page

# Get bounding boxes for highlights/zoom targets
browser-use get bbox <index>               # Returns { x, y, width, height }
```

Save all screenshots and record bounding box data for zoom targets.

**CRITICAL — Bounding boxes**: You MUST use `browser-use get bbox <index>` to get exact bounding box coordinates for every zoom target. NEVER guess or estimate bbox values. Wrong coordinates cause the zoom to frame empty space or cut off content. Run `browser-use state` to find the element index, then `browser-use get bbox <index>` to get the precise `{ x, y, width, height }`.

**Zoom framing**: The zoom bbox should include some padding around the target element (add ~50px on each side) so content isn't clipped at the edges. The zoom `level` controls magnification — use 1.3-1.5 for sections, 1.8-2.0 for small elements.

**Sync zoom with narration**: Each scene's zoom should target what the avatar is currently talking about. If the avatar says "the server checks the balance", the zoom should be on the balance check element, not the whole page.

**Important**: Use `browser-use state` after each navigation to see the current element indices. Element indices change between pages.

**Do NOT use Playwright, Puppeteer, or custom scripts.** Use `browser-use` CLI commands above. If a command fails, retry it — do not switch to a different browser automation tool.

### Step 4: Generate Avatar Clips

Skip this step if `--no-avatar` or `--preview` was specified.

1. First, check available avatars:
   ```bash
   npx devrel-toolkit d-id avatars
   ```

2. Prepare an avatar script JSON file (`./demo-work/avatar-script.json`):
   ```json
   [
     { "id": "scene-1-landing", "narration": "Welcome to our platform...", "avatarId": "<chosen-avatar-id>" },
     { "id": "scene-2-signup", "narration": "Signing up is simple...", "avatarId": "<chosen-avatar-id>" }
   ]
   ```

3. Generate avatar clips:
   ```bash
   npx devrel-toolkit d-id generate \
     --script ./demo-work/avatar-script.json \
     --output ./demo-work/avatars/ \
     --avatar "<avatar-id>"
   ```

4. This takes 1–5 minutes per scene. Wait for completion. The output includes a `manifest.json` with clip paths and durations.

### Step 5: Assemble Render Props

Combine screenshots, avatar clips, bounding boxes, and timing into `render-props.json`:

```json
{
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "scenes": [
    {
      "id": "scene-1-landing",
      "screenshotPath": "/absolute/path/to/demo-work/screenshots/scene-1-landing.png",
      "avatarClipPath": "/absolute/path/to/demo-work/avatars/scene-1-landing.mp4",
      "avatarDuration": 4.5,
      "narration": "Welcome to our platform. Let me show you how easy it is to get started.",
      "highlights": [],
      "zoom": {
        "bbox": { "x": 150, "y": 80, "width": 900, "height": 500 },
        "level": 1.4
      },
      "transition": "fade"
    }
  ],
  "avatarPosition": "bottom-right",
  "avatarSize": 280,
  "showSubtitles": true
}
```

**Important**: All file paths must be **absolute paths**.

Get avatar durations from the `manifest.json` generated in Step 4. If no avatar, estimate duration from narration word count (~150 words per minute).

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
- Run `npx devrel-toolkit setup` or install manually: `curl -fsSL https://browser-use.com/cli/install.sh | bash`
- Do NOT use `pip install browser-use` — that installs the Python SDK, not the CLI
- If browser-use cannot be installed, fall back to Playwright

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
