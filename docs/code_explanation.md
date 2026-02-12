# Code Explanation: Teams Watcher Web

This is a **Next.js 16** application using the **App Router**, **Tailwind CSS**, and **Shadcn UI**.

## Architecture

The app acts as a **GUI wrapper** around the shell scripts in `/Users/sebastian/Developer/teams_recorder/engine`.

**Data Flow:**
1. **Frontend (`app/page.tsx`)**: Subscribes to `/api/status/stream` (SSE) for live updates, with an automatic fallback to `/api/status` polling.
2. **Backend API (`app/api/status/stream/route.ts`)**:
   - Watches status/log files and pushes snapshot events to connected clients.
   - Emits heartbeat comments to keep long-lived connections healthy.
3. **Backend API (`app/api/status/route.ts`)**:
   - Reads `~/.teams_watcher_status` to get the current state.
   - Reads `~/Library/Logs/TeamsVoiceMemos.log` to get the tail of the logs.
4. **Backend API (`app/api/control/route.ts`)**: Validates control actions and calls `launchctl` to start/stop the service.
5. **Backend API (`app/api/config/route.ts`)**: Reads and writes the `config.sh` file.
6. **Backend API (`app/api/recordings/*`)**: Lists exported recordings and streams audio/summary files to the UI.

## Key Components

- **`app/page.tsx`**: Main entry point. Manages global state (`status`, `logs`), theme preference, SSE subscription, and polling fallback.
- **`lib/status-snapshot.ts`**: Shared status/log snapshot reader used by both `/api/status` and `/api/status/stream`.
- **`components/StatusHero.tsx`**: Visualizes the state (Green for Recording, Red for Error, Blue for Idle).
- **`components/LogViewer.tsx`**: A simple scrollable terminal-like view.
- **`components/RecordingsBrowser.tsx`**: Lists exported recordings and provides in-browser playback plus summary preview.
- **`components/ConfigEditor.tsx`**: Edits `config.sh` and surfaces save/load errors in the UI.

## Tech Stack
- **Next.js**: Framework.
- **React**: UI Library.
- **Tailwind CSS**: Styling (v4).
- **Lucide React**: Icons.
- **Radix UI**: Accessible primitives (Tabs, Slot).

## Design Decisions
- **SSE + Fallback**: SSE provides near-real-time updates with lower request churn; polling remains as a resilience fallback.
- **Direct File Access**: API routes access local files directly and are restricted to local same-origin requests for control/config operations.
