import React from 'react';
import { difficultyStyle } from '../../constants/accents';

// Three-segment difficulty indicator.
//
// Difficulty is the single most useful signal for someone choosing what to
// practise next, and it was previously rendered as an unlabelled grey pill
// indistinguishable from "Subject" or "Year". A meter encodes it pre-attentively:
// the shape can be read without reading the word.
//
// HONEST UNKNOWNS
// ---------------
// `difficulty` is derived from a scraped tag, and not every question has one.
// When the level cannot be classified this renders empty segments and (unless a
// raw label exists) the text "Unrated", rather than defaulting to Medium. The
// data does not support guessing, and a wrong difficulty is worse than no
// difficulty for someone building a study plan.

const TOTAL_SEGMENTS = 3;

const DifficultyMeter = ({
    level = null,
    label = null,
    showLabel = true,
    size = 'md',
    className = '',
}) => {
    const style = difficultyStyle(level);
    const isRated = typeof level === 'number' && level >= 1 && level <= TOTAL_SEGMENTS;
    const displayLabel = label || (isRated ? null : 'Unrated');

    const barSize = size === 'sm' ? 'w-1 h-2.5' : 'w-1.5 h-3';
    const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

    const segments = [];
    for (let i = 1; i <= TOTAL_SEGMENTS; i += 1) {
        const filled = isRated && i <= level;
        segments.push(
            <span
                key={i}
                className={[
                    barSize,
                    'rounded-sm transition-colors',
                    filled ? style.fill : 'bg-gray-200',
                ].join(' ')}
            />
        );
    }

    // The meter is decorative once the label is present, so the group carries a
    // single accessible name and the bars themselves are hidden from AT.
    const accessibleName = isRated
        ? `Difficulty: ${label || level + ' of ' + TOTAL_SEGMENTS}`
        : 'Difficulty not rated';

    return (
        <span
            className={['inline-flex items-center gap-1.5', className].filter(Boolean).join(' ')}
            title={accessibleName}
        >
            <span className="flex items-end gap-0.5" aria-hidden="true">
                {segments}
            </span>
            {showLabel && displayLabel &&
                <span className={[textSize, 'font-medium', isRated ? style.text : 'text-gray-400'].join(' ')}>
                    {displayLabel}
                </span>
            }
            <span className="sr-only">{accessibleName}</span>
        </span>
    );
};

export default DifficultyMeter;
