# RenderProps JSON Schema

This is the schema consumed by `npx devrel-toolkit render` (Step 6). Assembled in Step 5 from screenshots, avatar clips, and bounding boxes.

```json
{
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "scenes": [
    {
      "id": "string",
      "screenshotPath": "string (absolute path to screenshot PNG)",
      "avatarClipPath": "string (optional — absolute path to avatar MP4)",
      "avatarDuration": "number (seconds — from manifest.json or estimated)",
      "narration": "string (for subtitles)",
      "url": "string (optional — displayed in browser chrome URL bar)",
      "title": "string (optional — scene title for progress)",
      "highlights": [
        {
          "bbox": { "x": 0, "y": 0, "width": 300, "height": 50 },
          "style": "box | glow | arrow | underline",
          "color": "string (optional)"
        }
      ],
      "zoom": {
        "bbox": { "x": 0, "y": 0, "width": 800, "height": 400 },
        "level": 1.5
      },
      "transition": "fade | slide | cut",
      "cursorPath": [
        { "x": 100, "y": 200, "timestamp": 0 },
        { "x": 300, "y": 400, "timestamp": 1000 }
      ]
    }
  ],
  "avatarPosition": "bottom-right | bottom-left | top-right | top-left",
  "avatarSize": 280,
  "showSubtitles": true,
  "intro": { "title": "string", "subtitle": "string (optional)", "durationSeconds": 3 },
  "outro": { "title": "string", "subtitle": "string (optional)", "durationSeconds": 3 },
  "backgroundMusic": "string (optional — path to audio file)"
}
```

## Important
- All file paths (`screenshotPath`, `avatarClipPath`, `backgroundMusic`) must be **absolute paths**
- `avatarDuration`: get from `manifest.json` after D-ID generation. For no-avatar mode, estimate: `words / 2.5` (150 wpm)
- `bbox` values come from `browser-use get bbox <index>`
- `cursorPath` timestamps are in milliseconds from scene start
