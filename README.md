# The 1404 Wall — frontend preview

Static HTML/CSS/ES modules, served directly by Firebase Hosting. No build step, backend, database, keys or chain transactions. The page deliberately says DEMO and disables inscription submission. The six entries in `public/app.js` are fictional; their dates and addresses are presentation samples, not block records.

## Local preview

From this directory run `python3 -m http.server 8080 -d public`, then open `http://localhost:8080`. ES modules require HTTP rather than opening the file directly.

## Structure

- `public/index.html`: accessible page layout and confirmation dialog.
- `public/styles.css`: responsive brand design.
- `public/app.js`: demo feed, text-only rendering, wallet connection and state handling.
- `public/config.js`: chain ID plus deliberately absent RPC, explorer, native currency and contract configuration.
- `firebase.json`: static hosting settings and restrictive headers.

## Before enabling real inscriptions

Verify the authentic Chain 1404 RPC, explorer, native currency, chain metadata and contract address from authoritative sources. Review and audit contract semantics, message byte limit, fees and event indexing. Replace the fictional feed with verified contract events (including reorg handling, pagination and transaction receipts). Validate chain ID, accounts and connection on every wallet action; only then implement explicit wallet network switching and contract calls. Handle rejected signatures, failed/replaced transactions, disconnects, RPC outages and duplicate pending submissions. Keep all messages as text nodes. Never put a private key or admin secret in the frontend. The present CSP has `connect-src 'none'`; update to allow only verified RPC/explorer endpoints if direct browser requests become necessary. Review deployed header behaviour against wallet injection and any selected RPC. Treat timestamps and inscription numbers as contract/event derived, not client generated.

## Deployment gate

Only deploy from the isolated Cloud Shell directory after running `gcloud config get-value project` and `firebase use` and confirming both output `bdag-1404-wall-b4889`. Check `firebase.json` and `.firebaserc`, then deploy with `firebase deploy --only hosting --project bdag-1404-wall-b4889`. Never deploy the draft contract as part of frontend work. This package has not been deployed by this Work session.
