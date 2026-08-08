import React from 'react';

// Horizontal step indicator for multi-step flows.
//
// The paper builder previously indicated progress by tinting three panels either
// `bg-success-100` or `bg-warning-50` -- green for the step you were on, yellow for
// the others. Green-versus-yellow reads as pass/warning, not as
// current/upcoming, so the flow looked like it was reporting two problems rather
// than showing you were on step one of three. It also computed a
// `percentageCompleted` value (16 / 50 / 83) that was never rendered.
//
// Steps here are numbered, completed steps are ticked, and the current step is the
// only one carrying the accent. Completed steps stay clickable so you can go back;
// steps ahead of the furthest one reached are not, because skipping forward past
// required configuration is how you end up publishing an empty paper.

const CheckIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
);

/**
 * @param {Array<{key: string, label: string, hint?: string}>} steps
 * @param {string} currentKey
 * @param {function} onSelect called with a step key
 * @param {number} furthestIndex highest step index reached; later steps are locked
 */
const Stepper = ({ steps = [], currentKey, onSelect = null, furthestIndex = null }) => {
    const currentIndex = steps.findIndex((step) => step.key === currentKey);
    const reachable = furthestIndex === null ? steps.length - 1 : furthestIndex;

    return (
        <nav aria-label="Progress">
            <ol className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
                {steps.map((step, index) => {
                    const isCurrent = index === currentIndex;
                    const isComplete = index < currentIndex;
                    const isLocked = index > reachable;

                    const circle = isComplete
                        ? 'bg-success-600 border-success-600 text-white'
                        : (isCurrent
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-gray-300 text-gray-400');

                    const labelTone = isCurrent
                        ? 'text-gray-900'
                        : (isComplete ? 'text-gray-700' : 'text-gray-400');

                    return (
                        <li key={step.key} className="flex-1 flex items-center">
                            <button
                                type="button"
                                disabled={isLocked || onSelect === null}
                                onClick={() => onSelect && onSelect(step.key)}
                                aria-current={isCurrent ? 'step' : undefined}
                                className={[
                                    'flex items-center gap-3 text-left px-3 py-2.5 rounded-lg w-full transition-colors',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                                    isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50',
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold',
                                        circle,
                                    ].join(' ')}
                                >
                                    {isComplete ? <CheckIcon /> : index + 1}
                                </span>
                                <span className="min-w-0">
                                    <span className={['block text-sm font-semibold truncate', labelTone].join(' ')}>
                                        {step.label}
                                    </span>
                                    {step.hint &&
                                        <span className="block text-xs text-gray-400 truncate">{step.hint}</span>
                                    }
                                </span>
                            </button>
                            {index < steps.length - 1 &&
                                <span
                                    className={[
                                        'hidden sm:block shrink-0 w-8 h-px',
                                        index < currentIndex ? 'bg-success-400' : 'bg-gray-200',
                                    ].join(' ')}
                                    aria-hidden="true"
                                />
                            }
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Stepper;
