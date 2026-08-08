# EducationalBridge

EducationalBridge is a web platform for practicing JEE (Joint Entrance Exam)
questions. It lets users browse and solve individual questions or full mock
papers, track their performance, organize content into channels and tags, and
(for authors) create and edit questions, papers, tags, and channels through an
admin portal.

Live site: [www.educationalbridge.com](https://www.educationalbridge.com)

This repository contains the **frontend only** — a React single-page
application. It talks to a separate Spring Boot backend
(`backend-master-main`, not part of this repo) backed by MongoDB.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Design system / conventions](#design-system--conventions)
- [Deployment](#deployment)
- [SEO](#seo)
- [Known issues / quirks](#known-issues--quirks)
- [License](#license)

---

## Features

- **Question bank** — browse, filter (by tag/channel/search), and solve
  single-select MCQ questions, with LaTeX math rendering via KaTeX.
- **Papers** — timed mock-test style papers made up of multiple questions,
  with section-wise marking schemes.
- **Channels** — topical groupings of questions (e.g. by subject).
- **Tags** — free-form categorization (subject, topic, exam, difficulty,
  year, etc.) used for filtering and search.
- **Voting & comments** — upvote/downvote questions, threaded comments with
  replies.
- **User analytics** — per-question and per-paper score/accuracy analysis for
  logged-in users, plus a history of solved questions/papers.
- **Admin/authoring portal** — create and edit questions, papers, tags, and
  channels, including a rich text editor (CKEditor/TinyMCE) with math input.
- **Google Sign-In** — authentication via Google OAuth; no separate
  username/password system.
- **Ad rails** — reserved ad slots on wide viewports (desktop), never in the
  main content column.
- **Responsive** — distinct small-screen and large-screen layouts for the
  header and several key views.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 (bootstrapped with Create React App / `react-scripts`) |
| Routing | React Router v6 |
| State management | Redux + redux-thunk |
| Styling | Tailwind CSS, plus MUI v4 (`@material-ui/core`) and MUI v5 (`@mui/material`) components in older/newer areas of the app respectively |
| Rich text editing | CKEditor 5, TinyMCE (with WIRIS MathType plugins for equation input) |
| Math rendering | KaTeX (`katex`), sanitized with DOMPurify |
| Auth | `react-google-login` (Google Identity / OAuth) |
| Charts | `react-google-charts` |
| HTTP | Native `fetch` via small `*Receiver`/`*Connector` API client classes |
| Hosting (production) | AWS Amplify Hosting, deployed from this GitHub repo |

The backend (separate repo) is Java 11 + Spring Boot 2, with MongoDB as the
primary data store.

## Project structure

```
src/
├── apis/              # Thin fetch() wrappers per resource (Questions, Papers, Tags, Channels, ...)
├── components/common/ # Shared UI primitives (Button, Card, EmptyState, PageContainer, AdRail, MathContent, ...)
├── constants/         # Design tokens, palette, host config, text-size classes
├── js/
│   ├── adminPortal/   # Authoring: question/paper/tag/channel creation & editing
│   ├── channelSet/    # Channel browsing
│   ├── coreCapabilities/ # Shared building blocks (popups, etc.)
│   ├── header/        # App header (large-screen and small-screen variants)
│   ├── paperSet/      # Paper listing, viewing, and submission
│   └── questionSet/   # Question listing, viewing, and submission
├── store/             # Redux store, actions, reducers
├── utils/             # Cross-cutting helpers (HTML sanitizing/decoding, user details, misc)
├── App.js             # Root component / layout shell
├── route.js           # Route table
└── index.js           # Entry point
```

Key shared conventions live in [`src/js/Convensions`](./src/js/Convensions) —
read this before styling any new component.

## Getting started

### Prerequisites

- Node.js — `react-scripts@5` officially targets Node 14–18, but builds have
  been verified working on Node 24 as well in this project
- npm
- A running instance of the backend API (see [Configuration](#configuration))
  if you want real data instead of hitting a dead endpoint

### Install

```bash
npm install
```

> **Note:** this project depends on `@material-ui/core` (MUI v4), which
> declares a peer dependency on React 16/17, while the project itself uses
> React 18. This is a known, accepted conflict — it works fine in practice,
> but `npm ci` (used in CI/Amplify builds) enforces peer dependencies more
> strictly than `npm install`. The repo's `.npmrc` sets
> `legacy-peer-deps=true` so both `npm install` and `npm ci` succeed without
> extra flags. Don't remove that line.

### Run locally

```bash
npm start
```

Opens the app at [http://localhost:3000](http://localhost:3000). By default
(`src/constants/hostConfig.js`) it points at `https://api.educationalbridge.com/`; see
[Configuration](#configuration) to point it at a local backend instead.

### Build for production

```bash
npm run build
```

Outputs static files to `build/`. This is what Amplify runs automatically on
every push to `main`.

## Available scripts

| Command | Description |
|---|---|
| `npm start` | Runs the app in development mode with hot reload |
| `npm run build` | Builds an optimized production bundle to `build/` |
| `npm test` | Runs the test runner in interactive watch mode |
| `npm run eject` | Ejects from `react-scripts` (one-way; not recommended) |

## Configuration

All environment-specific configuration lives in
[`src/constants/hostConfig.js`](./src/constants/hostConfig.js):

```js
export const currentHost = "https://api.educationalbridge.com/";       // backend API base URL
export const currentURLHost = "https://www.educationalbridge.com/";    // frontend's own base URL (used for building links)
export const currentGoogleLoginAPIKey = "...";                          // Google OAuth client ID
```

To develop against a local backend, comment out the production block and
uncomment the local-dev block already present in that file (both `currentHost`
and `currentURLHost` pointing at `localhost`).

This is a plain JS constants file, not a `.env`-driven config — there is no
`.env` file to create. If you need per-environment secrets in the future,
prefer CRA's built-in `.env`/`.env.local` support over hardcoding here, and
make sure any new `.env*` file is covered by `.gitignore` (already the case
for `.env.local` and friends).

The Google OAuth client ID above is not a secret — client IDs are meant to be
embedded in client-side code. Nothing else in this repo requires a secret at
build time; the backend holds its own credentials (e.g. the MongoDB
connection string) separately and is out of scope for this repo.

## Architecture

```
┌─────────────────────┐        HTTPS         ┌──────────────────────────┐        TLS        ┌─────────────────┐
│   AWS Amplify        │ ───────────────────▶ │  EC2 (Nginx + Spring     │ ────────────────▶ │  MongoDB Atlas   │
│   (this repo)         │   api.educational-   │  Boot backend jar)      │                    │  (managed DB)    │
│   www.educational-    │   bridge.com          │  api.educationalbridge  │                    │                  │
│   bridge.com          │                       │  .com                   │                    │                  │
└─────────────────────┘                        └──────────────────────────┘                    └─────────────────┘
```

- **Frontend (this repo)** is a static React SPA. It is built and hosted by
  **AWS Amplify Hosting**, which watches this GitHub repository and
  auto-builds/deploys on every push to `main`. Amplify also terminates HTTPS
  and serves the app over its own CDN.
- **Backend** is a separate Spring Boot application running on a single EC2
  instance, reverse-proxied through Nginx, with its own subdomain
  (`api.educationalbridge.com`) and its own Let's Encrypt certificate.
  Frontend and backend are different origins, so the backend has CORS
  configured to allow requests from the Amplify/production domains.
- **Database** is MongoDB Atlas (a managed cluster), reached only from the
  backend's EC2 instance (its IP is allow-listed in Atlas's network access
  rules — nothing else can reach the database directly).
- There is an Express-based SSR entry point (`server.js`) in this repo from
  an earlier iteration of the project. It is **not** part of the current
  deployment path — production serves the CRA static build directly through
  Amplify. It's kept for reference but can be considered legacy/unused unless
  SSR is revisited.

### Data model (backend, for context)

The backend persists these main MongoDB collections (all consumed by this
frontend through the `src/apis/*` client classes):

- `questionDTO` — individual questions (description, options, correct
  answer, tags, votes, comments)
- `tagNameDTO` — tag definitions
- `channelDTO` — channel definitions
- `paperDTO` — paper definitions (sections, marking scheme, question refs)
- `questionSubmissionResponseDTO` / `paperSubmissionResponseDTO` — a user's
  answers to a question/paper
- `questionAnalyticsDTO` / `userQuestionAnalyticsDTO` /
  `paperScoreAnalysisDTO` — aggregate and per-user performance stats
- `voteDTO` — upvote/downvote records
- `googleLoginDetailsDTO` — cached Google profile info for logged-in users

A large share of the question bank was seeded from a licensed third-party
JEE question data set; see the backend repo's `tools/import_jee_questions.py`
for the import pipeline and licensing notes if you need to understand
provenance of any specific question's content.

## Design system / conventions

Read [`src/js/Convensions`](./src/js/Convensions) in full before touching UI
code. Summary of the load-bearing rules:

- **Colors** come only from the token palette in
  [`src/constants/palette.js`](./src/constants/palette.js) — `primary-*`,
  `gray-*` (a slate scale), `success-*`, `danger-*`, `warning-*`. Never use
  Tailwind's default color families (`blue-*`, `red-*`, `green-*`, etc.)
  directly.
- **Page gutter**: every page body and the header both use
  `layout.container` from
  [`src/constants/designTokens.js`](./src/constants/designTokens.js), so
  left/right edges line up across the whole app.
- **Advertising**: ad units only ever render in the left/right rails
  (`components/common/AdRail`), gated to `xl`+ breakpoints, never inside the
  main content column.
- **Rich text from the API** (question bodies, options, solutions, comments)
  must always be rendered through `MathContent` /
  `JSXUtils.htmlDecode` — this sanitizes the HTML and typesets any `$$...$$`
  LaTeX via KaTeX. Never `dangerously-set-html-content` raw API strings
  directly.
- **Shared primitives**: prefer `src/components/common/*` (`Button`, `Card`,
  `EmptyState`, `PageContainer`, `MathContent`) over hand-rolled styling.
- **`tailwind.config.js`**: any custom scale (colors, spacing, z-index, etc.)
  must go inside `theme.extend`. Putting it at the `theme` root replaces
  Tailwind's own defaults and silently breaks standard classes like
  `max-w-7xl` or `z-50` app-wide — this has happened before in this repo's
  history.

## Deployment

Production deploys are fully automatic:

1. Push (or merge) to the `main` branch on GitHub.
2. AWS Amplify's webhook picks up the push, runs `npm ci` (with
   `legacy-peer-deps=true` from `.npmrc`) then `npm run build`.
3. Amplify deploys the resulting `build/` output to its CDN.

There is no manual deploy step and no separate staging branch at present —
everything pushed to `main` goes live. Review changes before merging to
`main` accordingly.

The backend is deployed separately (SSH + systemd on its EC2 instance) and is
not affected by pushes to this repo.

## SEO

- Google Search Console is set up for `https://www.educationalbridge.com/`.
- `public/robots.txt` intentionally disallows crawling of individual
  question/paper detail and submission pages (the question bank includes
  licensed third-party content that should not be publicly indexed
  verbatim), while allowing the listing/browse pages.
- `public/sitemap.txt` lists the crawlable top-level pages.

## Known issues / quirks

- **`server.js` / `server/index.js`** (Express + `react-dom/server` SSR) are
  leftover from a prior architecture and are not used in the current Amplify
  deployment. Don't assume they're wired into CI.
- **Mixed MUI versions**: both `@material-ui/core` (v4) and `@mui/material`
  (v5) are dependencies. Newer components should use v5 (`@mui/*`); v4 is
  only kept for existing components that haven't been migrated yet.
- **`npm ci` requires `legacy-peer-deps=true`** (see [Getting
  started](#getting-started)) — do not remove this from `.npmrc` without
  first resolving the underlying MUI v4/React 18 peer dependency conflict.
- The custom apex domain (`educationalbridge.com` without `www`) is not
  currently wired to Amplify due to DNS/CloudFront alias limitations at the
  zone apex; `www.educationalbridge.com` is the canonical URL for now.

## License

[MIT](./LICENSE) — see the LICENSE file for the full text. You are free to
use, copy, modify, and distribute this code, including commercially, provided
the copyright notice is preserved.

Note: this license covers the code in this repository. It does not extend to
third-party content served through the application (e.g. licensed question
data), which may carry its own restrictions.
