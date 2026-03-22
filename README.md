# DevRel Agent

Create product demo videos from a single prompt. Claude Code navigates your app, captures screenshots, generates an AI avatar presenter, and renders a polished MP4.

## Install

Paste this into Claude Code:

```
Install the DevRel Agent video toolkit. Do ALL of the following steps:

1. Install the required skills:
   npx skills add https://github.com/browser-use/browser-use --skill browser-use
   npx skills add remotion-dev/skills
   npx skills add https://github.com/Must-be-Ash/devrel --skill make-demo

2. Install system dependencies:
   npx devrel-toolkit setup

3. Add my D-ID API key to this project's .env.local:
   DID_API_KEY=<my_key>

Once everything is done, tell me to restart Claude Code so the skills load.
```

Replace `<my_key>` with your D-ID API key from [d-id.com](https://studio.d-id.com).

After Claude Code finishes, **restart Claude Code** so the skills load.

## Usage

In Claude Code, inside any project:

```
/make-demo "show the signup flow, highlight the OAuth buttons, then demo the dashboard"
```

That's it. Claude Code plans the scenes, writes the narration, navigates the app, captures screenshots, generates avatar clips, and renders the final MP4.

### Options

```
/make-demo --url https://example.com "walk through the landing page"
/make-demo --preview "quick look at the settings page"
/make-demo --no-avatar "just record the checkout flow with highlights"
/make-demo --script ./my-script.json
```
