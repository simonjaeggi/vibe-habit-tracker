# Backend CI/CD notes

This repo now includes a minimal GitHub Actions pipeline for the backend (`habit-tracker-api`) that runs tests/builds on every push/PR and triggers a deployment via a Vercel Deploy Hook on `main`.

## Vercel setup (serverless)
1. Create a Vercel project and choose "Import Git Repository". Point the root directory to `habit-tracker-api` (monorepo setting in the dashboard).
2. `Build & Output`: Framework preset "Other"; Install command `npm ci`; Build command `npm run build` (or leave empty, Vercel will build the serverless handler).
3. Environment variables (Production/Preview):
   - `DATABASE_TYPE=postgres` (or another cloud DB supported by TypeORM)
   - `DATABASE_URL=<cloud-database-connection-string>` (SQLite files are not supported on Vercel)
   - `DATABASE_SSL=true` (and optionally `DATABASE_SSL_REJECT_UNAUTHORIZED=false`) if your DB requires TLS and uses a self-signed cert (common with Neon/Supabase).
   - `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_ORIGIN`, `GOOGLE_*`, etc. as needed.
   - Optional fallback: `DATABASE_TYPE=sqlite` with `DATABASE_IN_MEMORY=true` for an in-memory DB. This is **ephemeral per cold start** and not suitable for production data.
4. Project Settings → Git → Deploy Hooks: create a Production hook and copy its URL.
5. Ensure the Vercel project root is `habit-tracker-api` so it picks up `vercel.json` and `api/index.ts`.

## GitHub secret
- In the GitHub repo, add `VERCEL_DEPLOY_HOOK_URL` (Settings → Secrets and variables → Actions) with the hook URL from step 4.

## What the workflow does
- `.github/workflows/backend-ci.yml`: runs `npm ci`, `npm test -- --runInBand`, and `npm run build` in `habit-tracker-api` for pushes/PRs to `main`.
- If on `main`, it POSTs to `VERCEL_DEPLOY_HOOK_URL` to let Vercel build/deploy.

## Optional
- For preview deployments per PR, create a second Vercel hook and add a `deploy_preview` job keyed off `github.event.pull_request` with its own secret.
