---
inclusion: always
---

# educationalbridgeui-main — Steering

React frontend for the educationalbridge platform. Bootstrapped with Create React App, deployed on prod behind Node/Express + Nginx.

## Stack
- React 18, Create React App (`react-scripts` 5), React Router 6
- UI: mix of `@material-ui/core` v4 (legacy) and `@mui/material` v5 (newer) — both are present, check what a given screen already uses before introducing a third UI approach
- State: Redux + redux-thunk (`src/store`)
- Rich text: CKEditor 5 and TinyMCE both present depending on the screen
- Tailwind CSS is configured (`tailwind.config.js`) alongside Material UI — check `src/index.css` / `input.css` for how it's wired in before adding Tailwind classes broadly
- SSR entry point exists (`server.js`, `server/index.js`) using `react-dom/server` + `react-router-config`, used only in the prod deployment path — not needed for local `npm start` dev loop

## Local run setup
- `npm install --legacy-peer-deps` — required because `@material-ui/core@4` declares a peer dep on React 16/17, which conflicts with the installed React 18. Plain `npm install` will fail with an ERESOLVE error.
- A project-local `.npmrc` pins the registry to `https://registry.npmjs.org/` — the global `~/.npmrc` on this machine points at an internal Amazon CodeArtifact registry not meant for this project. Don't remove the local `.npmrc`.
- `npm start` runs the CRA dev server on port 3000.
- Backend base URL is configured in `src/constants/hostConfig.js` via `currentHost`. Currently set to `http://localhost:8080/` for local dev against the local backend. The production value (`https://api.educationalbridge.com/`) is commented out directly above — swap back before deploying.

## Conventions
- Button background color: `bg-blue-400` (documented in `src/js/Convensions`, keep that file updated as new UI conventions are agreed on)
- API calls go through dedicated connector classes in `src/apis/` (e.g. `UserAPIConnector`, `PaperAPIsConnector`, `ChannelReceiver`, `QuestionsReceiver`, `TagReceiver`) — static async methods using `fetch` against `currentHost`. Add new backend calls as static methods on the relevant connector rather than calling `fetch` directly from components.
- Screen/feature code lives under `src/js/<feature>` (e.g. `questionSet/`, `paperSet/`, `channelSet/`, `adminPortal/`, `header/`, `coreCapabilities/`). Some feature dirs have separate `largeScreen/` and `smallScreen/` component variants for responsive layouts — check both when changing shared behavior.
- Routes are centralized in `src/route.js`.

## Known issues (pre-existing, not yet cleaned up)
- Lint currently reports many `eqeqeq` (`==` vs `===`) and `no-unused-vars` warnings across `src/js` and `src/utils`. These are pre-existing; don't feel obligated to fix unrelated lint warnings as part of unrelated changes, but new code should use `===`/`!==`.
