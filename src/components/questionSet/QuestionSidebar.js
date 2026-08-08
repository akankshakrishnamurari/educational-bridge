import React from 'react';
import { AiOutlineLike, AiOutlineDislike, AiFillLike, AiFillDislike } from 'react-icons/ai';
import DifficultyMeter from '../common/DifficultyMeter';
import { typography } from '../../constants/designTokens';
import { currentURLHost } from '../../constants/hostConfig';
import { accent } from '../../constants/accents';
import { parseQuestionTaxonomy, subjectAccent } from '../../utils/questionTaxonomy';

// Context rail for the solve page.
//
// Everything here comes off the question payload that was already being fetched
// and thrown away. The page used to render the stem, the options and a comment
// thread inside a 768px column, which left roughly half of a laptop screen empty
// and gave the learner no answer to the two questions they actually have while
// looking at a problem: "where does this sit in the syllabus" and "what should I
// do after this one".
//
// Nothing in here is invented. If a dimension is absent from the tags, its row is
// omitted rather than filled with a dash or a zero.

const Panel = ({ title, children, className = '' }) => (
    <section className={'bg-white rounded-xl border border-gray-100 shadow-sm p-4 ' + className}>
        {title && <h2 className={typography.label + ' mb-3'}>{title}</h2>}
        {children}
    </section>
);

const DetailRow = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
        <dt className="text-xs text-gray-500 shrink-0">{label}</dt>
        <dd className="text-sm text-gray-800 text-right min-w-0 break-words">{value}</dd>
    </div>
);

/**
 * A readable label for a sibling question.
 *
 * The obvious choice is a preview of the stem, and that was tried first. It does
 * not survive this content: these stems are mostly LaTeX, so stripping the maths
 * leaves strings like "Let … = … and, … The magnitude of a coplanar vector …",
 * and typesetting six of them in a narrow rail competes with the question being
 * solved. The `name` field is a clean human label already — "JEE Main 2018
 * (Online) 16th April Morning Slot - Physics" — so it is used instead, with the
 * trailing subject dropped because the subject is constant across this list.
 */
/**
 * Human-readable attribution, or null when there is nobody meaningful to credit.
 *
 * `createdBy` is a raw string straight off the row, and for the bulk of the bank
 * it is a machine identity — "jee-data-base-import", "seed-script" — or a 21-digit
 * Google subject id. The page was rendering those verbatim next to the word
 * "Author", which reads as though a script wrote the question. Imported questions
 * are credited to their source (which the taxonomy already carries) rather than
 * to the importer, and bare numeric ids are dropped because there is no name
 * lookup available on this payload.
 */
const MACHINE_AUTHORS = ['import', 'script', 'seed', 'system', 'default'];

const attribution = (createdBy) => {
    if (createdBy && typeof createdBy === 'object') {
        return typeof createdBy.name === 'string' && createdBy.name.trim() ? createdBy.name.trim() : null;
    }
    if (typeof createdBy !== 'string') {
        return null;
    }
    const value = createdBy.trim();
    if (!value) {
        return null;
    }
    const lower = value.toLowerCase();
    if (MACHINE_AUTHORS.some((marker) => lower.includes(marker))) {
        return null;
    }
    // A Google subject id is a long run of digits and identifies nobody to a reader.
    if (/^\d{8,}$/.test(value)) {
        return null;
    }
    return value;
};

const siblingLabel = (sibling, subject) => {
    const name = typeof sibling.name === 'string' ? sibling.name.trim() : '';
    if (!name || name.toLowerCase() === 'new question') {
        return null;
    }
    if (subject && name.toLowerCase().endsWith(' - ' + subject.toLowerCase())) {
        return name.slice(0, name.length - (subject.length + 3)).trim();
    }
    return name;
};

const VoteButton = ({ active, onClick, ActiveIcon, Icon, count, label, tone }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active === true}
        aria-label={label}
        className={[
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500',
            active
                ? tone.activeClass
                : 'border-gray-200 text-gray-600 hover:bg-gray-50',
        ].join(' ')}
    >
        {active ? <ActiveIcon size={16} /> : <Icon size={16} />}
        {/* A null count is rendered as 0 rather than the string "null". The API
            returns null for a question nobody has voted on. */}
        <span className="tabular-nums">{typeof count === 'number' ? count : 0}</span>
    </button>
);

const QuestionSidebar = ({
    questionDetails,
    siblings = [],
    siblingContext = null,
    elapsedLabel = null,
    onUpvote,
    onDownvote,
}) => {
    if (!questionDetails) {
        return null;
    }
    const taxonomy = parseQuestionTaxonomy(questionDetails.tags);
    const tone = accent(subjectAccent(taxonomy.subject));

    const details = [
        ['Exam', taxonomy.exam],
        ['Year', taxonomy.year],
        ['Paper', taxonomy.paper],
        ['Chapter group', taxonomy.chapterGroup],
        ['Chapter', taxonomy.chapter],
        ['Topic', taxonomy.topic],
        ['Source', taxonomy.source],
        ['Contributed by', attribution(questionDetails.createdBy)],
    ].filter((row) => row[1]);

    const hasVotes = typeof onUpvote === 'function' && typeof onDownvote === 'function';

    return (
        <aside className="w-full xl:w-80 xl:shrink-0">
            <div className="xl:sticky xl:top-20 flex flex-col gap-4">

                {/* Subject + difficulty. The accent bar is the only place the
                    subject colour appears on this page, which keeps it a signal
                    rather than decoration. */}
                {(taxonomy.subject || taxonomy.difficulty || elapsedLabel) &&
                    <Panel>
                        <div className="flex items-start gap-3">
                            {taxonomy.subject &&
                                <span className={'w-1 self-stretch rounded-full ' + tone.rail} aria-hidden="true" />
                            }
                            <div className="min-w-0 flex-1">
                                {taxonomy.subject &&
                                    <p className={'text-sm font-semibold ' + tone.text}>{taxonomy.subject}</p>
                                }
                                {taxonomy.topic &&
                                    <p className="text-xs text-gray-500 mt-0.5 break-words">{taxonomy.topic}</p>
                                }
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <DifficultyMeter
                                        level={taxonomy.difficultyLevel}
                                        label={taxonomy.difficulty}
                                    />
                                    {elapsedLabel &&
                                        <span
                                            className="text-xs tabular-nums text-gray-400"
                                            title="Time on this question"
                                        >
                                            {elapsedLabel}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </Panel>
                }

                {details.length > 0 &&
                    <Panel title="Where this comes from">
                        <dl>
                            {details.map(([label, value]) => (
                                <DetailRow key={label} label={label} value={value} />
                            ))}
                        </dl>
                    </Panel>
                }

                {hasVotes &&
                    <Panel title="Was this question useful?">
                        <div className="flex items-center gap-2">
                            <VoteButton
                                active={questionDetails.hasUserUpvoted === true}
                                onClick={onUpvote}
                                ActiveIcon={AiFillLike}
                                Icon={AiOutlineLike}
                                count={questionDetails.upvoteCount}
                                label="Upvote this question"
                                tone={{ activeClass: 'border-success-500 bg-success-50 text-success-700' }}
                            />
                            <VoteButton
                                active={questionDetails.hasUserDownvoted === true}
                                onClick={onDownvote}
                                ActiveIcon={AiFillDislike}
                                Icon={AiOutlineDislike}
                                count={questionDetails.downvoteCount}
                                label="Downvote this question"
                                tone={{ activeClass: 'border-danger-500 bg-danger-50 text-danger-700' }}
                            />
                        </div>
                    </Panel>
                }

                {/* Keyboard hints. Discoverability is the whole problem with
                    shortcuts, so they are stated rather than hidden behind a
                    help modal. Hidden on touch-first widths where they are
                    meaningless. */}
                <Panel title="Keyboard" className="hidden xl:block">
                    <ul className="flex flex-col gap-2 text-xs text-gray-600">
                        <li className="flex items-center justify-between gap-2">
                            <span>Choose an answer</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[11px]">
                                A&ndash;D
                            </kbd>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                            <span>Rule an option out</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[11px]">
                                Shift + A&ndash;D
                            </kbd>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                            <span>Submit</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[11px]">
                                Enter
                            </kbd>
                        </li>
                    </ul>
                </Panel>

                {siblings.length > 0 &&
                    <Panel
                        title={siblingContext && siblingContext.value
                            ? 'More on ' + siblingContext.value
                            : 'More like this'}
                    >
                        <ul className="flex flex-col divide-y divide-gray-50 -my-1">
                            {siblings.map((sibling) => {
                                const label = siblingLabel(sibling, taxonomy.subject);
                                const siblingTaxonomy = parseQuestionTaxonomy(sibling.tags);
                                return (
                                    <li key={sibling.id}>
                                        <a
                                            href={currentURLHost + 'question/view?question_id=' + sibling.id}
                                            className="flex items-center justify-between gap-3 py-2.5 group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-xs font-medium text-gray-700 group-hover:text-primary-700 leading-snug">
                                                    {label || 'Practice question'}
                                                </span>
                                                {siblingTaxonomy.difficulty &&
                                                    <span className="block text-[11px] text-gray-400 mt-0.5">
                                                        {siblingTaxonomy.difficulty}
                                                    </span>
                                                }
                                            </span>
                                            <span
                                                className="shrink-0 text-gray-300 group-hover:text-primary-600"
                                                aria-hidden="true"
                                            >
                                                &rarr;
                                            </span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </Panel>
                }

            </div>
        </aside>
    );
};

export default QuestionSidebar;
