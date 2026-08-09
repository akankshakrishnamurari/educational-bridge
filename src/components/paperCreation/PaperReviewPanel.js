import React from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import MeterBar from '../common/MeterBar';
import {
    allSections,
    totalQuestionCount,
    totalMarks,
    sectionMarks,
} from '../../js/adminPortal/paperCreation/paperBlueprint';

// The review-and-publish band at the foot of the builder.
//
// WHAT THIS REPLACES
// ------------------
// A card headed "Before publishing" holding a bulleted list of validation
// sentences, wedged into the builder's narrow left column underneath the
// blueprint, plus a Publish button in the page header several screens away from
// it. Four things were wrong with that, in rough order of how much they cost the
// author:
//
//  1. There was no review. The section was named for one but showed only what was
//     *missing*. Nothing anywhere stated what the paper actually contained — how
//     many questions sat in each section, how the marks were distributed, whether
//     one section had 40 questions and its neighbour 2. Those are the questions
//     someone asks before publishing, and the answer was "click through the
//     blueprint and add it up yourself".
//
//  2. The problems were sentences, not controls. "Add at least one question to
//     Section 2 in Physics" tells you where to go and then makes you go there by
//     hand. Each problem now carries the ids of the subject and section it came
//     from, so it is a button that takes you to the thing.
//
//  3. The Publish button was disabled with no adjacent reason. A disabled control
//     is the weakest possible feedback: it refuses without explaining, and it
//     cannot even be clicked to ask why. When the paper is not publishable the
//     header now offers "Review N issues" instead, which scrolls here.
//
//  4. Blockers and opinions were not distinguished, because there were no
//     opinions. A paper can be perfectly valid and still obviously wrong — 20
//     seconds a question, or one section holding 80% of the marks. Those are
//     advisory, they never block, and they are visually separated so that the
//     blocking list stays worth reading.

const numberOrDash = (value) => (Number.isFinite(Number(value)) ? Number(value) : '—');

const PaperReviewPanel = ({
    blueprint,
    issues,
    notes,
    isPublishing,
    onPublish,
    onGoToIssue,
    reviewRef,
}) => {
    const sections = allSections(blueprint);
    const questionCount = totalQuestionCount(blueprint);
    const marks = totalMarks(blueprint);
    const minutes = Number(blueprint.allottedPaperTime);
    const isReady = issues.length === 0;

    // The widest single section, used as the meter's scale so the bars compare
    // sections against each other rather than against the paper total. Comparing
    // against the total makes every bar short and the differences unreadable.
    const widestSectionMarks = sections.reduce(
        (max, section) => Math.max(max, sectionMarks(section)), 0);

    const paceLabel = (Number.isFinite(minutes) && minutes > 0 && questionCount > 0)
        ? (() => {
            const seconds = Math.round((minutes * 60) / questionCount);
            return seconds >= 60
                ? (seconds / 60).toFixed(1) + ' min a question'
                : seconds + ' sec a question';
        })()
        : null;

    return (
        <section ref={reviewRef} className='mt-4 scroll-mt-20'>
            <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
                <div className='px-4 md:px-6 py-4 border-b border-gray-200 flex items-baseline justify-between gap-3 flex-wrap'>
                    <h2 className='text-base md:text-lg font-semibold text-gray-900'>
                        Review &amp; publish
                    </h2>
                    {/* Honesty rule: only shown once there is something to describe. */}
                    {questionCount > 0 &&
                        <p className='text-sm text-gray-500 tabular-nums'>
                            {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                            {' · '}{marks} marks
                            {Number.isFinite(minutes) && minutes > 0 ? ' · ' + minutes + ' min' : ''}
                            {paceLabel === null ? '' : ' · ' + paceLabel}
                        </p>}
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-12'>

                    {/* ---- what the paper actually is ---------------------------- */}
                    <div className='lg:col-span-7 min-w-0 px-4 md:px-6 py-5 lg:border-r border-gray-200'>
                        <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                            What will go live
                        </h3>

                        {sections.length === 0
                            ? <p className='mt-3 text-sm text-gray-400 italic'>
                                No sections yet.
                            </p>
                            : <div className='mt-3 flex flex-col gap-5'>
                                {(blueprint.subjects || []).map((subject, subjectIndex) => {
                                    const subjectName = (subject.name || '').trim();
                                    const subjectSections = subject.sections || [];
                                    const subjectQuestions = subjectSections.reduce(
                                        (sum, section) => sum + section.questionIds.length, 0);
                                    const subjectMarkTotal = subjectSections.reduce(
                                        (sum, section) => sum + sectionMarks(section), 0);
                                    return (
                                        <div key={subject.id}>
                                            <div className='flex items-baseline justify-between gap-2'>
                                                <h4 className='text-sm font-semibold text-gray-900 truncate'>
                                                    {subjectName === ''
                                                        ? <span className='text-gray-400 italic font-normal'>
                                                            Subject {subjectIndex + 1}, unnamed
                                                        </span>
                                                        : subjectName}
                                                </h4>
                                                <span className='text-xs text-gray-500 tabular-nums whitespace-nowrap'>
                                                    {subjectQuestions} q · {subjectMarkTotal} marks
                                                </span>
                                            </div>

                                            <ul className='mt-1.5 flex flex-col gap-1.5'>
                                                {subjectSections.map((section) => {
                                                    const name = (section.name || '').trim();
                                                    const count = section.questionIds.length;
                                                    const sectionTotal = sectionMarks(section);
                                                    return (
                                                        <li key={section.id}>
                                                            <button
                                                                type='button'
                                                                onClick={() => onGoToIssue(subject.id, section.id)}
                                                                className='w-full text-left px-2 py-1.5 -mx-2 rounded-lg
                                                                    hover:bg-gray-50 focus:outline-none focus:ring-2
                                                                    focus:ring-primary-500 transition-colors'
                                                            >
                                                                <div className='flex items-baseline justify-between gap-3'>
                                                                    <span className='text-sm text-gray-700 truncate min-w-0'>
                                                                        {name === ''
                                                                            ? <span className='text-gray-400 italic'>Unnamed section</span>
                                                                            : name}
                                                                    </span>
                                                                    <span className='text-xs tabular-nums whitespace-nowrap text-gray-500'>
                                                                        {count === 0
                                                                            ? <span className='text-warning-700 font-medium'>empty</span>
                                                                            : count + ' q'}
                                                                        {' · +' + numberOrDash(section.positiveMarks)}
                                                                        {' / ' + numberOrDash(section.negativeMarks)}
                                                                        {count > 0 ? ' · ' + sectionTotal : ''}
                                                                    </span>
                                                                </div>
                                                                {/* Scaled against the largest section, so the
                                                                    comparison being drawn is section-to-section. */}
                                                                <MeterBar
                                                                    className='mt-1'
                                                                    height='h-1.5'
                                                                    tone={count === 0 ? 'gray' : 'primary'}
                                                                    value={sectionTotal}
                                                                    max={widestSectionMarks}
                                                                />
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>}

                        {notes.length > 0 &&
                            <div className='mt-5 pt-4 border-t border-gray-100'>
                                <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                                    Worth a look
                                    <span className='ml-1.5 font-normal normal-case tracking-normal text-gray-400'>
                                        (none of these stop you publishing)
                                    </span>
                                </h3>
                                <ul className='mt-2 flex flex-col gap-1.5'>
                                    {notes.map((note, index) => (
                                        <li key={index} className='flex gap-2 text-sm text-gray-600'>
                                            <span aria-hidden='true' className='text-warning-500 leading-5'>&bull;</span>
                                            {note.sectionId === null
                                                ? <span>{note.message}</span>
                                                : <button
                                                    type='button'
                                                    className='text-left underline decoration-gray-300 hover:decoration-gray-600
                                                        focus:outline-none focus:ring-2 focus:ring-primary-500 rounded'
                                                    onClick={() => onGoToIssue(note.subjectId, note.sectionId)}
                                                >
                                                    {note.message}
                                                </button>}
                                        </li>
                                    ))}
                                </ul>
                            </div>}
                    </div>

                    {/* ---- the gate --------------------------------------------- */}
                    <div className='lg:col-span-5 min-w-0 px-4 md:px-6 py-5 border-t lg:border-t-0 border-gray-200 bg-gray-50'>
                        {isReady
                            ? <>
                                <div className='flex items-center gap-2'>
                                    <span className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-100 text-success-700 text-xs font-bold' aria-hidden='true'>
                                        &#10003;
                                    </span>
                                    <h3 className='text-sm font-semibold text-success-700'>
                                        Ready to publish
                                    </h3>
                                </div>
                                <p className='mt-2 text-sm text-gray-600 leading-relaxed'>
                                    <span className='font-semibold text-gray-900'>
                                        {blueprint.paperName.trim()}
                                    </span>{' '}
                                    will become available to students with {questionCount}{' '}
                                    {questionCount === 1 ? 'question' : 'questions'} across{' '}
                                    {sections.length} {sections.length === 1 ? 'section' : 'sections'},
                                    worth {marks} marks in {minutes} minutes.
                                </p>
                                <Button
                                    variant='primary'
                                    size='lg'
                                    className='mt-4 w-full'
                                    disabled={isPublishing}
                                    onClick={onPublish}
                                >
                                    {isPublishing ? 'Publishing…' : 'Publish paper'}
                                </Button>
                                <p className='mt-2 text-xs text-gray-500'>
                                    You will be asked to confirm.
                                </p>
                            </>
                            : <>
                                <div className='flex items-center gap-2 flex-wrap'>
                                    <h3 className='text-sm font-semibold text-gray-900'>
                                        Not ready yet
                                    </h3>
                                    <Badge variant='warning'>
                                        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                                    </Badge>
                                </div>
                                {/* Every item is a control. The ids travel with the
                                    issue so the click can select the offending section
                                    and put the caret in the offending field, rather
                                    than leaving the author to find it. */}
                                <ul className='mt-3 flex flex-col gap-1'>
                                    {issues.map((issue, index) => (
                                        <li key={index}>
                                            <button
                                                type='button'
                                                onClick={() => onGoToIssue(issue.subjectId, issue.sectionId, issue.field)}
                                                className='w-full text-left flex gap-2 px-2 py-1.5 -mx-2 rounded-lg
                                                    text-sm text-gray-700 hover:bg-white hover:text-gray-900
                                                    focus:outline-none focus:ring-2 focus:ring-primary-500
                                                    transition-colors'
                                            >
                                                <span aria-hidden='true' className='text-warning-600 leading-5'>&bull;</span>
                                                <span className='flex-1'>{issue.message}</span>
                                                <span aria-hidden='true' className='text-gray-300 leading-5'>&rsaquo;</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <p className='mt-3 text-xs text-gray-500'>
                                    Nothing has been saved or published. Your work stays here until
                                    every item above is cleared.
                                </p>
                            </>}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PaperReviewPanel;
