# reframe — Architecture

AI style transfer CLI for sports highlights. Converts video/image clips into copyright-safe artwork using ima2 and Grok v2v.

## Directory Structure

```
src/
  bin/          CLI entry point
  core/         Core pipeline logic (extract frames, style transfer, reassemble)
  providers/    AI provider adapters (ima2, grok-v2v)
devlog/
  _plan/        Active plans
  _fin/         Completed work
structure/      Architecture docs (this file)
```

## Pipeline

```
Input (MP4/GIF/Image)
  → Frame extraction (ffmpeg)
  → Style transfer (ima2 / grok-v2v)
  → Reassembly (ffmpeg → MP4/GIF)
  → Output
```
