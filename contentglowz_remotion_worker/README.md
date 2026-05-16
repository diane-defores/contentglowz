# ContentGlowz Remotion Worker

Internal worker service for local Remotion renders used by `contentglowz_lab`.
The same worker can run in production on Cloud Run with Google Cloud Storage as
the durable artifact store.

## Environment

- `PORT` (optional, default `3210`)
- `REMOTION_WORKER_TOKEN` (required)
- `CONTENTGLOWZ_RENDER_DIR` (required in shared deployments, defaults to `./renders`)
- `CONTENTGLOWZ_RENDER_STORAGE` (optional, `local` or `gcs`; default `local`)
- `GCS_RENDER_BUCKET` (required when `CONTENTGLOWZ_RENDER_STORAGE=gcs`)
- `GCS_RENDER_PREFIX` (optional GCS object prefix, default `renders`)
- `RENDER_ARTIFACT_RETENTION_DAYS` (optional, default `30`)
- `REMOTION_SERVE_URL` (optional prebuilt bundle URL)

## Commands

- `npm run dev` - start worker with watch mode
- `npm run start` - start worker
- `npm run lint` - eslint + typescript check
- `npm run test:storage` - path/retention helper tests
- `npm run test:timeline` - timeline props schema and metadata tests
- `npm run remotion:studio` - inspect composition locally

Production deployment details live in `DEPLOYMENT.md`.

Timeline smoke render:

```bash
npx remotion render remotion/index.ts ContentGlowzTimelineVideo /tmp/contentglowz-timeline-smoke.mp4 \
  --props=remotion/timeline-smoke-props.json --overwrite
```

The smoke props are text/background only, so the command proves the Remotion
runtime and H.264 output path without relying on network media assets.

## API (token protected except health)

Auth header for protected endpoints:

`Authorization: Bearer <REMOTION_WORKER_TOKEN>`

### `GET /health`

Health probe.

### `POST /renders`

Create a render job.

Example body:

```json
{
  "jobId": "job-uuid",
  "renderMode": "preview",
  "durationSeconds": 60,
  "templateId": "video-timeline-v1",
  "compositionId": "ContentGlowzTimelineVideo",
  "inputProps": {
    "composition_id": "ContentGlowzTimelineVideo",
    "timeline_id": "timeline-123",
    "version_id": "version-9",
    "format": {
      "preset": "vertical_9_16",
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "duration_in_frames": 300
    },
    "tracks": [
      { "id": "visual-main", "type": "visual", "order": 0, "muted": false },
      { "id": "overlay", "type": "overlay", "order": 1, "muted": false },
      { "id": "audio-main", "type": "audio", "order": 2, "muted": false }
    ],
    "clips": [
      {
        "id": "bg",
        "track_id": "visual-main",
        "type": "background",
        "start_frame": 0,
        "duration_in_frames": 300,
        "style": { "background_color": "#0f172a" }
      },
      {
        "id": "title",
        "track_id": "overlay",
        "type": "text",
        "start_frame": 15,
        "duration_in_frames": 120,
        "text": "Unified ContentGlowz timeline"
      },
      {
        "id": "hero-image",
        "track_id": "visual-main",
        "type": "image",
        "start_frame": 0,
        "duration_in_frames": 150,
        "asset_ref": "asset-image-1"
      },
      {
        "id": "music-bed",
        "track_id": "audio-main",
        "type": "music",
        "start_frame": 0,
        "duration_in_frames": 300,
        "asset_ref": "asset-music-1",
        "trim_start_frame": 0,
        "volume": 0.45
      }
    ],
    "assets": {
      "asset-image-1": { "render_url": "https://cdn.example.com/image.jpg" },
      "asset-music-1": { "render_url": "https://cdn.example.com/music.mp3" }
    }
  }
}
```

Notes:

- `ContentGlowzTimelineVideo` supports `vertical_9_16` (`1080x1920`) and `landscape_16_9` (`1920x1080`) at `30fps`.
- Composition metadata is derived from `inputProps.format` via Remotion `calculateMetadata` (duration up to `5400` frames).
- Production timeline renders should receive server-resolved `assets[asset_id].render_url` values from `contentglowz_lab`; missing media asset URLs render a neutral visual placeholder instead of crashing during local composition development.

### `GET /renders/:workerJobId`

Get job status and artifact metadata when completed.

### `DELETE /renders/:workerJobId`

Cancel a queued or in-progress job.

## Artifact storage and retention

Local mode:

- Output paths are server-generated and safe:
  - `previews/{jobId}.mp4`
  - `finals/{jobId}.mp4`
- Path traversal attempts are rejected.
- Retention metadata:
  - `retentionExpiresAt`: 30 days after completion (configurable)
  - `deletionWarningAt`: 72 hours before retention expiry
- Cleanup runs on startup and daily, deleting expired `.mp4` files from preview/final folders.

GCS mode:

- Set `CONTENTGLOWZ_RENDER_STORAGE=gcs` and `GCS_RENDER_BUCKET`.
- Completed MP4s are uploaded to private object keys:
  - `{GCS_RENDER_PREFIX}/previews/{jobId}.mp4`
  - `{GCS_RENDER_PREFIX}/finals/{jobId}.mp4`
- Startup fails closed when GCS mode is selected without a bucket.
- The worker returns metadata (`provider`, `bucket`, `objectName`, size, mime,
  retention), never a browser playback URL.
- `contentglowz_lab` owns signed playback URLs after user ownership checks.
