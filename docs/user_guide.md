# User Guide: Teams Watcher Web

## Overview
**Teams Watcher Web** is a modern, web-based dashboard for controlling and monitoring the [Teams Voice Memos](../teams_voice_memos) automation. It allows you to see the current status, view logs, and change configuration settings from a beautiful dark-mode interface.

## Features
- **Real-time Status**: Shows if Teams is running, if a call is active, and the meeting title.
- **Remote Control**: Start or Stop the watcher service directly from the UI.
- **Live Logs**: View the latest logs from the watcher script.
- **Configuration Editor**: Modify the `config.sh` file (keywords, timeouts) using a web form.

## Installation

### 1. Prerequisites
- **Node.js** (v18+)
- **Teams Voice Memos** (Must be installed at `../teams_voice_memos`)

### 2. Setup
Install dependencies:

```bash
cd /Users/sebastian/Developer/teams_watcher_web
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
- **Logs Tab**: Scroll through the system logs to debug issues.
- **Config Tab**: Update keywords or settings. Click "Save" to apply changes (this may restart the service).

## Troubleshooting
- **"Offline" Status**: Ensure the `teams_voice_memos` project is correctly set up and the `.teams_watcher_status` file exists in your home directory.
- **Control Buttons Not Working**: The web app needs permission to run `launchctl`. If running in dev mode, this usually works.
- **Logs Not Showing**: Check if the log path in `config.sh` matches what the web app expects (`~/Library/Logs/TeamsVoiceMemos.log`).
