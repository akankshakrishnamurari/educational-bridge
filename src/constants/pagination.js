// Single source of truth for list paging.
//
// WHY THIS FILE EXISTS
// --------------------
// The page size was previously the literal `10` repeated in eight places across
// two screens: the initial load, three `|| 10` fallbacks in render paths, the
// empty-page fallback shape, and the option list in the pager itself. Changing
// the default therefore meant changing all of them in step, and any one missed
// left a screen requesting one size while displaying row numbers computed from
// another — which is how the list came to number rows from a different page size
// than it had actually fetched.

// WHY 25 AND NOT 10
// -----------------
// The bank holds ~11.9k questions, so ten per page is 1,189 pages. That turns
// browsing into paging: a reader scanning for a topic spends more time on the
// pager than on the questions. 25 fills a scroll or two of list rows, which is
// the length people actually read through before deciding, and cuts the page
// count to 476.
//
// It is not higher than 25 because every row renders its stem through KaTeX;
// 100+ rows per page is a visible pause on first paint.
export const DEFAULT_PAGE_SIZE = 25;

// Offered page sizes.
//
// The previous list was 10 / 15 / 25 / 50 / 100 / 250. 15 sat close enough to
// both neighbours to be noise, and 250 rows of KaTeX-rendered stems takes long
// enough to lay out that the page reads as broken. Four options, each a clear
// step up from the last.
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Coerces a page size from any source (a <select> value is a string, redux may
 * hold anything, a stale persisted value may be off the list) into one of the
 * offered numbers.
 *
 * The page size used to be stored exactly as the <select> handed it over — the
 * string "25". Everything downstream then did arithmetic on it, so the absolute
 * row number for page 3 was computed as (3 - 1) * "25" + 1. That happens to work
 * because `*` coerces, but `+` does not: any code path that added the page size
 * to an offset would have produced string concatenation instead.
 */
export const coercePageSize = (value) => {
    const parsed = Number(value);
    return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
};
