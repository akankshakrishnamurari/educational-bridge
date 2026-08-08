# Professional B2C UI Redesign — Design

## Brand direction
Serious, credible, exam-prep platform (competitive exams — BPSC/JEE style). Trustworthy and focused rather than playful. Reference feel: Testbook/Unacademy tier polish, cleaner and less cluttered.

## Design tokens

### Color
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#4F46E5` (indigo-600) | Primary actions, links, active nav, focus rings |
| `primary-dark` | `#3730A3` (indigo-800) | Hover/pressed primary |
| `primary-light` | `#EEF2FF` (indigo-50) | Selected/active row backgrounds |
| `success` | `#16A34A` (green-600) | Correct answers, upvotes, fulfilled badge |
| `success-light` | `#F0FDF4` | Success banners |
| `danger` | `#DC2626` (red-600) | Incorrect answers, downvotes, destructive actions |
| `danger-light` | `#FEF2F2` | Error banners |
| `warning` | `#D97706` (amber-600) | Marked-for-review state, countdown low-time |
| `warning-light` | `#FFFBEB` | Warning banners |
| `gray-50…900` | Tailwind default gray scale | Backgrounds, borders, text — replaces mixed slate/neutral/gray usage |
| Page background | `gray-50` | All page containers |
| Card surface | `white` | Cards/panels on top of gray-50 background |

### Typography
Font: **Inter** (loaded via Google Fonts `<link>` in `public/index.html`, fallback to existing system stack).

Semantic scale (Tailwind classes, defined once in `src/constants/designTokens.js`):
- `display`: `text-3xl md:text-4xl font-bold tracking-tight` — page hero (rare use)
- `h1`: `text-2xl md:text-3xl font-bold` — page titles
- `h2`: `text-lg md:text-xl font-semibold` — section headers
- `h3`: `text-base md:text-lg font-semibold` — card titles
- `body`: `text-sm md:text-base font-normal` — default body text
- `caption`: `text-xs text-gray-500` — metadata, timestamps, helper text
- `label`: `text-xs font-medium text-gray-600 uppercase tracking-wide` — form labels, table headers

### Spacing & radius
- Spacing rhythm: multiples of 4px via Tailwind defaults (`p-2, p-4, p-6, p-8`) — no arbitrary padding values.
- Card radius: `rounded-xl`
- Button/input radius: `rounded-lg`
- Pill/badge radius: `rounded-full`

### Elevation
- Card default: `shadow-sm border border-gray-100`
- Card hover (clickable): `hover:shadow-md transition-shadow`
- Modal/popover: `shadow-lg`

## Shared component library
New directory: `src/components/common/`

- **`Button.js`** — variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Wraps MUI `Button` with theme-driven styling; replaces bespoke `<button className="...">` instances.
- **`Card.js`** — `PageCard` wrapper: white surface, `rounded-xl`, `shadow-sm`, `border-gray-100`, consistent `p-4 md:p-6` padding.
- **`Badge.js`** — status pills: `success` (fulfilled/certified), `warning` (marked for review), `neutral` (tags), `danger`.
- **`EmptyState.js`** — icon + message + optional action button, for "no questions found", empty channel lists, etc. Replaces bare text rows and blank divs.
- **`PageContainer.js`** — standard page wrapper: `bg-gray-50 min-h-screen`, consistent max-width and horizontal padding, renders `EducationalBridgeHeader` + content slot.
- **`Toast.js`** wiring — `react-toastify` is already a dependency; standardize a single `notify.success/error/info` helper in `src/utils/notify.js` and use it everywhere instead of `alert()`/`window.confirm`.

## MUI theme
New file: `src/theme.js` — `createTheme()` reading the same palette values as the token table above, so `<ThemeProvider theme={theme}>` wraps `<App/>` in `src/index.js`. Ensures MUI components (Table, TextField, Dialog, etc.) match the Tailwind-styled custom components automatically instead of using MUI v4 defaults.

## Tailwind config changes
Add to `tailwind.config.js` `theme.extend`:
- `colors`: primary/success/danger/warning scale (mirroring the palette table)
- `fontFamily.sans`: `['Inter', ...defaultSans]`
- Keep existing custom `minWidth`/`maxWidth`/`zIndex` extensions untouched (still in use).

## Page-level treatment notes
- **QuestionSet** (list): convert table rows to card-style rows with clear tag pills (`Badge`), author line without picture-object assumption (already fixed), consistent "Solve" button (`Button` primary sm).
- **ChannelHome**: remove the literal placeholder div; build a simple channel grid of `PageCard`s until channel detail content is defined; search box restyled with MUI `Autocomplete`-like look but keep existing fetch logic.
- **PaperView**: replace `alert()` on last-question-next with an inline `Toast`/banner; question status grid uses `Badge`-driven colors (green=answered, amber=marked, white=untouched) matching token colors instead of raw `bg-green-400` etc.
- **QuestionCreation / NewPaperPortal / NewTagCreation / NewChannelCreation**: forms restyled with MUI `TextField`/`Select` under the new theme, wrapped in `PageCard`.
- **GeneralQuestionView / QuestionComment**: comment author line uses the same guarded createdBy rendering already fixed; voting buttons restyled as icon buttons with consistent success/danger colors.
- **AboutUs**: restyle as a simple content page inside `PageContainer`/`PageCard`, no functional change.
- **Header (large/small)**: restyle nav to use `primary` color, consistent logo lockup, search box using shared input styling.

## Rollout order (ties to tasks.md)
1. Tokens + Tailwind config + MUI theme + font loading
2. Shared component library
3. `notify.js` helper, remove `alert()`
4. Header (affects every page)
5. QuestionSet (highest traffic)
6. GeneralQuestionView + QuestionComment
7. PaperView + PaperSubmissionView
8. ChannelHome + creation forms (Question/Paper/Tag/Channel)
9. Submission summary pages + AboutUs
