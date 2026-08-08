# Professional B2C UI Redesign — Requirements

## Background
EducationalBridge is a peer-to-peer exam prep platform (questions, papers, channels) targeting competitive-exam students. The current UI mixes three styling systems (`@material-ui/core` v4, `@mui/material` v5, raw Tailwind utilities) with no shared design tokens, resulting in inconsistent spacing, color, and typography across pages. Some pages contain visible placeholder/dev content. This spec covers bringing every page to a cohesive, professional B2C visual standard.

## Goals
1. Establish a single design token system (color, type, spacing, elevation, radius) shared by Tailwind config and a new MUI theme.
2. Standardize on MUI v5 + Tailwind (layout/spacing only); stop new usage of `@material-ui/core` v4, migrate existing usages opportunistically.
3. Build a small shared component library (Button, Card, Badge, EmptyState, PageContainer, Toast/notification) used consistently instead of bespoke per-component styling.
4. Apply the new system to every routed page (see route inventory below).
5. Remove visible dev/placeholder content and native `alert()` UX.

## Non-goals
- No backend/API changes.
- No new features — this is a visual/UX-consistency pass over existing functionality.
- No copy/content rewrite beyond removing placeholder text.

## Pages in scope (from src/route.js)
- `/` , `/questions`, `/papers` — QuestionSet (question list + tag/channel filters)
- `/question/view` — GeneralQuestionView (single question, comments, voting)
- `/question/upsert` — QuestionCreation (question editor form)
- `/channels` — ChannelHome
- `/channel/new` — NewChannelCreation
- `/paper/new` — NewPaperPortal
- `/paper/view` — PaperView (timed exam-taking UI)
- `/paper/submission/view` — PaperSubmissionView (results/analysis)
- `/question/submission/view` — GeneralQuestionSubmissionView
- `/tags/new` — NewTagCreation
- `/papers/instances/me`, `/questions/instances/me` — user submission summaries
- `/aboutus` — AboutUs
- Shared: EducationalBridgeHeader (large + small screen variants)

## Acceptance criteria
- A single source of truth for colors/typography/spacing exists and is used by both Tailwind config and MUI theme.
- No page contains literal placeholder text (e.g. "this represents channel details jsx box") or unfinished className strings (`'flex flex-row ...'`).
- No `alert()`/`window.confirm` used for user-facing feedback; replaced with in-UI banners/toasts.
- Every page uses the shared Card/Button/Badge primitives for their respective UI patterns rather than one-off styling.
- Visual consistency verified by manual review of each page in-browser (light/no dark-mode scope) at desktop width; responsive behavior preserved (existing small-screen components kept, restyled not restructured).
