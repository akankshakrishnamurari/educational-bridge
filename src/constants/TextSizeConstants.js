// Shared class strings. Colours here come from the token palette
// (src/constants/palette.js) — avoid Tailwind's default indigo/blue, which was
// left over from the previous theme and does not match the accent.
//
// NOTE ON `text-md`
// -----------------
// Several strings here carried `md:text-md`, `xl:text-md` and `2xl:text-md`.
// Tailwind's font-size scale is xs / sm / base / lg / xl / 2xl — there is no `md`
// step, and tailwind.config.js does not add one. Those breakpoints therefore
// declared nothing, so e.g. `generalTextSize` silently stopped growing after
// `lg`. Removed rather than mapped to a real step: adding a size jump at 2xl
// where none has been rendering would change type sizing across ~40 call sites,
// which is a separate decision from fixing the class strings.
//
// Twelve exports were also deleted from this file, all of them unreferenced:
// headerTextViewClass, headerLoginButtonViewClass, headerLoginTextClass,
// searchBoxCSS, searchBoxInputCSS, buttonBesideSearchBoxCSS, smallerTextSize,
// tableHeaderTextSize, searchSuggestionTextSize, searchTableHeaderCellCSS,
// pagesizeOptionTextSize and pagingSelectionButtonStyle. Dead class strings are
// not free: Tailwind scans source files as plain text, so every utility named in
// them was emitted into the stylesheet whether or not any element used it.
//
// searchTableHeaderCellCSS was `generalTextSize + " text-bold ..."` — a literal
// `...` left in the class list, and `text-bold`, which is not a utility either
// (font weight is `font-bold`).

// Wordmark sits on a white header now, so it is dark rather than white, and
// capped at a saner size than the old text-4xl.
export const logoTextCSS = "text-gray-900 text-lg sm:text-lg md:text-xl lg:text-2xl xl:text-2xl ";
export const clickableSearchTableBodyCellTextCSS = "text-xs md:text-sm xl:text-base text-left text-primary-700 hover:text-primary-800 hover:underline hover:underline-offset-2 text-justify ";
export const nonClickableSearchTableBodyCellTextCSS = "text-xs md:text-sm xl:text-base text-gray-700";
export const generalTextSize = "text-xs sm:text-xs md:text-sm lg:text-base ";
