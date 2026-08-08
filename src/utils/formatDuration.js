// Human-readable durations for analytics figures.
//
// All time values on the submission payload are whole SECONDS (the backend
// computes them as `(now - questionRequestTime) / 1000`), so there is no
// sub-second precision to preserve.

/**
 * @param {?number} seconds
 * @returns {?string} e.g. "48s", "2m 05s", "1h 12m" -- or null when there is
 *          nothing meaningful to show, so callers can omit the field entirely
 *          rather than rendering "0s" for absent data.
 */
export const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
        return null;
    }
    const whole = Math.round(seconds);
    if (whole < 60) {
        return whole + 's';
    }
    const minutes = Math.floor(whole / 60);
    const remainderSeconds = whole % 60;
    if (minutes < 60) {
        return minutes + 'm ' + String(remainderSeconds).padStart(2, '0') + 's';
    }
    const hours = Math.floor(minutes / 60);
    return hours + 'h ' + String(minutes % 60).padStart(2, '0') + 'm';
};

/**
 * Thousands separators for counts. Uses the Indian grouping convention
 * (1,20,450 rather than 120,450) since that is what this audience reads.
 */
export const formatCount = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }
    try {
        return value.toLocaleString('en-IN');
    } catch (err) {
        return String(value);
    }
};

export default formatDuration;
