// Accent class maps, keyed by the accent names returned from
// `questionTaxonomy.subjectAccent()`.
//
// WHY A STATIC MAP AND NOT TEMPLATE STRINGS
// -----------------------------------------
// Tailwind resolves classes by scanning source text at build time. A computed
// class like `bg-${accent}-500` is invisible to that scan, so the CSS is never
// emitted and the element renders unstyled in the production build (it "works"
// in dev only if some other file happens to use the same class). Every class
// here is therefore written out in full.
//
// Accents map onto the existing token families in palette.js -- no new colours
// are introduced. Subject colour is a wayfinding aid, not decoration: on a long
// list, a Physics question should be distinguishable from a Chemistry one before
// the label is read.

export const accentClasses = {
    primary: {
        rail: 'bg-primary-500',
        dot: 'bg-primary-500',
        text: 'text-primary-700',
        softBg: 'bg-primary-50',
        softText: 'text-primary-700',
        border: 'border-primary-200',
        ring: 'ring-primary-500',
    },
    success: {
        rail: 'bg-success-500',
        dot: 'bg-success-500',
        text: 'text-success-700',
        softBg: 'bg-success-50',
        softText: 'text-success-700',
        border: 'border-success-200',
        ring: 'ring-success-500',
    },
    warning: {
        rail: 'bg-warning-500',
        dot: 'bg-warning-500',
        text: 'text-warning-700',
        softBg: 'bg-warning-50',
        softText: 'text-warning-700',
        border: 'border-warning-200',
        ring: 'ring-warning-500',
    },
    danger: {
        rail: 'bg-danger-500',
        dot: 'bg-danger-500',
        text: 'text-danger-700',
        softBg: 'bg-danger-50',
        softText: 'text-danger-700',
        border: 'border-danger-200',
        ring: 'ring-danger-500',
    },
    gray: {
        rail: 'bg-gray-300',
        dot: 'bg-gray-400',
        text: 'text-gray-600',
        softBg: 'bg-gray-100',
        softText: 'text-gray-600',
        border: 'border-gray-200',
        ring: 'ring-gray-400',
    },
};

/**
 * @param {string} accent key from subjectAccent()
 * @returns {object} class bundle, falling back to gray for anything unknown
 */
export const accent = (accentKey) => accentClasses[accentKey] || accentClasses.gray;

// Difficulty is semantic rather than categorical, so it gets its own fixed
// mapping instead of borrowing the subject accents: easy reads as success, hard
// as danger, regardless of which subject the question belongs to.
export const difficultyClasses = {
    1: { fill: 'bg-success-500', text: 'text-success-700', softBg: 'bg-success-50' },
    2: { fill: 'bg-warning-500', text: 'text-warning-700', softBg: 'bg-warning-50' },
    3: { fill: 'bg-danger-500', text: 'text-danger-700', softBg: 'bg-danger-50' },
};

export const difficultyStyle = (level) => difficultyClasses[level] || {
    fill: 'bg-gray-300',
    text: 'text-gray-500',
    softBg: 'bg-gray-100',
};

export default accent;
