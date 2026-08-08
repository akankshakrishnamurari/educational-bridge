import React from 'react';
import MathContent from '../common/MathContent';

// Answer options for a single-select MCQ.
//
// WHY THIS REPLACES THE OLD MARKUP
// --------------------------------
// Options used to render as a MUI <Table> whose <TableRow> children were raw
// <div>s. That is invalid HTML: only <td>/<th> may be a child of <tr>. Browsers
// respond by "foster parenting" the offending nodes -- lifting them out of the
// table and re-inserting them immediately before it -- which left an empty table
// skeleton occupying vertical space and produced the large unexplained gap on the
// question page. A table was never the right primitive for a radio group anyway.
//
// ACCESSIBILITY
// -------------
// Real <input type="radio"> elements inside a <fieldset>, visually hidden but
// focusable. That buys native behaviour for free: arrow keys move between
// options, Space selects, the group is announced as a group, and each option is
// labelled by its own <label>. The visible letter badge is a presentational
// stand-in for the radio dot.
//
// Selected/correct/incorrect styling is computed in JS from props rather than via
// Tailwind `peer-checked:` variants. The project sets `important: true`, which
// makes conflicting utilities resolve by stylesheet order instead of authoring
// order, so deriving one exclusive class string per state is far more predictable
// than layering overrides. Focus is the exception -- it is not in props, so it
// uses `peer-focus-visible:`.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const optionLetter = (index) => (index < LETTERS.length ? LETTERS[index] : String(index + 1));

const CheckIcon = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
);

const CrossIcon = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 01-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z" clipRule="evenodd" />
    </svg>
);

/**
 * Resolve the visual state of one option into a single exclusive style bundle.
 *
 * Review mode deliberately distinguishes "the right answer you missed" from
 * "the right answer you picked": both are correct, but only one of them is a
 * result the learner should feel good about, and collapsing them loses the
 * single most useful piece of feedback on the page.
 */
const resolveState = ({ isSelected, isCorrect, reviewMode }) => {
    if (!reviewMode) {
        return isSelected ? 'selected' : 'idle';
    }
    if (isCorrect && isSelected) {
        return 'correctChosen';
    }
    if (isCorrect) {
        return 'correctMissed';
    }
    if (isSelected) {
        return 'incorrectChosen';
    }
    return 'reviewIdle';
};

const STATE_STYLES = {
    idle: {
        row: 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40',
        badge: 'border-gray-300 text-gray-500 bg-white',
        text: 'text-gray-800',
    },
    selected: {
        row: 'border-primary-500 bg-primary-50 ring-1 ring-primary-500',
        badge: 'border-primary-600 bg-primary-600 text-white',
        text: 'text-gray-900',
    },
    correctChosen: {
        row: 'border-success-500 bg-success-50 ring-1 ring-success-500',
        badge: 'border-success-600 bg-success-600 text-white',
        text: 'text-gray-900',
    },
    correctMissed: {
        row: 'border-success-500 bg-success-50/60',
        badge: 'border-success-600 text-success-700 bg-white',
        text: 'text-gray-900',
    },
    incorrectChosen: {
        row: 'border-danger-500 bg-danger-50 ring-1 ring-danger-500',
        badge: 'border-danger-600 bg-danger-600 text-white',
        text: 'text-gray-900',
    },
    reviewIdle: {
        row: 'border-gray-200 bg-white',
        badge: 'border-gray-300 text-gray-400 bg-white',
        text: 'text-gray-600',
    },
};

const StrikeIcon = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 10h14" strokeLinecap="round" />
    </svg>
);

const OptionList = ({
    options = [],
    selectedOptionId = null,
    correctOptionId = null,
    onSelect = null,
    reviewMode = false,
    // { [optionId]: number } percentage of respondents who chose each option.
    distribution = null,
    groupName = 'answer',
    disabled = false,
    // Ids the learner has ruled out. Purely local to the solving session — this is
    // a thinking aid, not an answer, so it is never sent to the server.
    eliminatedIds = null,
    onToggleEliminate = null,
}) => {
    if (!Array.isArray(options) || options.length === 0) {
        return (
            <p className="text-sm text-gray-500 italic">
                This question has no answer options recorded.
            </p>
        );
    }

    return (
        <fieldset disabled={disabled || reviewMode} className="w-full border-0 p-0 m-0">
            <legend className="sr-only">Answer options</legend>
            <div className="flex flex-col gap-2">
                {options.map((option, index) => {
                    // Compared as strings on purpose. Option ids reach this component
                    // from several paths (live question, submitted-response payload,
                    // in-progress authoring state) and are not consistently typed.
                    // The previous implementation relied on loose `==` coercion, so
                    // tightening to `===` here would silently stop highlighting the
                    // selected answer wherever the types differ.
                    const sameId = (a, b) => a != null && b != null && String(a) === String(b);
                    const isSelected = sameId(selectedOptionId, option.id);
                    const isCorrect = sameId(correctOptionId, option.id);
                    const state = resolveState({ isSelected, isCorrect, reviewMode });
                    const style = STATE_STYLES[state];
                    const percent = distribution && typeof distribution[option.id] === 'number'
                        ? distribution[option.id]
                        : null;

                    const isEliminated = !reviewMode
                        && Array.isArray(eliminatedIds)
                        && eliminatedIds.some((id) => sameId(id, option.id));
                    const canEliminate = !reviewMode && !disabled && onToggleEliminate !== null;

                    return (
                        // The row is a <div> rather than a <label> so the eliminate
                        // control can sit outside the label. A <button> nested inside a
                        // <label> also triggers the label's control, which would select
                        // the very option the learner is trying to rule out.
                        <div
                            key={option.id}
                            className={[
                                'group relative flex items-stretch rounded-xl border transition-colors',
                                isEliminated ? 'border-gray-200 bg-gray-50' : style.row,
                            ].join(' ')}
                        >
                            <label
                                className={[
                                    'flex items-start gap-3 flex-1 min-w-0 p-3 md:p-3.5',
                                    reviewMode ? 'cursor-default' : 'cursor-pointer',
                                ].join(' ')}
                            >
                                <input
                                    type="radio"
                                    name={groupName}
                                    className="sr-only peer"
                                    value={option.id}
                                    checked={isSelected}
                                    disabled={disabled || reviewMode}
                                    onChange={() => { if (onSelect) { onSelect(option.id); } }}
                                />

                                {/* Letter badge doubles as the radio indicator. */}
                                <span
                                    className={[
                                        'shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center',
                                        'text-xs font-bold transition-colors',
                                        'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary-500',
                                        isEliminated ? 'border-gray-300 text-gray-400 bg-white' : style.badge,
                                    ].join(' ')}
                                    aria-hidden="true"
                                >
                                    {optionLetter(index)}
                                </span>

                                <span className="flex-1 min-w-0">
                                    <MathContent
                                        html={option.text}
                                        as="span"
                                        className={[
                                            'block text-sm md:text-base',
                                            isEliminated ? 'text-gray-400 line-through' : style.text,
                                        ].join(' ')}
                                    />

                                    {/* Response distribution, review only. Shows the
                                        learner whether a wrong answer was a common
                                        trap or an individual slip. */}
                                    {percent !== null &&
                                        <span className="block mt-2">
                                            <span className="flex items-center gap-2">
                                                <span className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                                    <span
                                                        className={[
                                                            'block h-full rounded-full',
                                                            isCorrect ? 'bg-success-500' : 'bg-gray-300',
                                                        ].join(' ')}
                                                        style={{ width: Math.max(0, Math.min(100, percent)) + '%' }}
                                                    />
                                                </span>
                                                <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                                                    {percent.toFixed(0)}%
                                                </span>
                                            </span>
                                        </span>
                                    }
                                </span>

                                {/* Result glyph. Also carries the only non-colour cue
                                    that distinguishes correct from incorrect, so the
                                    feedback survives for colour-blind users. */}
                                {reviewMode && (isCorrect || isSelected) &&
                                    <span className="shrink-0 flex items-center gap-1.5 pt-0.5">
                                        {isCorrect
                                            ? <CheckIcon className="w-5 h-5 text-success-600" />
                                            : <CrossIcon className="w-5 h-5 text-danger-600" />
                                        }
                                        <span className={[
                                            'text-xs font-semibold hidden sm:inline',
                                            isCorrect ? 'text-success-700' : 'text-danger-700',
                                        ].join(' ')}>
                                            {isCorrect ? (isSelected ? 'Correct' : 'Answer') : 'Your answer'}
                                        </span>
                                    </span>
                                }
                            </label>

                            {canEliminate &&
                                <button
                                    type="button"
                                    onClick={() => onToggleEliminate(option.id)}
                                    aria-pressed={isEliminated}
                                    title={isEliminated ? 'Bring this option back' : 'Rule this option out'}
                                    className={[
                                        'shrink-0 px-3 flex items-center border-l rounded-r-xl transition-colors',
                                        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
                                        isEliminated
                                            ? 'border-gray-200 text-gray-500 hover:text-gray-700 bg-gray-100'
                                            : 'border-gray-100 text-gray-300 hover:text-danger-600 hover:bg-danger-50',
                                    ].join(' ')}
                                >
                                    <StrikeIcon className="w-4 h-4" />
                                    <span className="sr-only">
                                        {isEliminated
                                            ? 'Bring option ' + optionLetter(index) + ' back'
                                            : 'Rule out option ' + optionLetter(index)}
                                    </span>
                                </button>
                            }
                        </div>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default OptionList;
