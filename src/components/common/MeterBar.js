import React from 'react';

// Horizontal proportion bar, optionally with a comparison marker.
//
// Used for the paper score, per-topic performance and you-versus-top-scorer.
// Replaces three react-google-charts BarCharts, two of which were fed entirely
// hardcoded numbers. A bar is also considerably cheaper than loading a charting
// library, and it inherits the page's own type and colour rather than importing a
// second visual language.
//
// `comparisonValue` renders as a vertical tick, so "where the top scorer landed"
// is readable on the same axis rather than in a separate chart.

const toneFill = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    gray: 'bg-gray-400',
};

/**
 * Performance colour is earned, not decorative: below 40% reads as danger, below
 * 70% as warning, at or above 70% as success. That makes a long list of topics
 * scannable for "where am I weak" without reading a single number.
 */
export const performanceTone = (fraction) => {
    if (typeof fraction !== 'number' || !Number.isFinite(fraction)) {
        return 'gray';
    }
    if (fraction < 0.4) {
        return 'danger';
    }
    if (fraction < 0.7) {
        return 'warning';
    }
    return 'success';
};

const clampPercent = (value) => Math.max(0, Math.min(100, value));

const MeterBar = ({
    value = 0,
    max = 0,
    tone = null,
    comparisonValue = null,
    comparisonLabel = null,
    height = 'h-2',
    className = '',
}) => {
    const safeMax = (typeof max === 'number' && max > 0) ? max : 0;
    const fraction = safeMax > 0 ? value / safeMax : 0;
    const percent = clampPercent(fraction * 100);
    const resolvedTone = tone || performanceTone(fraction);
    const fill = toneFill[resolvedTone] || toneFill.gray;

    const comparisonPercent = (safeMax > 0 && typeof comparisonValue === 'number')
        ? clampPercent((comparisonValue / safeMax) * 100)
        : null;

    return (
        <div className={['relative w-full rounded-full bg-gray-100 overflow-visible', height, className].join(' ')}>
            <div
                className={['rounded-full transition-all', height, fill].join(' ')}
                style={{ width: percent + '%' }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={safeMax || 0}
            />
            {comparisonPercent !== null &&
                <span
                    className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-gray-900 rounded"
                    style={{ left: comparisonPercent + '%' }}
                    title={comparisonLabel || 'Comparison'}
                    aria-hidden="true"
                />
            }
        </div>
    );
};

export default MeterBar;
