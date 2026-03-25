# devrel-toolkit

Create product demo videos and developer content from a single prompt. Two Claude Code skills — one for product demos, one for CDP Panda mascot videos — powered by Remotion motion graphics and AI avatars.

## Skills

- **`/make-demo`** — Product demo videos. Navigates your app, captures screenshots, generates motion graphics, and renders with an AI avatar presenter.
- **`/cdp-panda`** — CDP Panda videos. Creates Coinbase Developer Platform content from changelogs, tweets, URLs, or prompts. Split-screen layout with Remotion animations + panda avatar.

## Setup

```bash
# 1. Install skills
npx skills add https://github.com/browser-use/browser-use --skill browser-use
npx skills add remotion-dev/skills
npx skills add https://github.com/Must-be-Ash/devrel --skill make-demo
npx skills add https://github.com/Must-be-Ash/devrel --skill cdp-panda

# 2. Install system dependencies
npx devrel-toolkit setup

# 3. Add API keys to your project's .env.local
```

### API Keys

Add these to your project's `.env.local`:

```bash
# Required
HEYGEN_API_KEY=...          # HeyGen avatar generation — https://app.heygen.com/settings
ELEVENLABS_API_KEY=...      # ElevenLabs voice — https://elevenlabs.io (Starter $5/mo for cdp-panda)

# Optional
FIRECRAWL_API_KEY=...       # Scrape URLs into content — https://firecrawl.dev
TWITTER_BEARER_TOKEN=...    # Fetch tweets/threads — https://developer.x.com
```

Then restart Claude Code so skills load.

## Usage

```bash
# Product demo from your codebase
/make-demo "show the signup flow, highlight the OAuth buttons, then demo the dashboard"

# Product demo from a URL
/make-demo --url https://example.com "walk through the landing page"

# CDP Panda video from a blog post
/cdp-panda "Create a video about this: https://www.coinbase.com/developer-platform/..."

# CDP Panda video from a tweet thread
/cdp-panda "Fetch this thread and make a changelog recap: https://x.com/CoinbaseDev/status/..."

# Preview (fast, no avatar)
/make-demo --preview "quick look at the settings page"

# No avatar (motion graphics only)
/cdp-panda --no-avatar "motion graphics only, no panda"
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx devrel-toolkit doctor` | Check all dependencies |
| `npx devrel-toolkit setup` | Install missing dependencies |
| `npx devrel-toolkit render --props <path> --output <path>` | Full quality video render |
| `npx devrel-toolkit preview --props <path> --output <path>` | Quick low-res preview |
| `npx devrel-toolkit render --props <path> --transparent` | ProRes 4444 with transparency |

## Prerequisites

- **Node.js 18+**
- **FFmpeg** — `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- **Browser-Use CLI** or **Playwright** — for capturing app screenshots
