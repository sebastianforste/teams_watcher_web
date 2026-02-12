# Tasks: Teams Watcher Web

Status Key:
- [ ] Not Started
- [/] In Progress
- [x] Completed

## Improvements
- [x] **Dark Mode Toggle**: Added a top-bar theme toggle with light/dark persistence.
- [x] **Config Parser**: Replaced brittle regex-only config updates with a line-oriented parser/updater.
- [x] **Toast Notifications**: Added dashboard toasts for service control actions.

## Integration
- [x] **Live Status Streaming**: Added `/api/status/stream` (SSE) backed by file watchers, with frontend polling fallback.
- [x] **Recording Playback**: Added recordings list and in-browser playback through `/api/recordings` endpoints.

## Documentation
- [x] Create `docs/` folder.
- [x] Create `docs/user_guide.md`.
- [x] Create `docs/code_explanation.md`.
- [x] Create `docs/tasks.md`.
