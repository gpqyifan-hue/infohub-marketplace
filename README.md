# Center / 圆心

A location-aware social commerce prototype with map-first discovery.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- MVP flow: register/login → publish a geo-tagged post → search by keyword and radius

## Run locally

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

The frontend is served by Vite at http://localhost:5173 and proxies `/api` requests to the backend at http://localhost:3001.

For local development, the backend currently has a development JWT fallback. Set a private `JWT_SECRET` in `backend/.env` before exposing the service; never use the fallback in a deployed environment.

## Smoke test

```bash
npm test --workspace backend
```

The smoke test starts a temporary backend process and checks health, rejects unauthenticated publishing, registers/logs in a user, publishes a geo-tagged post, and finds it with keyword-and-radius search.

## MVP acceptance checklist

1. Open the Vite URL and confirm the feed loads.
2. Register a user and confirm login succeeds.
3. Publish a post with latitude/longitude and confirm it appears in the feed.
4. Search the post by keyword and a radius that includes its location.
5. Confirm an unauthenticated publish request returns HTTP 401.

## Current limitations

- Users and posts are held in process memory; they are lost when the backend restarts and are not shared across instances.
- The current map is a prototype visualization, not a production map provider integration.
- Orders are a demo endpoint and do not persist or process payments.
- This smoke test is an API integration check; it does not replace manual browser testing or a production deployment check.
