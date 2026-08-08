import React from 'react';

// Question navigator for a timed paper.
//
// WHY IT LOOKS LIKE THIS
// ----------------------
// Aspirants sit the real exam in an interface that encodes question state as
// colour, and they learn to read it under time pressure. Inventing a different
// visual language here would cost them attention they cannot spare, so this
// follows the established convention: five distinct states, a legend, and running
// counts. Familiarity is the feature.
//
// The previous palette had three states (default / answered / marked) and no
// legend, so "I have not looked at this yet" and "I looked and could not do it"
// were indistinguishable -- which is precisely the distinction you need when
// deciding where to spend your last ten minutes.
//
// DERIVING "VISITED" WITHOUT A NEW FIELD
// -------------------------------------
// There is no persisted `visited` flag, and adding one to the client payload
// would not survive a reload because the backend would not store it. But
// `questionWiseTimeSpent` IS persisted, and a question gains an entry there the
// moment you navigate away from it. So: visited = has a time entry, or is the
// question currently on screen. That round-trips for free.

export const PALETTE_STATES = {
    answeredMarked: {
        key: 'answeredMarked',
        label: 'Answered & marked',
        button: 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700',
        swatch: 'bg-primary-600',
    },
    answered: {
        key: 'answered',
        label: 'Answered',
        button: 'bg-success-600 border-success-600 text-white hover:bg-success-700',
        swatch: 'bg-success-600',
    },
    marked: {
        key: 'marked',
        label: 'Marked for review',
        button: 'bg-warning-500 border-warning-500 text-white hover:bg-warning-600',
        swatch: 'bg-warning-500',
    },
    notAnswered: {
        key: 'notAnswered',
        label: 'Seen, not answered',
        button: 'bg-danger-500 border-danger-500 text-white hover:bg-danger-600',
        swatch: 'bg-danger-500',
    },
    notVisited: {
        key: 'notVisited',
        label: 'Not seen yet',
        button: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
        swatch: 'bg-white border border-gray-300',
    },
};

/**
 * Resolve one question's palette state.
 */
export const resolvePaletteState = ({ isAnswered, isMarked, isVisited }) => {
    if (isAnswered && isMarked) {
        return PALETTE_STATES.answeredMarked;
    }
    if (isAnswered) {
        return PALETTE_STATES.answered;
    }
    if (isMarked) {
        return PALETTE_STATES.marked;
    }
    if (isVisited) {
        return PALETTE_STATES.notAnswered;
    }
    return PALETTE_STATES.notVisited;
};

const Legend = ({ counts }) => (
    <dl className="grid grid-cols-1 gap-1.5">
        {Object.keys(PALETTE_STATES).map((key) => {
            const state = PALETTE_STATES[key];
            return (
                <div key={key} className="flex items-center gap-2">
                    <span className={'shrink-0 w-3.5 h-3.5 rounded ' + state.swatch} aria-hidden="true" />
                    <dt className="flex-1 text-xs text-gray-600">{state.label}</dt>
                    <dd className="text-xs font-semibold text-gray-900 tabular-nums">{counts[key] || 0}</dd>
                </div>
            );
        })}
    </dl>
);

const QuestionPalette = ({
    questions = [],
    candidateResponses = {},
    questionsMarkedForReviews = [],
    questionWiseTimeSpent = {},
    currentQuestionNumber = 1,
    onSelect,
}) => {
    const markedSet = new Set(questionsMarkedForReviews || []);

    const counts = {};
    // Grouped by the paper's own section structure rather than presented as one
    // flat run of numbers. A 90-question paper is three subjects; showing it as a
    // single block hides where a section starts and ends.
    const sections = [];
    const sectionIndex = new Map();

    questions.forEach((question, index) => {
        const isAnswered = candidateResponses[question.id] !== undefined
            && candidateResponses[question.id] !== null;
        const isMarked = markedSet.has(question.id);
        const isVisited = Object.prototype.hasOwnProperty.call(questionWiseTimeSpent || {}, question.id)
            || (index + 1) === currentQuestionNumber;
        const state = resolvePaletteState({ isAnswered, isMarked, isVisited });
        counts[state.key] = (counts[state.key] || 0) + 1;

        const label = [question.subjectName, question.sectionName].filter(Boolean).join(' · ') || 'Questions';
        if (!sectionIndex.has(label)) {
            sectionIndex.set(label, sections.length);
            sections.push({ label, items: [] });
        }
        sections[sectionIndex.get(label)].items.push({
            question,
            number: index + 1,
            state,
            isCurrent: (index + 1) === currentQuestionNumber,
        });
    });

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-sm font-semibold text-gray-900">Question navigator</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                    {(counts.answered || 0) + (counts.answeredMarked || 0)} of {questions.length} answered
                </p>
            </div>

            {sections.map((section) => (
                <div key={section.label}>
                    {sections.length > 1 &&
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            {section.label}
                        </p>
                    }
                    <div className="flex flex-wrap gap-1.5">
                        {section.items.map((item) => (
                            <button
                                key={item.question.id}
                                type="button"
                                onClick={() => onSelect(item.number)}
                                aria-current={item.isCurrent ? 'true' : undefined}
                                aria-label={'Question ' + item.number + ', ' + item.state.label}
                                title={'Question ' + item.number + ' — ' + item.state.label}
                                className={[
                                    'relative w-9 h-9 flex items-center justify-center rounded-lg border',
                                    'text-xs font-semibold transition-colors',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                                    item.state.button,
                                    // The current question gets a ring rather than a
                                    // different fill, so "where am I" is legible
                                    // without overriding "what state is it in".
                                    item.isCurrent ? 'ring-2 ring-offset-1 ring-gray-900' : '',
                                ].filter(Boolean).join(' ')}
                            >
                                {item.number}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="pt-3 border-t border-gray-100">
                <Legend counts={counts} />
            </div>
        </div>
    );
};

export default QuestionPalette;
