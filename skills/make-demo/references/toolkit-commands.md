# devrel-toolkit CLI Commands

| Command | Description |
|---------|-------------|
| `npx devrel-toolkit doctor` | Check all dependencies (FFmpeg, browser-use, D-ID key) |
| `npx devrel-toolkit setup` | Install missing dependencies |
| `npx devrel-toolkit d-id avatars` | List available D-ID avatars and sentiments |
| `npx devrel-toolkit d-id generate --script <path> --output <dir>` | Generate avatar clips from script |
| `npx devrel-toolkit d-id generate --script <path> --output <dir> --avatar <id>` | Generate with specific avatar |
| `npx devrel-toolkit render --props <path> --output <path>` | Full quality video render (1080p, 30fps) |
| `npx devrel-toolkit render --props <path> --output <path> --resolution 720` | Render at 720p |
| `npx devrel-toolkit preview --props <path> --output <path>` | Quick low-res preview (480p, 15fps) |

## Generate Command Output

The `d-id generate` command produces:
- Individual avatar MP4 clips in the output directory: `<scene_id>.mp4`
- A `manifest.json` with clip paths and durations:
  ```json
  { "scenes": [{ "id": "scene-1", "clipPath": "/path/to/scene-1.mp4", "duration": 4.5 }] }
  ```

Use the `duration` values from the manifest when assembling `render-props.json`.
