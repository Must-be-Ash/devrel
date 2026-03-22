# DemoScript JSON Schema

This is the schema Claude Code produces after planning the demo (Step 2).

```json
{
  "title": "string",
  "description": "string",
  "url": "string (app URL)",
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "scenes": [
    {
      "id": "string (unique scene identifier)",
      "title": "string",
      "narration": "string (what the avatar says)",
      "navigation": [
        {
          "action": "goto | click | scroll | type | wait | hover",
          "target": "string (URL, selector, or description)",
          "value": "string (for type/scroll actions)",
          "waitAfter": "number (ms to wait after action)"
        }
      ],
      "highlights": [
        {
          "selector": "string (CSS selector or description)",
          "style": "box | glow | arrow | underline",
          "color": "string (optional, default: #4A90D9)"
        }
      ],
      "zoom": {
        "selector": "string (element to zoom into)",
        "level": "number (1.0 = no zoom, 2.0 = 2x)"
      },
      "transition": "fade | slide | cut"
    }
  ]
}
```

## Notes
- `id` should be descriptive: `scene-1-landing`, `scene-2-signup`
- `narration` should be 30-60 words per scene
- `navigation` steps execute sequentially to reach the scene's state
- `zoom` and individual `highlights` are optional
- `transition` controls how this scene appears (first scene uses `fade`)
