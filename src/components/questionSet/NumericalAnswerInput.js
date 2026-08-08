import React from 'react';
import MathContent from '../common/MathContent';

// Answer entry for a NUMERICAL question -- the JEE Main "numerical value"
// section, where the answer is a number the learner works out and types rather
// than one of four options.
//
// WHY A SEPARATE COMPONENT
// ------------------------
// OptionList is a radio group over a fixed set of choices. A numerical question
// has no choices at all, so rendering one through OptionList produces its
// "This question has no answer options recorded" empty state. The two share the
// review vocabulary (correct / incorrect, and disclosing the expected answer only
// after submission) but nothing else.
//
// ACCESSIBILITY
// -------------
// A real labelled <input>, with inputMode="decimal" so touch keyboards open on
// digits, and aria-describedby wiring the hint and the review verdict to the
// field. `type="text"` rather than `type="number"` on purpose: number inputs
// silently discard values the browser considers invalid mid-typing (a lone "-",
// or "1e"), swallow scroll events as increments, and vary between browsers. The
// value is validated on the way in instead.

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

// A partial decimal the learner may legitimately be part-way through typing.
// Allows a leading sign, digits, one decimal point, and scientific notation.
const PARTIAL_NUMBER = /^[+-]?(\d*\.?\d*)([eE][+-]?\d*)?$/;

export const isEnterableNumber = (text) => text === '' || PARTIAL_NUMBER.test(text);

export const parseAnswerNumber = (text) => {
    if (typeof text !== 'string' && typeof text !== 'number') {
        return null;
    }
    let value = String(text).trim();
    if (value.startsWith('+')) {
        value = value.slice(1);
    }
    if (value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Whether a submitted answer matches the expected one.
 *
 * Mirrors AnswerEvaluator on the backend, including the scaled epsilon that keeps
 * a difference exactly equal to the tolerance from failing on floating-point
 * representation error. The backend remains the authority -- this only drives what
 * the review screen displays.
 */
export const isNumericalAnswerCorrect = (expectedText, submittedText, tolerance) => {
    const expected = parseAnswerNumber(expectedText);
    const submitted = parseAnswerNumber(submittedText);
    if (expected === null || submitted === null) {
        if (expectedText == null || submittedText == null) {
            return false;
        }
        const normalise = (text) => String(text).trim().replace(/\s+/g, ' ').toLowerCase();
        return normalise(expectedText) === normalise(submittedText);
    }
    const allowed = typeof tolerance === 'number' && Number.isFinite(tolerance)
        ? Math.abs(tolerance)
        : 0;
    const epsilon = 1e-9 * Math.max(1, Math.abs(expected), Math.abs(submitted));
    return Math.abs(expected - submitted) <= allowed + epsilon;
};

const NumericalAnswerInput = ({
    value = null,
    correctAnswer = null,
    answerTolerance = null,
    onChange = null,
    reviewMode = false,
    disabled = false,
    inputId = 'numerical-answer',
}) => {
    const entered = value == null ? '' : String(value);
    const hintId = inputId + '-hint';
    const verdictId = inputId + '-verdict';

    // The expected answer is disclosed only once the learner has submitted, which
    // is the same rule OptionList applies to the correct option.
    const isCorrect = reviewMode && correctAnswer != null
        ? isNumericalAnswerCorrect(correctAnswer, entered, answerTolerance)
        : null;

    let fieldStyle = 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
    if (reviewMode && isCorrect === true) {
        fieldStyle = 'border-success-500 bg-success-50 text-gray-900';
    } else if (reviewMode && isCorrect === false) {
        fieldStyle = 'border-danger-500 bg-danger-50 text-gray-900';
    }

    const handleChange = (event) => {
        const next = event.target.value;
        // Reject keystrokes that could not become a number, rather than accepting
        // them and failing at submit time.
        if (!isEnterableNumber(next)) {
            return;
        }
        if (onChange) {
            onChange(next);
        }
    };

    return (
        <div className="w-full">
            <label htmlFor={inputId} className="block text-sm font-semibold text-gray-900 mb-1.5">
                Your answer
            </label>
            <div className="flex items-center gap-3 flex-wrap">
                <input
                    id={inputId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck="false"
                    className={[
                        'w-44 rounded-xl border px-3.5 py-2.5 text-base tabular-nums',
                        'transition-colors focus:outline-none focus:ring-1',
                        'disabled:bg-gray-50 disabled:text-gray-500',
                        fieldStyle,
                    ].join(' ')}
                    value={entered}
                    onChange={handleChange}
                    disabled={disabled || reviewMode}
                    placeholder="e.g. 4 or 12.50"
                    aria-describedby={reviewMode ? verdictId : hintId}
                    aria-invalid={reviewMode && isCorrect === false ? 'true' : undefined}
                />
                {reviewMode && isCorrect !== null && (
                    <span
                        className={[
                            'inline-flex items-center gap-1.5 text-sm font-semibold',
                            isCorrect ? 'text-success-700' : 'text-danger-700',
                        ].join(' ')}
                    >
                        {isCorrect
                            ? <CheckIcon className="w-5 h-5 text-success-600" />
                            : <CrossIcon className="w-5 h-5 text-danger-600" />}
                        {isCorrect ? 'Correct' : 'Not correct'}
                    </span>
                )}
            </div>

            {!reviewMode && (
                <p id={hintId} className="text-xs text-gray-500 mt-2">
                    Type the value only, with no units.
                    {typeof answerTolerance === 'number' && answerTolerance > 0
                        ? ' Answers within ' + answerTolerance + ' are accepted.'
                        : ''}
                </p>
            )}

            {reviewMode && correctAnswer != null && (
                <p id={verdictId} className="text-sm text-gray-700 mt-2.5">
                    <span className="text-gray-500">Correct answer: </span>
                    <MathContent
                        html={String(correctAnswer)}
                        as="span"
                        className="font-semibold text-gray-900 tabular-nums"
                    />
                </p>
            )}
            {reviewMode && correctAnswer == null && (
                <p id={verdictId} className="text-sm text-gray-500 italic mt-2.5">
                    No answer has been recorded for this question yet.
                </p>
            )}
        </div>
    );
};

export default NumericalAnswerInput;
