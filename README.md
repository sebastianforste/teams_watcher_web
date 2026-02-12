# Teams Watcher Web

A Next.js 16 dashboard for monitoring and controlling the **Teams Voice Memos** automation system.

## 🚀 Features

- **Live Status Monitor**: Real-time view of watcher state (`idle`, `recording`, `stopped`)
- **Config Editor**: Edit trigger keywords and timing settings via web UI
- **Log Viewer**: Browse recent activity logs without terminal commands
- **Control Panel**: Start/stop the watcher remotely

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Validation**: Zod schemas for config safety

## 🛠️ Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📂 Project Structure

- `app/`: App Router pages and layouts
- `components/`: UI components (ConfigForm, LogViewer)
- `lib/`: Shared utilities and state management
- `app/api/config/route.ts`: Config read/write API (validated with Zod)

## Recent Improvements

- ✅ **Zod validation**: Safe config editing with `config-schema.ts`
- ✅ **Shell parser**: Safe reading/writing of `config.sh` without raw storage access
- ✅ **Live status streaming**: `/api/status/stream` (SSE) with automatic client fallback polling
