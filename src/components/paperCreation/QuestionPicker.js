import React from 'react';
import MathContent from '../common/MathContent';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import PagingSection from '../../js/adminPortal/platformCapabilities/PagingSection';
import { parseQuestionTaxonomy } from '../../utils/questionTaxonomy';
import { controlClasses } from '../common/FormField';
import ClipLoader from 'react-spinners/ClipLoader';

// The question picker half of the paper builder.
//
// WHAT THIS REPLACES
// ------------------
// QuestionSelectionConfigurationBox, a fixed 49rem-tall scrolling panel wrapping a
// MUI Table. Two things about it made assembling a paper harder than it needed to
// be:
//
//  - Nothing on screen said which section a click would fill. The target section
//    lived in the wizard's state and was only visible on a different step, so the
//    author had to remember it. Picking twenty questions into the wrong section and
//    discovering it later was easy to do and tedious to undo.
//
//  - A question already used elsewhere in the paper looked identical to an unused
//    one. Selecting it silently produced a paper containing the same question
//    twice, which is then scored twice.
//
// Both are now stated on the row itself.

const QuestionRow = ({
    question,
    index,
    isInThisSection,
    holdingSectionLabel,
    onToggle,
}) => {
    const taxonomy = parseQuestionTaxonomy(question.tags);
    const isElsewhere = !isInThisSection && holdingSectionLabel !== null;
    // Mutually exclusive strings rather than a merged list: Tailwind runs with
    // `important: true`, so two competing background utilities in one className are
    // resolved by stylesheet order, not by the order they are written.
    const rowTone = isInThisSection
        ? 'bg-primary-50 border-primary-200'
        : isElsewhere
            ? 'bg-warning-50 border-warning-200'
            : 'bg-white border-gray-200 hover:border-gray-300';

    return (
        <li className={'flex items-start gap-3 p-3 rounded-lg border transition-colors ' + rowTone}>
            <label className='flex items-start gap-3 flex-1 min-w-0 cursor-pointer'>
                <input
                    type='checkbox'
                    className='mt-1 w-4 h-4 accent-primary-600 shrink-0'
                    checked={isInThisSection}
                    onChange={() => onToggle(question.id)}
                    aria-label={isInThisSection ? 'Remove question from this section' : 'Add question to this section'}
                />
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap mb-1'>
                        <span className='text-xs font-semibold text-gray-400 tabular-nums'>#{index}</span>
                        {taxonomy.subject && <Badge variant='neutral'>{taxonomy.subject}</Badge>}
                        {taxonomy.chapter && <span className='text-xs text-gray-500'>{taxonomy.chapter}</span>}
                    </div>
                    {/* Question bodies are HTML with $$...$$ maths. MathContent
                        sanitises and typesets; the previous panel passed the raw
                        string through dangerouslySetInnerHTML with only an entity
                        decode, so maths showed as source. */}
                    <MathContent
                        html={question.description}
                        className='text-sm text-gray-800 line-clamp-3'
                    />
                    {isElsewhere &&
                        <p className='mt-1.5 text-xs font-medium text-warning-700'>
                            Already in {holdingSectionLabel}. Selecting it here moves it.
                        </p>
                    }
                </div>
            </label>
        </li>
    );
};

class QuestionPicker extends React.Component {

    render() {
        const {
            questions,
            isLoading,
            searchText,
            onSearchChange,
            targetSectionLabel,
            selectedIdsInSection,
            holdingSectionLabelFor,
            onToggleQuestion,
            pageCount,
            currentPage,
            pageSize,
            onPageChange,
            onPageSizeChange,
            firstIndex,
        } = this.props;

        return (
            <section className='flex flex-col min-w-0' aria-label='Choose questions'>
                {/* Which section a click fills, stated where the clicking happens.
                    This is the single most important thing on this half of the
                    screen and it previously was not shown at all. */}
                <div className='flex items-center gap-2 flex-wrap mb-3'>
                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Adding to</span>
                    {/* `neutral` is the accent-coloured variant in Badge; there is no
                        'primary' key, and an unknown variant silently falls back to
                        neutral anyway. */}
                    {targetSectionLabel !== null
                        ? <Badge variant='neutral'>{targetSectionLabel}</Badge>
                        : <span className='text-sm text-gray-500'>Pick a section on the left first</span>}
                </div>

                <input
                    type='search'
                    className={controlClasses(false) + ' mb-3'}
                    placeholder='Search the question bank'
                    value={searchText}
                    onChange={(event) => onSearchChange(event.target.value)}
                    aria-label='Search the question bank'
                />

                {isLoading
                    ? <div className='flex justify-center py-16'><ClipLoader color='#2563EB' size={36} /></div>
                    : questions.length === 0
                        ? <EmptyState
                            title='No questions match that search'
                            description='Try a shorter search term, or clear it to browse the whole bank.'
                        />
                        : <ul className='flex flex-col gap-2'>
                            {questions.map((question, offset) => (
                                <QuestionRow
                                    key={question.id}
                                    question={question}
                                    index={firstIndex + offset}
                                    isInThisSection={selectedIdsInSection.indexOf(question.id) !== -1}
                                    holdingSectionLabel={holdingSectionLabelFor(question.id)}
                                    onToggle={onToggleQuestion}
                                />
                            ))}
                        </ul>}

                {pageCount > 1 &&
                    <div className='pt-4'>
                        {/* `compact` because this pager sits in the builder's 7/12
                            column — roughly 650px at a 1280px viewport — not across
                            the full content width. Its own breakpoints read the
                            viewport, so without being told, it lays out the full
                            numbered pager plus the jump box in a column that cannot
                            hold them. */}
                        <PagingSection
                            compact
                            pageCount={pageCount}
                            currentPageNumber={currentPage}
                            currentPageSize={pageSize}
                            handlePageChange={onPageChange}
                            updatePageSize={onPageSizeChange}
                        />
                    </div>}
            </section>
        );
    }
}

export default QuestionPicker;
export { QuestionRow };
