// Central design token source for app code.
//
// Raw hex/font values live in ./palette.js (CommonJS) so that tailwind.config.js
// can require the same file. This module re-exports them and adds the semantic
// Tailwind class strings used by components.

import { colors, surface, fontFamily } from './palette';

export { colors, surface, fontFamily };

// Semantic typography scale expressed as Tailwind class strings, so existing
// components can import a name (e.g. `typography.h1`) instead of re-deriving
// responsive text-size strings per component.
export const typography = {
    // Marketing-scale headline: large, tight, near-black.
    hero: 'text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.05]',
    lede: 'text-base md:text-lg font-normal text-gray-500 leading-relaxed',
    display: 'text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900',
    h1: 'text-2xl md:text-3xl font-bold tracking-tight text-gray-900',
    h2: 'text-lg md:text-xl font-semibold text-gray-900',
    h3: 'text-base md:text-lg font-semibold text-gray-900',
    body: 'text-sm md:text-base font-normal text-gray-700',
    caption: 'text-xs text-gray-500',
    label: 'text-xs font-medium text-gray-500 uppercase tracking-wide',
    stat: 'text-xl md:text-2xl font-bold text-primary-600',
};

// Single source for page width and gutter. The header and every page body must
// use `layout.container` so the wordmark, nav and content all sit on the same
// left/right edge — misaligned containers were the main reason the old chrome
// looked untidy.
//
// 1800px is wide enough to carry two ad rails plus a comfortable content column
// on a 1080p+ display, without going edge-to-edge on ultrawides.
export const layout = {
    container: 'w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8',

    // Marketing / landing width. Deliberately much narrower than `container`:
    // 1800px only exists so content pages can carry two 300px ad rails, and at
    // that width a landing page's prose runs edge to edge with no breathing
    // room. 1152px centred with a wide gutter is a normal reading measure and
    // is what makes the page feel composed rather than stretched.
    marketing: 'w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-12',

    // Row that holds [AdRail, content, AdRail]. Deliberately NO justify-center:
    // the rails must pin to the container edges so they land in the same place on
    // every page. Centring the row instead makes the rails drift inward by a
    // different amount on each page, depending on that page's content width.
    railRow: 'flex gap-6 items-start',

    // Content column between the rails. `flex-1 min-w-0` fills the space; min-w-0
    // is what stops long question HTML from overflowing the flex track.
    column: 'flex-1 min-w-0',

    // Reading-width column for single-question / article pages. Capped for
    // legibility, but still a flex child that fills its track, with mx-auto
    // centring it *between* the rails rather than moving the rails.
    readingColumn: 'flex-1 min-w-0 max-w-3xl mx-auto',
    wideReadingColumn: 'flex-1 min-w-0 max-w-4xl mx-auto',
};

export const radius = {
    card: 'rounded-xl',
    control: 'rounded-lg',
    pill: 'rounded-full',
};

// Restrained elevation: borders do the work, shadows stay subtle. Heavy shadows
// read as "dark" on a light grey page.
export const elevation = {
    card: 'border border-gray-200',
    cardHover: 'hover:border-gray-300 transition-colors',
    popover: 'shadow-md border border-gray-200',
};

// Standard surfaces, so screens stop hand-rolling background classes.
export const surfaceClass = {
    page: 'bg-gray-50',
    card: 'bg-white',
    subtle: 'bg-gray-100',
    header: 'bg-white border-b border-gray-200',
};
