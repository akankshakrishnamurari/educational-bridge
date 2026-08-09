import React from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { controlClasses } from '../common/FormField';
import { AiOutlinePlus, AiOutlineClose, AiOutlineUp, AiOutlineDown } from 'react-icons/ai';

// The blueprint half of the paper builder: the whole paper's shape, editable in place.
//
// WHAT THIS REPLACES
// ------------------
// Three separate wizard steps. Subject names were configured on one, section names
// and counts on a second, marking schemes on a third, and the question totals were
// only visible on a fourth (the review step). So the author could never see the
// paper they were assembling — to check whether Physics had as many questions as
// Chemistry meant stepping back and forth and holding numbers in their head.
//
// Everything is on one surface now, and the counts are derived from the sections
// themselves rather than tracked in a parallel array that could disagree with them.

const SectionRow = ({
    section,
    isActive,
    canRemove,
    onSelect,
    onRename,
    onMarksChange,
    onRemove,
    onMove,
    canMoveUp,
    canMoveDown,
}) => {
    // Mutually exclusive, because Tailwind's `important: true` means two competing
    // border/background utilities in one string resolve by stylesheet order.
    const tone = isActive
        ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-200'
        : 'border-gray-200 bg-white hover:border-gray-300';

    return (
        <li className={'rounded-lg border transition-colors ' + tone}>
            {/* Selecting the section is what decides where picked questions go, so it
                is the row's primary action and occupies the whole header. */}
            <button
                type='button'
                className='w-full flex items-center gap-2 px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-t-lg'
                onClick={() => onSelect(section.id)}
                aria-current={isActive ? 'true' : undefined}
            >
                <span className='flex-1 min-w-0 text-sm font-semibold text-gray-800 truncate'>
                    {section.name.trim() === '' ? 'Unnamed section' : section.name}
                </span>
                <Badge variant={section.questionIds.length === 0 ? 'gray' : 'neutral'}>
                    {section.questionIds.length} {section.questionIds.length === 1 ? 'question' : 'questions'}
                </Badge>
            </button>

            <div className='px-3 pb-3 pt-1 flex flex-col gap-2'>
                <input
                    type='text'
                    className={controlClasses(section.name.trim() === '')}
                    value={section.name}
                    placeholder='Section name, e.g. Mechanics'
                    onChange={(event) => onRename(section.id, event.target.value)}
                    aria-label='Section name'
                />
                <div className='flex items-end gap-2'>
                    <label className='flex-1 min-w-0'>
                        <span className='block text-xs text-gray-500 mb-1'>Correct</span>
                        <input
                            type='number'
                            className={controlClasses(false) + ' tabular-nums'}
                            value={section.positiveMarks}
                            onChange={(event) => onMarksChange(section.id, 'positiveMarks', event.target.value)}
                        />
                    </label>
                    <label className='flex-1 min-w-0'>
                        <span className='block text-xs text-gray-500 mb-1'>Wrong</span>
                        <input
                            type='number'
                            className={controlClasses(false) + ' tabular-nums'}
                            value={section.negativeMarks}
                            onChange={(event) => onMarksChange(section.id, 'negativeMarks', event.target.value)}
                        />
                    </label>
                    <div className='flex items-center gap-1 pb-0.5'>
                        {/* Reordering is buttons rather than drag and drop on purpose:
                            it is reachable from the keyboard and needs no pointer
                            precision, and the order of sections in a paper changes
                            rarely enough that a drag affordance is not worth it. */}
                        <button
                            type='button'
                            className='p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500'
                            onClick={() => onMove(section.id, -1)}
                            disabled={!canMoveUp}
                            aria-label='Move section up'
                        >
                            <AiOutlineUp size={13} aria-hidden='true' />
                        </button>
                        <button
                            type='button'
                            className='p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500'
                            onClick={() => onMove(section.id, 1)}
                            disabled={!canMoveDown}
                            aria-label='Move section down'
                        >
                            <AiOutlineDown size={13} aria-hidden='true' />
                        </button>
                        <button
                            type='button'
                            className='p-1.5 rounded text-gray-400 hover:text-danger-700 hover:bg-danger-50 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-danger-500'
                            onClick={() => onRemove(section.id)}
                            disabled={!canRemove}
                            aria-label={canRemove ? 'Remove section' : 'A subject must keep at least one section'}
                            title={canRemove ? 'Remove section' : 'A subject must keep at least one section'}
                        >
                            <AiOutlineClose size={13} aria-hidden='true' />
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );
};

const PaperBlueprintPanel = ({
    blueprint,
    onSelectSection,
    onRenameSubject,
    onRenameSection,
    onSectionMarksChange,
    onAddSubject,
    onRemoveSubject,
    onAddSection,
    onRemoveSection,
    onMoveSection,
}) => (
    <section className='flex flex-col gap-4' aria-label='Paper blueprint'>
        {blueprint.subjects.map((subject, subjectIndex) => {
            const subjectQuestionCount = subject.sections.reduce(
                (sum, section) => sum + section.questionIds.length, 0);
            return (
                <div key={subject.id} className='rounded-xl border border-gray-200 bg-gray-50/60 p-3'>
                    <div className='flex items-center gap-2 mb-2'>
                        <input
                            type='text'
                            className={controlClasses(subject.name.trim() === '') + ' font-semibold'}
                            value={subject.name}
                            placeholder={'Subject ' + (subjectIndex + 1) + ' name, e.g. Physics'}
                            onChange={(event) => onRenameSubject(subject.id, event.target.value)}
                            aria-label={'Subject ' + (subjectIndex + 1) + ' name'}
                        />
                        <button
                            type='button'
                            className='shrink-0 p-2 rounded text-gray-400 hover:text-danger-700 hover:bg-danger-50 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-danger-500'
                            onClick={() => onRemoveSubject(subject.id)}
                            disabled={blueprint.subjects.length <= 1}
                            aria-label={blueprint.subjects.length > 1 ? 'Remove subject' : 'A paper must keep at least one subject'}
                            title={blueprint.subjects.length > 1 ? 'Remove subject' : 'A paper must keep at least one subject'}
                        >
                            <AiOutlineClose size={14} aria-hidden='true' />
                        </button>
                    </div>

                    <p className='text-xs text-gray-500 mb-2 tabular-nums'>
                        {subject.sections.length} {subject.sections.length === 1 ? 'section' : 'sections'}
                        {' · '}{subjectQuestionCount} {subjectQuestionCount === 1 ? 'question' : 'questions'}
                    </p>

                    <ul className='flex flex-col gap-2'>
                        {subject.sections.map((section, sectionIndex) => (
                            <SectionRow
                                key={section.id}
                                section={section}
                                isActive={section.id === blueprint.activeSectionId}
                                canRemove={subject.sections.length > 1}
                                onSelect={onSelectSection}
                                onRename={onRenameSection}
                                onMarksChange={onSectionMarksChange}
                                onRemove={onRemoveSection}
                                onMove={onMoveSection}
                                canMoveUp={sectionIndex > 0}
                                canMoveDown={sectionIndex < subject.sections.length - 1}
                            />
                        ))}
                    </ul>

                    <Button
                        variant='secondary'
                        size='sm'
                        className='mt-2 w-full'
                        onClick={() => onAddSection(subject.id)}
                    >
                        <AiOutlinePlus size={12} aria-hidden='true' />
                        Add section
                    </Button>
                </div>
            );
        })}

        <Button variant='ghost' size='sm' onClick={onAddSubject}>
            <AiOutlinePlus size={12} aria-hidden='true' />
            Add subject
        </Button>
    </section>
);

export default PaperBlueprintPanel;
