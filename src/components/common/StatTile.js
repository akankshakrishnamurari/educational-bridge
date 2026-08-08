import React from 'react';

// A single figure with a label, for the analytics panels on the review page.
//
// These replace a raw <JSONPretty> dump of the analytics object. The data was
// always there -- attempts, correct attempts, best time, first-attempt outcome --
// it was just rendered as a JSON blob under the heading "Your Analysis for this
// Question", which is a developer debugging view rather than something a student
// can read.
//
// `tone` is used sparingly: only the first-attempt outcome earns colour, because
// if every tile is coloured then none of them stand out.

const toneClasses = {
    neutral: 'text-gray-900',
    success: 'text-success-700',
    danger: 'text-danger-700',
    primary: 'text-primary-700',
};

const StatTile = ({ label, value, hint = null, tone = 'neutral' }) => (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg bg-gray-50">
        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
        </dt>
        <dd className={['text-lg font-bold tabular-nums leading-tight', toneClasses[tone] || toneClasses.neutral].join(' ')}>
            {value}
        </dd>
        {hint &&
            <dd className="text-xs text-gray-400">{hint}</dd>
        }
    </div>
);

export default StatTile;
