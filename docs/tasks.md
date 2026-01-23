# Tasks: Teams Watcher Web

Status Key:
- [ ] Not Started
- [/] In Progress
- [x] Completed

## Improvements
- [ ] **Dark Mode Toggle**: Currently hardcoded to dark mode; add a toggle for light mode.
- [ ] **Config Parser**: Improve the `ConfigEditor` regex to handle array modification (adding keywords) more robustly. currently it might be brittle.
- [ ] **Toast Notifications**: Add toast feedback when saving config or toggling service.

## Integration
- [ ] **WebSocket Support**: Replace polling with a file watcher (chokidar) + WebSockets for instant updates.
- [ ] **Recording Playback**: Allow playing back the `.m4a` files directly in the browser (would require serving the `Audiodateien` folder).

## Documentation
- [x] Create `docs/` folder.
- [x] Create `docs/user_guide.md`.
- [x] Create `docs/code_explanation.md`.
- [x] Create `docs/tasks.md`.
