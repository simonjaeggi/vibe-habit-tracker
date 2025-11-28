# Backend CI/CD notes

This repo now includes a minimal GitHub Actions pipeline for the backend (`habit-tracker-api`) that runs tests/builds on every push/PR and triggers a deployment via a Vercel Deploy Hook on `main`.

## Vercel setup
1. Create a Vercel project and choose "Import Git Repository". Point the root directory to `habit-tracker-api` (monorepo setting in the dashboard).
2. Build settings: Install command `npm ci`, Build command `npm run build`. Add any runtime settings you need for your Nest API (serverless adapter or a custom server target).
3. Add env vars in Vercel (Production/Preview as needed) to match the backend's `.env`.
4. In Project Settings → Git → Deploy Hooks, create a Production hook and copy its URL.

## GitHub secret
- In the GitHub repo, add `VERCEL_DEPLOY_HOOK_URL` (Settings → Secrets and variables → Actions) with the hook URL from step 4.

## What the workflow does
- `.github/workflows/backend-ci.yml`: runs `npm ci`, `npm test -- --runInBand`, and `npm run build` in `habit-tracker-api` for pushes/PRs to `main`.
- If on `main`, it POSTs to `VERCEL_DEPLOY_HOOK_URL` to let Vercel build/deploy.

## Optional
- For preview deployments per PR, create a second Vercel hook and add a `deploy_preview` job keyed off `github.event.pull_request` with its own secret.
