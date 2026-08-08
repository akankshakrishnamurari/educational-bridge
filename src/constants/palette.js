// Raw colour + font values, in CommonJS so BOTH consumers can read them:
//   - tailwind.config.js, which Node/PostCSS loads directly (cannot parse ESM)
//   - src/constants/designTokens.js, which re-exports these to app code
//
// Keep this the only place hex values are written. Previously tailwind.config.js
// kept its own duplicate copy of the palette, which is how the Tailwind classes
// and the MUI theme drifted apart.

const colors = {
    // Blue, not indigo. #2563EB is the single strong accent; all else neutral.
    primary: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
    },
    // 100/200 tints exist so "correct/incorrect answer" surfaces have a soft fill
    // to use instead of Tailwind's default green-300 / red-300.
    success: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        200: '#BBF7D0',
        500: '#22C55E',
        600: '#16A34A',
        700: '#15803D',
    },
    danger: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        200: '#FECACA',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
    },
    warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
    },
    // Slate rather than neutral gray: slightly cool, reads as more considered
    // next to the blue accent.
    gray: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },
};

// Page background, card surface and hairline border.
const surface = {
    page: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
};

const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

module.exports = { colors, surface, fontFamily };
