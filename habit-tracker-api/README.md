# Habit Tracker API

Backend service for the Vibe Habit Tracker. This NestJS application currently focuses on the first building block of the platform: authenticating users through Google's OAuth flow so that every streak, reminder, or prompt is tied to a verified identity.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Google OAuth**

   Create a Google Cloud project, enable the `Google People API`, and configure OAuth credentials with an authorized redirect URI of `http://localhost:3000/auth/google/redirect`.

   Copy `.env.example` to `.env` and fill it in with the values from your Google Cloud console:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   | --- | --- |
   | `GOOGLE_CLIENT_ID` | OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | OAuth client secret |
   | `GOOGLE_CALLBACK_URL` | Redirect URL exposed by this API (defaults to `http://localhost:3000/auth/google/redirect`) |
   | `DATABASE_TYPE` | Database driver used by TypeORM (`sqlite` by default) |
   | `DATABASE_PATH` | File path for your SQLite database (ignored for non-SQLite drivers) |
   | `DATABASE_URL` | Optional connection string for Postgres/MySQL/etc. when `DATABASE_TYPE` is not `sqlite` |
   | `DATABASE_SYNCHRONIZE` | Allow TypeORM to auto-sync entities; keep `true` for local dev only |
   | `FRONTEND_ORIGIN` | Comma-separated list of origins allowed to call the API (defaults to all origins if unset) |

3. **Run the API**

   ```bash
   npm run start:dev
   ```

## Auth Flow Overview

- `GET /auth/google` starts the OAuth negotiation with Google.
- `GET /auth/google/redirect` is hit by Google after a user approves the scopes (`email` and `profile`). The API returns the Google profile metadata along with the OAuth tokens so clients can create sessions of their own.

The TypeORM-powered `UsersService` persists Google accounts into a local SQLite file so you can keep working offline. Switch `DATABASE_TYPE`/`DATABASE_URL` to point at Postgres, MySQL, etc., when you're ready for a shared environment.

## Authenticated API Calls

Until a first-party session mechanism lands, authenticated requests to the REST API expect an `X-User-Id` header whose value matches the `user.id` returned from the Google OAuth callback. The `HeaderUserGuard` loads the user from the database and injects it into the request context so downstream handlers can automatically scope data to the caller.

```
X-User-Id: 3bc0b792-f00d-4fa3-82d0-1234abcd5678
```

Requests missing the header or referencing a user that doesn't exist will be rejected with `401 Unauthorized`.

## Diary Entries

Users can record one journal entry per day. Only the creator can read/update/delete the entry that belongs to them.

| Endpoint | Description |
| --- | --- |
| `POST /diary` | Create/update a journal entry for a specific day. Body: `{ "content": "text", "entryDate": "2024-11-19" }` (date optional, defaults to today). |
| `GET /diary` | List all diary entries for the authenticated user (newest first). |
| `GET /diary/:id` | Fetch a single entry, scoped to the requesting user. |
| `PATCH /diary/:id` | Update the `content` and/or `entryDate` of an entry you own. |
| `DELETE /diary/:id` | Remove one of your entries. |

If you try to create two entries for the same day you'll receive a `409 Conflict`. Update the existing entry instead.

## Testing

```bash
npm run test
```

## Next Steps

- Point `DATABASE_TYPE` and `DATABASE_URL` at a hosted database once you're ready to deploy.
- Exchange Google tokens for first-party sessions or JWTs.
- Start modeling habits, vibes, and streak metadata that ties back to authenticated users.
