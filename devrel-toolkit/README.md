# devrel-toolkit

Toolkit for automated product demo video creation with AI avatars and Remotion compositing. Designed to be used with the `/make-demo` Claude Code skill.

## Prerequisites

- **Node.js 18+**
- **FFmpeg** — `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- **Browser-Use CLI** — `curl -fsSL https://browser-use.com/cli/install.sh | bash`
- **D-ID API key** — Sign up at [d-id.com](https://d-id.com), add to `.env.local` as `DID_API_KEY`

## Quick Start

```bash
# Check dependencies
npx devrel-toolkit doctor

# Install the Claude Code skill
npx skills add <repo-url> --skill make-demo

# Then in Claude Code:
/make-demo "show the signup flow and dashboard"
```

## Install the Skill

```bash
# Option A: Use the built-in command
npx devrel-toolkit install-skill

# Option B: Install from repo
npx skills add <repo-url> --skill make-demo
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx devrel-toolkit doctor` | Check all dependencies |
| `npx devrel-toolkit d-id avatars` | List available D-ID avatars |
| `npx devrel-toolkit d-id generate --script <path> --output <dir>` | Generate avatar clips |
| `npx devrel-toolkit render --props <path> --output <path>` | Full quality video render |
| `npx devrel-toolkit preview --props <path> --output <path>` | Quick low-res preview |
| `npx devrel-toolkit render --props <path> --transparent` | ProRes 4444 with transparency |
| `npx devrel-toolkit setup` | Install missing dependencies |
| `npx devrel-toolkit install-skill` | Install make-demo skill to ~/.claude/skills/ |

## Why a Custom Remotion Setup

This toolkit uses a custom Remotion configuration rather than `npx create-video` because:

- The compositor needs programmatic rendering via `bundle()` + `renderMedia()` (not Remotion Studio)
- Components are designed for the specific demo video pipeline (BrowserFrame, AvatarPiP, Highlights)
- The CLI wraps Remotion rendering with pre/post-processing steps (D-ID avatar generation, file validation)
- No Tailwind or extra styling dependencies needed — all styles are inline for Remotion compatibility

## Environment Variables

```bash
# In your project's .env.local
DID_API_KEY=...                     # D-ID API key for avatar video generation
BROWSER_USE_API_KEY=...             # (Optional) Browser-Use Cloud API key
```
