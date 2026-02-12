# User Guide: Teams Watcher Web

## Overview
**Teams Watcher Web** is a web dashboard for controlling and monitoring the Teams recorder engine in `/Users/sebastian/Developer/teams_recorder/engine`. It shows current status, recent logs, and configuration settings.

## Features
- **Real-time Status**: Shows if Teams is running, if a call is active, and the meeting title.
- **Theme Toggle**: Switch between dark and light mode from the top-right toolbar.
  - The selected theme is saved locally in your browser and restored on reload.
- **Remote Control**: Start or Stop the watcher service directly from the UI.
- **Live Logs**: View the latest logs from the watcher script.
- **Recording Playback**: Browse exported `.m4a` files and play them directly in the dashboard.
- **Configuration Editor**: Modify the `config.sh` file (keywords, timeouts) using a web form.

## Installation

### 1. Prerequisites
- **Node.js** (v18+)
- **Recorder engine** (must exist at `../engine` relative to the dashboard folder)

### 2. Setup
Install dependencies:

```bash
cd /Users/sebastian/Developer/teams_recorder/dashboard
npm install
```

### 3. Running the App
Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Dashboard
The main view handles everything:
- **Status Hero**: The large colored card shows the current state (Idle, Recording, Error).
- **Service Control**: Use the "Start" and "Stop" buttons to manage the background `launchd` service.
- **Service Control**: Use "Start", "Restart", and "Stop" to manage the background `launchd` service.
- **Logs Tab**: Scroll through the system logs to debug issues.
- **Logs Tab**: Choose tail size (50/100/200 lines) for faster troubleshooting.
- **Recordings Tab**: Select and play recent recordings. If a matching `.md` summary exists, it appears below the audio player.
- **Recordings Tab**: Download audio files or open generated summaries directly from the playback panel.
- **Config Tab**: Update keywords or settings. Click "Save" to apply changes (this may restart the service).

## Troubleshooting
- **"Offline" Status**: Ensure the engine in `../engine` is set up and the `.teams_watcher_status` file exists in your home directory.
- **Control Buttons Not Working**: The web app needs permission to run `launchctl`. If running in dev mode, this usually works.
- **Logs Not Showing**: Check if the log path in `config.sh` matches what the web app expects (`~/Library/Logs/TeamsVoiceMemos.log`).
