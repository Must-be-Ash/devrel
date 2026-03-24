# DevRel Agent

Two Claude Code skills for creating video content with AI avatars and Remotion motion graphics.

## Skills

### `/make-demo` — Product Demo Videos
Navigates your app, captures screenshots, generates an AI avatar presenter (HeyGen), and renders a polished MP4. Use inside any codebase.

### `/cdp-panda` — CDP Panda Videos
Creates Coinbase Developer Platform content with the CDP Panda mascot. Takes changelogs, tweets, URLs, or prompts. Split-screen layout with motion graphics + panda avatar. Uses ElevenLabs for voice + HeyGen for lip sync.

## Install

Paste this into Claude Code:

```
Install the DevRel Agent video toolkit. Do ALL of the following steps:

1. Install the required skills:
   npx skills add https://github.com/browser-use/browser-use --skill browser-use
   npx skills add remotion-dev/skills
   npx skills add https://github.com/Must-be-Ash/devrel --skill make-demo
   npx skills add https://github.com/Must-be-Ash/devrel --skill cdp-panda

2. Install system dependencies:
   npx devrel-toolkit setup

3. Add API keys to this project's .env.local:
   HEYGEN_API_KEY=<heygen_key>
   ELEVENLABS_API_KEY=<elevenlabs_key>
   FIRECRAWL_API_KEY=<firecrawl_key>
   TWITTER_BEARER_TOKEN=<twitter_bearer_token>

Once everything is done, tell me to restart Claude Code so the skills load.
```

**API keys:**
- HeyGen: [app.heygen.com/settings](https://app.heygen.com/settings) (Pay-As-You-Go)
- ElevenLabs: [elevenlabs.io](https://elevenlabs.io) (Starter $5/mo — needed for cdp-panda voice)
- Firecrawl: [firecrawl.dev](https://firecrawl.dev) (optional — for scraping URLs into content)
- Twitter/X: [developer.x.com](https://developer.x.com) (optional — for fetching tweets/threads)

After Claude Code finishes, **restart Claude Code** so the skills load.

## Usage

```
# Product demo from your codebase
/make-demo "show the signup flow, highlight the OAuth buttons, then demo the dashboard"

# CDP Panda video from a URL
/cdp-panda "Create a video about this: https://www.coinbase.com/developer-platform/discover/launches/x402-ERC20"

# CDP Panda video from a tweet
/cdp-panda "Fetch this thread and make a changelog recap: https://x.com/CoinbaseDev/status/..."

# Options
/make-demo --url https://example.com "walk through the landing page"
/make-demo --preview "quick look at the settings page"
/make-demo --no-avatar "just record the checkout flow with highlights"
/cdp-panda --no-avatar "motion graphics only, no panda"
```
