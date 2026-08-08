import React from 'react';
import MathContent from '../common/MathContent';
import DifficultyMeter from '../common/DifficultyMeter';
import Button from '../common/Button';
import { accent } from '../../constants/accents';
import { parseQuestionTaxonomy, subjectAccent } from '../../utils/questionTaxonomy';

// One row in the practice list.
//
// REPLACES a one-column MUI <Table> row. A table was the wrong primitive: there
// is only ever a single column, so all the table bought us was TableCell padding
// and border overrides to fight, plus it forced every row to look identical.
//
// The redesign's premise is that the metadata IS the product. A student choosing
// what to practise needs to know subject, chapter, topic, difficulty and year
// before they open anything. All of that already exists in the tag list; it was
// simply being flattened into four interchangeable grey pills with the semantic
// prefix stripped off. Here each dimension is rendered as what it is:
//
//   subject  -> coloured rail + first breadcrumb segment (pre-attentive wayfinding)
//   chapter  -> breadcrumb
//   topic    -> breadcrumb
//   difficulty -> three-segment meter
//   year/exam -> provenance line
//   flags    -> warning badges, because "Out Of Syllabus" changes whether you
//               should attempt the question at all
//
// LINK SEMANTICS
// --------------
// The primary target is a real <a href>, not a div with an onClick that sets
// window.location.href. That restores cmd/ctrl-click, middle-click, "open in new
// tab", focus order and the browser's own status-bar preview, all of which the
// previous implementation broke.

const Separator = () => (
    <span className="text-gray-300 select-none" aria-hidden="true">/</span>
);

const QuestionListItem = ({
    question,
    href,
    index = null,
    isOwner = false,
    onEdit = null,
}) => {
    const taxonomy = parseQuestionTaxonomy(question.tags);
    const accentKey = subjectAccent(taxonomy.subject);
    const tone = accent(accentKey);

    // The API now reports this as a boolean. It used to be inferred from the presence
    // of `answerDescription`, which meant the full worked solution for every row on
    // the page had to be downloaded so this one indicator could be drawn — and it put
    // the answer to 25 questions in the network response of a page where nobody has
    // answered anything yet. The server strips the answer from browse responses and
    // sends `hasSolution` instead.
    //
    // The old inference is kept as a fallback so the badge still works against a
    // backend that predates the change.
    const hasSolution = typeof question.hasSolution === 'boolean'
        ? question.hasSolution
        : (typeof question.answerDescription === 'string'
            && question.answerDescription.trim().length > 0);

    const optionCount = Array.isArray(question.options) ? question.options.length : 0;

    // Provenance line. Built as an array so separators only appear between items
    // that actually exist -- with 2-tag questions most of these are absent.
    const provenance = [];
    if (taxonomy.exam) {
        provenance.push(taxonomy.exam);
    }
    if (taxonomy.year) {
        provenance.push(taxonomy.year);
    }
    if (optionCount > 0) {
        provenance.push(optionCount + ' options');
    }

    return (
        <article className="group relative flex bg-white transition-colors hover:bg-gray-50/70">
            {/* Subject accent rail. Full-bleed on the left edge so a scan down the
                list reads as colour bands grouped by subject. */}
            <span className={['w-1 shrink-0', tone.rail].join(' ')} aria-hidden="true" />

            <div className="flex-1 min-w-0 px-4 md:px-5 py-4">
                <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Classification trail. Subject is tinted to match the rail;
                            the deeper levels stay neutral so the eye lands on subject
                            first, then refines. */}
                        {taxonomy.breadcrumb.length > 0 &&
                            <nav
                                className="flex items-center gap-1.5 flex-wrap text-xs mb-2"
                                aria-label="Question classification"
                            >
                                {taxonomy.subject &&
                                    <span className={['font-semibold', tone.text].join(' ')}>
                                        {taxonomy.subject}
                                    </span>
                                }
                                {taxonomy.chapter &&
                                    <>
                                        <Separator />
                                        <span className="text-gray-500">{taxonomy.chapter}</span>
                                    </>
                                }
                                {taxonomy.topic && taxonomy.topic !== taxonomy.chapter &&
                                    <>
                                        <Separator />
                                        <span className="text-gray-500 truncate">{taxonomy.topic}</span>
                                    </>
                                }
                            </nav>
                        }

                        {/* Primary link. The index sits in its own flex track
                            rather than floating inside the rendered HTML, which
                            would interact unpredictably with question bodies that
                            open with a table or a diagram. */}
                        <a href={href} className="flex gap-2.5 focus:outline-none">
                            {index !== null &&
                                <span className="text-sm font-semibold text-gray-300 tabular-nums shrink-0 pt-0.5">
                                    {index}
                                </span>
                            }
                            <MathContent
                                html={question.description}
                                className="math-content--preview text-sm md:text-base text-gray-800 group-hover:text-gray-900 min-w-0"
                            />
                        </a>

                        <div className="flex items-center gap-x-3 gap-y-2 flex-wrap mt-3">
                            {provenance.length > 0 &&
                                <span className="text-xs text-gray-500">
                                    {provenance.join('  ·  ')}
                                </span>
                            }
                            {hasSolution &&
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
                                    </svg>
                                    Solution
                                </span>
                            }
                            {taxonomy.flags.map((flag) => (
                                <span
                                    key={flag}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700"
                                >
                                    {flag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right column: difficulty above the actions. Fixed width so
                        every row's action cluster lines up vertically down the list
                        instead of drifting with content length. */}
                    <div className="hidden sm:flex flex-col items-end gap-3 shrink-0 w-28">
                        <DifficultyMeter
                            level={taxonomy.difficultyLevel}
                            label={taxonomy.difficulty}
                        />
                        {/* Kept permanently visible rather than revealed on hover:
                            a hover-only CTA is invisible to touch users and gives
                            no affordance that the row is actionable. The arrow
                            nudges on hover to signal navigation. */}
                        <a
                            href={href}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                        >
                            Solve
                            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">&rarr;</span>
                        </a>
                        {isOwner && onEdit &&
                            <Button size="sm" variant="ghost" onClick={() => onEdit(question.id)}>
                                Edit
                            </Button>
                        }
                    </div>
                </div>

                {/* Small screens: difficulty moves inline under the body, and the
                    whole card is the tap target, so no duplicated Solve button. */}
                <div className="flex sm:hidden items-center justify-between mt-3">
                    <DifficultyMeter
                        level={taxonomy.difficultyLevel}
                        label={taxonomy.difficulty}
                        size="sm"
                    />
                    {isOwner && onEdit &&
                        <Button size="sm" variant="ghost" onClick={() => onEdit(question.id)}>
                            Edit
                        </Button>
                    }
                </div>
            </div>
        </article>
    );
};

export default QuestionListItem;
