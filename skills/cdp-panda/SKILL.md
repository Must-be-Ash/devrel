---
name: cdp-panda
description: >
  Create Coinbase Developer Platform video content with the CDP Panda mascot.
  Use when the user wants to create CDP announcement videos, changelog explainers,
  tweet thread breakdowns, or educational content about CDP, x402, Base, or onchain
  development. Takes changelogs, tweets, URLs, PDFs, or free-form prompts as input.
---

# /cdp-panda — CDP Panda Video Creator

You are creating video content for Coinbase Developer Platform using the CDP Panda mascot. The tone is **casual and fun** — like a friendly tech YouTuber, not a corporate presenter. Use analogies, keep it conversational, make complex crypto/blockchain concepts accessible.

## Parsing the Command

```
/cdp-panda "<prompt or content>"
/cdp-panda --url <url> "<what to cover>"
/cdp-panda --tweet <tweet_url_or_id> "<angle>"
/cdp-panda --no-avatar "<prompt>"
/cdp-panda --preview "<prompt>"
```

- `<prompt>`: What the video should cover — can be a changelog, description, or just a topic
- `--url <url>`: Scrape a URL for content (blog post, docs page, changelog)
- `--tweet <url_or_id>`: Fetch a tweet/thread from X and build the video around it
- `--no-avatar`: Skip avatar, motion graphics only
- `--preview`: Fast low-res preview (480p, no avatar)

## Workflow

### Step 0: Verify Dependencies

```bash
npx devrel-toolkit doctor
```

If any checks fail, run `npx devrel-toolkit setup`.

**HeyGen API key**: Check if `HEYGEN_API_KEY` is set in `.env.local`. If missing, ask the user.

**Browser automation** (for URL screenshots): Try `browser-use` first, fall back to Playwright if CDP is blocked. See the `browser-use` skill for commands.

### Step 1: Gather Content

Based on what the user provided:

**Free-form prompt / changelog**: Read the content directly. If they pasted text or pointed to a file, read it.

**URL** (`--url`): Scrape the page content. Options in order of preference:
1. Claude Code's native web search/fetch
2. Firecrawl API (if `FIRECRAWL_API_KEY` is set in `.env.local`):
   ```bash
   FIRECRAWL_KEY=$(grep FIRECRAWL_API_KEY .env.local | cut -d= -f2)
   curl -s "https://api.firecrawl.dev/v1/scrape" \
     -H "Authorization: Bearer $FIRECRAWL_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"$URL\", \"formats\": [\"markdown\"]}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('markdown','')[:5000])"
   ```
3. Playwright screenshot for visual reference

**Tweet** (`--tweet`): Fetch from X API (if `TWITTER_BEARER_TOKEN` is set in `.env.local`):
```bash
BEARER=$(grep TWITTER_BEARER_TOKEN .env.local | cut -d= -f2)
# For a tweet ID:
curl -s "https://api.x.com/2/tweets/$TWEET_ID?expansions=author_id&tweet.fields=text,created_at,conversation_id" \
  -H "Authorization: Bearer $BEARER" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['text'])"
# For a thread (conversation_id):
curl -s "https://api.x.com/2/tweets/search/recent?query=conversation_id:$CONV_ID&tweet.fields=text,created_at&max_results=100" \
  -H "Authorization: Bearer $BEARER"
```

Extract the key points, announcements, or concepts to cover in the video.

### Step 2: Plan the Video

Plan the video based on the content. The format is **split-screen** — motion graphics on one side, panda avatar on the other.

You have two types of scenes:
- **Motion graphics** (Remotion animations) — the primary visual. Flow diagrams, code snippets animating in, comparisons, step-by-step reveals.
- **URL screenshots** — if the user provided a URL, capture key screens to show the real product/page.

You decide scene count, pacing, and narration. Keep it **casual and fun** — use analogies, be conversational.

### Step 3: Create Motion Graphic Scenes

**BEFORE writing any Remotion code:**
1. Read `references/animation-example.md` — complete working animated component to copy and adapt.
2. Load the `remotion-best-practices` skill rules for `timing` and `animations`.

**Non-negotiable animation rules:**
- You MUST call `useCurrentFrame()` in every animation component — without it, nothing moves
- Use `spring({ frame: frame - DELAY, fps })` with increasing DELAY for sequential reveals
- At frame 0, NOTHING should be visible — every element starts at opacity 0
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

2. Write animated React components. Study ALL patterns from `references/animation-example.md` — use orbital visualizations, journey paths with traveling dots, gradient hero typography, and animated SVG paths. Do NOT fall back to basic grids, box-arrow diagrams, or two-column text lists. Browse https://21st.dev for component design inspiration — search for visual patterns (cards, gradients, layouts) and recreate their style using Remotion `spring`/`interpolate` (do NOT use framer-motion, it doesn't work in Remotion's frame-by-frame rendering).

3. Register compositions and render to MP4:
   ```bash
   npx remotion render SceneName ./demo-work/screenshots/scene-name.mp4
   ```

**Style guide for CDP Panda videos:**
- Background: Animated gradient mesh (NOT flat color) — see `references/animation-example.md` for the mesh pattern
- Accent colors: Coinbase blue `#0052FF` (gradient to `#4d8bff`), green `#00D632` (gradient to `#4dff7a`), white `#FFFFFF`
- Font: system-ui with negative letter-spacing for headings, monospace for code
- Resolution: 1920x1080
- Use gradient text (`WebkitBackgroundClip: "text"`) for hero typography
- Use inline SVG icons, NEVER emojis
- Use glass-morphism cards with `backdropFilter: blur(12px)`
- Use orbital visualizations, animated SVG paths, and traveling light dots — NOT grids/boxes/arrows
- NEVER use CSS `filter: blur()` on animated elements (kills render performance)
- All content must be positioned in the right 2/3 of the frame (left 1/3 is the avatar)
- Browse https://21st.dev for design inspiration when creating new visual components

### Step 3b: Capture URL Screenshots (if applicable)

If the user provided a URL, capture screenshots using browser-use or Playwright. See the `browser-use` skill for commands. Scroll to the relevant content before screenshotting — no black/empty space.

### Step 4: Generate Panda Avatar Video

Generate **one single continuous avatar video** with all narration combined.

**Two-step process: ElevenLabs for voice → HeyGen for lip sync.**

**Step 4a: Generate audio with ElevenLabs**

```bash
ELEVEN_KEY=$(grep ELEVENLABS_API_KEY .env.local | cut -d= -f2)
NARRATION="Full narration text here..."

curl -s -o ./demo-work/avatars/narration.mp3 \
  "https://api.elevenlabs.io/v1/text-to-speech/yr43K8H5LoTp6S1QFSGg" \
  -H "xi-api-key: $ELEVEN_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$NARRATION\",
    \"model_id\": \"eleven_multilingual_v2\",
    \"voice_settings\": {
      \"stability\": 0.4,
      \"similarity_boost\": 0.8,
      \"speed\": 1.1
    }
  }"

echo "Audio generated: $(ls -la ./demo-work/avatars/narration.mp3)"
```

**Step 4b: Upload audio to temp host**

```bash
AUDIO_URL=$(curl -s -F "file=@./demo-work/avatars/narration.mp3" -A "devrel-toolkit/1.0" \
  https://tmpfiles.org/api/v1/upload | python3 -c \
  "import json,sys; print(json.load(sys.stdin).get('data',{}).get('url','').replace('tmpfiles.org/','tmpfiles.org/dl/'))")
echo "Audio URL: $AUDIO_URL"
```

**Step 4c: Create panda video with HeyGen (lip sync to audio)**

```bash
HEYGEN_KEY=$(grep HEYGEN_API_KEY .env.local | cut -d= -f2)

RESPONSE=$(curl -s -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-Api-Key: $HEYGEN_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_inputs\": [{
      \"character\": {
        \"type\": \"talking_photo\",
        \"talking_photo_id\": \"2a206a5ea88b44608f8e3ae85efa4214\",
        \"use_avatar_iv_model\": true
      },
      \"voice\": {
        \"type\": \"audio\",
        \"audio_url\": \"$AUDIO_URL\"
      },
      \"background\": { \"type\": \"color\", \"value\": \"#0a0a0a\" }
    }],
    \"dimension\": { \"width\": 1080, \"height\": 1080 }
  }")

VIDEO_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['video_id'])")

for i in $(seq 1 60); do
  RESULT=$(curl -s "https://api.heygen.com/v1/video_status.get?video_id=$VIDEO_ID" \
    -H "X-Api-Key: $HEYGEN_KEY")
  STATUS=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('status','unknown'))")
  echo "[$i] Status: $STATUS"
  if [ "$STATUS" = "completed" ]; then
    VIDEO_URL=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['video_url'])")
    curl -sL "$VIDEO_URL" -o ./demo-work/avatars/full-narration.mp4
    # Get duration from the audio file
    DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 ./demo-work/avatars/narration.mp3 2>/dev/null | cut -d. -f1)
    echo "Downloaded! Duration: ~${DURATION}s"
    break
  fi
  if [ "$STATUS" = "failed" ]; then echo "FAILED: $RESULT"; break; fi
  sleep 10
done
```

**Avatar settings** (hardcoded — CDP Panda):
- **Voice**: ElevenLabs → `yr43K8H5LoTp6S1QFSGg` (Matt — professional, natural male)
- **Model**: `eleven_multilingual_v2`
- **Speed**: `1.1` (slightly faster for energy)
- **Avatar**: HeyGen talking_photo `2a206a5ea88b44608f8e3ae85efa4214` (CDP Panda)
- **`use_avatar_iv_model`**: `true`
- **Background**: `#0a0a0a`
- **Dimensions**: `1080x1080` (1:1 square)
- **Env vars needed**: `ELEVENLABS_API_KEY` and `HEYGEN_API_KEY` in `.env.local`

### Step 5: Assemble & Render

Assemble `render-props.json` and render with the toolkit:

```bash
npx devrel-toolkit render --props ./demo-work/render-props.json --output video-output.mp4
```

**Important**:
- Use `"avatarPosition": "split-left"` with `"avatarSplitRatio": 33.33`, `"avatarBorder": "none"`, `"avatarBorderRadius": 0`, `"avatarMargin": 0` — panda takes the left 1/3, motion graphics fill the right 2/3. Design all animations within the right 66.67% of the frame using the panel wrapper from `references/animation-example.md`.
- Scene `avatarDuration` values must sum to avatar duration + 2 seconds (transitions eat time)
- `avatarClipPath` at the top level for continuous panda narration across all scenes
- `screenshotPath` can be PNG or MP4 (Remotion animation clips)

### Step 6: Deliver

Report the output file. Offer to iterate.

## Narration Style

**Open with a hook** — the first sentence grabs attention and sums up the whole video:
- GOOD: "x402 supports all ERC-20 tokens now!"
- BAD: "Hey, check this out, so today we're going to talk about..."

**Rules:**
- **No filler words** — never start with "hey", "so", "check this out", "let me show you". Get straight to it.
- **Everyday language** — normal words people actually say. Technical terms (ERC-20, Permit2, EIP-3009) are fine because that's the subject matter, but everything else should be plain English.
- **High energy, natural excitement** — not synthetic hype. Genuine enthusiasm about the tech.
- **Short punchy sentences** — 10-15 words max. People have short attention spans.
- **Address the viewer directly** — "you" not "users" or "developers"
- **No synthetic speech patterns** — don't write sentences that sound like AI. Read it out loud — if it sounds weird to say, rewrite it.
- **Use analogies** — "Permit2 is like a universal parking pass for your tokens"

## References

- **Animation patterns**: see `references/animation-example.md`
- **Remotion best practices**: refer to the Remotion agent skills
- **Browser-Use CLI**: refer to the browser-use skill
