# Code Explanation: Teams Watcher Web

This is a **Next.js 14+** application using the **App Router**, **Tailwind CSS**, and **Shadcn UI**.

## Architecture

The app acts as a **GUI Wrapper** around the shell scripts from the `teams_voice_memos` project.

**Data Flow:**
1. **Frontend (`app/page.tsx`)**: Periodically polls `/api/status` (every 3s).
2. **Backend API (`app/api/status/route.ts`)**:
   - Reads `~/.teams_watcher_status` to get the current state.
   - Reads `~/Library/Logs/TeamsVoiceMemos.log` to get the tail of the logs.
3. **Backend API (`app/api/control/route.ts`)**: Executes shell commands (`launchctl load/unload`) to start/stop the service.
4. **Backend API (`app/api/config/route.ts`)**: Reads and writes the `config.sh` file.

## Key Components

- **`app/page.tsx`**: Main entry point. Manages global state (`status`, `logs`) and the polling interval.
- **`components/StatusHero.tsx`**: Visualizes the state (Green for Recording, Red for Error, Blue for Idle).
- **`components/LogViewer.tsx`**: A simple scrollable terminal-like view.
- **`components/ConfigEditor.tsx`**: Parses the `config.sh` (Key=Value format) into a form and re-serializes it on save.

## Tech Stack
- **Next.js**: Framework.
- **React**: UI Library.
- **Tailwind CSS**: Styling (v4).
- **Lucide React**: Icons.
- **Radix UI**: Accessible primitives (Tabs, Slot).

## Design Decisions
- **Polling vs WebSockets**: Polling was chosen for simplicity. Since the watcher script writes to a file every few seconds anyway, a 3-second poll from the web UI is sufficient and doesn't require a complex WebSocket server.
- **Direct File Access**: The API routes access the filesystem directly. This works fine for a local tool but would need security hardening if exposed to a network.
