import React from 'react';
import Countdown from 'react-countdown';

// Countdown for a timed paper.
//
// THE BUG THIS FIXES
// ------------------
// The previous implementation computed its target as
//
//     Date.now() + (allotted + paperStartTime - Date.now())
//
// inside the render method. That expression is recomputed on every single render,
// and PaperView re-renders on every option selection, navigation and save. Feeding
// react-countdown a freshly-derived `date` prop repeatedly is not a stable input,
// so the displayed time could jump or restart mid-paper. In a timed exam that is
// not a cosmetic issue.
//
// The end of a paper is a fixed instant: paperStartTime + allotted minutes. That
// absolute value is passed here once and never changes between renders, which is
// exactly what a countdown needs.
//
// It also had no expiry behaviour: the clock reached zero and the paper stayed
// open indefinitely. `onExpire` now fires so the caller can submit.

const THRESHOLDS = [
    // fraction remaining, classes
    { limit: 0.05, wrap: 'bg-danger-50 border-danger-200', text: 'text-danger-700', pulse: true },
    { limit: 0.20, wrap: 'bg-warning-50 border-warning-200', text: 'text-warning-700', pulse: false },
];

const NEUTRAL = { wrap: 'bg-gray-50 border-gray-200', text: 'text-gray-800', pulse: false };

const ExamTimer = ({ endTime, totalMillis, onExpire = null }) => {
    if (typeof endTime !== 'number' || !Number.isFinite(endTime)) {
        return null;
    }

    const remaining = endTime - Date.now();
    const fraction = (typeof totalMillis === 'number' && totalMillis > 0)
        ? remaining / totalMillis
        : 1;
    const tone = THRESHOLDS.find((t) => fraction < t.limit) || NEUTRAL;

    return (
        <div
            className={'inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2 ' + tone.wrap}
            role="timer"
            aria-live="off"
        >
            <svg
                className={['w-4 h-4 shrink-0', tone.text, tone.pulse ? 'animate-pulse' : ''].filter(Boolean).join(' ')}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.3.7l2.5 2.5a1 1 0 001.4-1.4L11 9.6V6z" clipRule="evenodd" />
            </svg>
            <div className="flex flex-col leading-none">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    Time left
                </span>
                <span className={'font-bold text-base tabular-nums ' + tone.text}>
                    {/* `date` is an absolute instant, stable across renders. */}
                    <Countdown
                        date={endTime}
                        daysInHours={true}
                        onComplete={onExpire || undefined}
                    />
                </span>
            </div>
        </div>
    );
};

export default ExamTimer;
