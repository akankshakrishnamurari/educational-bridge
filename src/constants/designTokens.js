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

// Single source for page width and gutter. The header and every page body use
// the same token so the wordmark, nav and content all sit on one left/right
// edge — misaligned containers were the main reason the old chrome looked untidy.
//
// WHY THIS IS NO LONGER 1800px
// ----------------------------
// The container used to be capped at 1800px via an arbitrary-value max-width
// utility. (Written out in prose rather than as the class itself: Tailwind scans
// these files as plain text, so spelling the utility here would make it emit a
// real, permanently-unused CSS rule.) That figure was not chosen for
// readability: it was the width needed to fit a 300px advertising rail on each
// side of a usable content column. With the rails removed there is nothing left
// to justify it, and 1800px of content on a wide display is simply hard to read —
// list rows stretch until the text and its action cluster are a screen apart.
//
// 1280px (max-w-7xl) is the widest comfortable measure for the list and table
// pages. Single-question, results and article pages use `reading` instead,
// because those are prose and want a much tighter measure.
export const layout = {
    // Content pages: question list, channels, dashboards, authoring.
    container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

    // Reading width for one-thing-at-a-time pages: solving a question, a result
    // report, a form. Prose and question bodies become hard to track much beyond
    // this.
    reading: 'w-full max-w-3xl mx-auto px-4 sm:px-6',

    // Slightly wider reading measure for pages that mix prose with side-by-side
    // figures, such as the paper score report.
    wideReading: 'w-full max-w-4xl mx-auto px-4 sm:px-6',

    // Marketing / landing width, used by the home and about pages. Wider than
    // `reading` because those pages are built from full-bleed bands and grids
    // rather than a single column of text.
    marketing: 'w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-12',
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
