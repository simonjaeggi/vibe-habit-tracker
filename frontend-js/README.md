# Vibe Habit Tracker Frontend (Vite)

This Vite-powered playground helps you exercise the NestJS backend and its Google OAuth endpoints without building a full product UI yet.

## Scripts

```bash
# Install deps
npm install

# Local dev with hot reload (default http://localhost:5173)
npm run dev

# Production build + preview
npm run build
npm run preview
```

## Using the Playground

1. Start the API (defaults to `http://localhost:3000`).
2. Run `npm run dev` inside `frontend-js/`.
3. Open the dev server URL (e.g., `http://localhost:5173`) and set the backend base URL if it's different.

You can:

- **Ping API** – Calls `GET /` on the backend and displays whatever the server returns.
- **Continue with Google** – Opens the backend's `/auth/google` endpoint in a new tab so you can complete the OAuth consent screen. After granting access, the API returns the authenticated user profile and Google tokens in that tab.

The base URL is persisted in `localStorage`, making it easy to switch between local development and remote environments.
