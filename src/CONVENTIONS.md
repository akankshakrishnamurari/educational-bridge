# UI conventions

Renamed from `src/js/Convensions` (misspelled, no extension, so no editor gave it
syntax highlighting). Nothing imports this file; it is documentation.

## Colour

Colours come from the token palette only — `src/constants/palette.js`. Do not use
Tailwind's default colour families (`blue-*`, `indigo-*`, `slate-*`, `green-*`,
`red-*`, `yellow-*`). Use the semantic names:

| Token | Use |
|---|---|
| `primary-*` | accent, interactive (`primary-600` = `#2563EB`) |
| `gray-*` | all neutrals, slate scale (page background `gray-50`, borders `gray-200`) |
| `success-*` | correct answers, verified, completed |
| `danger-*` | incorrect answers, destructive actions |
| `warning-*` | caution, marked for review, upcoming features |

Per-subject accents and difficulty colours come from `src/constants/accents.js`.
Those maps are written out as **full literal class strings** on purpose: Tailwind
resolves classes by scanning source text, so a computed class like
`` `bg-${accent}-500` `` emits no CSS at all and the element renders unstyled in
the production build.

## Components

| Element | Classes |
|---|---|
| Primary button | `bg-primary-600 text-white hover:bg-primary-700` |
| Secondary button | `bg-white text-gray-700 border border-gray-300 hover:bg-gray-50` |
| Card / panel | `bg-white border border-gray-200 rounded-xl` |
| Page background | `bg-gray-50` |
| Header / footer | `bg-white` with a `border-gray-200` hairline |
| Control height | `h-9` compact, `h-10` default |

Prefer the shared primitives in `src/components/common` over restyling from
scratch: `Button`, `Card`, `Badge`, `EmptyState`, `MathContent`, `Avatar`,
`StatTile`, `MeterBar`, `DifficultyMeter`, `ConfirmDialog`, `Stepper`,
`FormField`, `FormPage`, `Footer`.

## Width

Use a token from `src/constants/designTokens.js`. Never hand-roll a container.

| Token | Width | Use |
|---|---|---|
| `layout.container` | 1280px | List and dashboard pages, and the header |
| `layout.reading` | 768px | One thing at a time: solving, results, forms |
| `layout.wideReading` | 896px | Reports mixing prose with figures |
| `layout.marketing` | 1152px | Home and About, built from full-bleed bands |

The header uses `layout.container` including its gutter, so the wordmark sits on
the same left edge as page content.

`layout.container` was previously capped at 1800px. That width was not chosen for
readability — it was what a 300px advertising rail on each side of the content
required. **There is no advertising anywhere in this app**, and none should be
added without revisiting these widths.

## Content

Rich text from the API (question bodies, options, solutions, comments) must be
rendered through `MathContent`, which sanitises with DOMPurify and typesets
`$$...$$` LaTeX with KaTeX. Never pass API HTML to `dangerouslySetInnerHTML`
directly.

Authoring goes through `MathEditor`, which writes that same format and previews it
by calling `MathContent` — so the preview is the student's render, not an
approximation of it. Its toolbar deliberately offers only tags and attributes that
survive the sanitiser's allowlist. Adding a control that emits anything else
(inline `style`, for instance, which is on `FORBID_ATTR`) produces a button that
appears to work in the editor and silently does nothing once published. Validation
messages come from `findMathErrors`, which lives beside `renderMath` so the two
cannot disagree about what parses.

Question metadata (subject, chapter, topic, difficulty, year, exam) does not
exist as fields. It lives only in `tags[]` as `"<Prefix> : <Value>"` strings.
Parse it with `src/utils/questionTaxonomy.js`; do not re-implement the split.

## Tailwind config

All custom scales must go inside `theme.extend`. Declaring `maxWidth` /
`minWidth` / `zIndex` at the `theme` root **replaces** Tailwind's defaults and
silently kills standard classes like `max-w-7xl`, `min-w-0` and `z-50`.

`important: true` is set globally, so conflicting utilities resolve by stylesheet
order rather than authoring order. Write mutually exclusive conditional class
strings; do not rely on a later class overriding an earlier one.

Responsive prefixes measure the **viewport**, not the element's container. A
component whose breakpoints assume it owns the full content width will lay itself
out wrongly the first time it is dropped into a grid column, and every `md:` and
`lg:` test will still pass while it overflows. This has already happened twice
with `PagingSection`: once on the question list between 768 and 1023px, and again
inside the paper builder's 7/12 column, where a 1280px viewport leaves the pager
about 650px. There are no container queries in Tailwind 3.3 without a plugin, so
a component that can be reused in a narrow column needs a prop (`compact` on
`PagingSection`) letting the parent state what it can afford. Verify by measuring
`document.documentElement.scrollWidth` against `clientWidth` at a range of widths;
an element wider than the viewport is the bug, and the deepest such element is the
cause.

Tailwind scans these files as **plain text**, with no understanding of JavaScript.
Two consequences:

- A computed class name emits no CSS. Always write full literal strings.
- A class name written inside a *comment* still emits CSS. A comment in
  `designTokens.js` explaining the old arbitrary-value 1800px cap was enough to
  put a real, permanently-unused rule in the production stylesheet. Describe
  removed utilities in prose instead of spelling them.

## Honesty

Do not display a figure the API does not return. If a value is unavailable, omit
the element rather than showing a zero, a placeholder or an invented number. This
codebase previously shipped hardcoded "analytics" on two separate pages.
