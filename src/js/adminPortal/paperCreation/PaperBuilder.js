import React from 'react';
import { connect } from 'react-redux';
import { updateNewPaperDetails } from '../../../store/actions/solgressAction';
import QuestionsReceiver from '../../../apis/QuestionsReceiver';
import { UserDetailsUtil } from '../../../utils/UserDetailsUtil';
import PaperAPIsConnector from '../../../apis/PaperAPIsConnector';
import EducationalBridgeHeader from '../../header/EducationalBridgeHeader';
import Footer from '../../../components/common/Footer';
import PageCard from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import FormField, { controlClasses } from '../../../components/common/FormField';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import PaperBlueprintPanel from '../../../components/paperCreation/PaperBlueprintPanel';
import QuestionPicker from '../../../components/paperCreation/QuestionPicker';
import NewPaperTagComponent from './NewPaperTagComponent';
import notify from '../../../utils/notify';
import { typography, layout } from '../../../constants/designTokens';
import { currentURLHost } from '../../../constants/hostConfig';
import { dataOf } from '../../../apis/unwrap';
import { DEFAULT_PAGE_SIZE, coercePageSize } from '../../../constants/pagination';
import {
    createBlueprint,
    addSubject,
    removeSubject,
    addSection,
    removeSection,
    moveSection,
    renameSubject,
    renameSection,
    setSectionMarks,
    setPaperField,
    selectSection,
    toggleQuestion,
    activeSection,
    findSubject,
    sectionHoldingQuestion,
    totalQuestionCount,
    totalMarks,
    allSections,
    validationProblems,
    isPublishable,
    toCreatePaperRequest,
} from './paperBlueprint';

/**
 * Paper builder.
 *
 * WHY THIS REPLACED THE WIZARD
 * ----------------------------
 * The previous builder (NewPaperPortal, 943 lines) split the job across three
 * wizard steps: test settings, then question selection, then review and publish.
 * Assembling a paper is not a linear task, so the split worked against the author:
 *
 *  - The question picker did not show which section it was filling. That lived in
 *    the state set on a previous step. Picking twenty questions into the wrong
 *    section was easy and only became apparent on the review step.
 *  - Nothing showed the paper's shape while it was being built. Checking that
 *    Physics had as many questions as Chemistry meant stepping back and forth.
 *  - Validation ran on step transitions, one toast at a time, so an author fixed a
 *    problem, advanced, and met the next one.
 *  - Renaming a subject or section after picking questions destroyed the selection
 *    outright, because questions were filed under names. See paperBlueprint.js.
 *
 * Everything is on one screen now: the blueprint on the left, the bank on the
 * right, a summary that recomputes as you go, and a standing list of what is still
 * outstanding. The step order is whatever the author wants.
 *
 * State lives in redux under `newPaperDetails` as before, so the tag picker keeps
 * working unchanged, but its SHAPE is the normalised blueprint rather than six
 * parallel arrays.
 */

const mapDispatchToProps = (dispatch) => ({
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload)),
});

const mapStateToProps = (state) => ({
    newPaperDetails: state.solgressReducer.newPaperDetails,
});

const SEARCH_DEBOUNCE_MS = 300;

class PaperBuilder extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            questions: [],
            pageCount: 0,
            currentPage: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            searchText: '',
            isLoadingQuestions: true,
            isConfirmingPublish: false,
            isPublishing: false,
        };
    }

    componentDidMount() {
        // A blueprint of the old parallel-array shape may still be sitting in redux
        // from a previous session in the same tab. `subjects` is the marker of the
        // new shape; anything without it is replaced rather than migrated, because
        // the old shape's selections were unreliable by construction.
        if (this.blueprint() === null) {
            this.props.updateNewPaperDetails(createBlueprint());
        }
        this.loadQuestions(0, this.state.pageSize, '');
    }

    componentWillUnmount() {
        if (this.searchTimer != null) {
            clearTimeout(this.searchTimer);
        }
    }

    /** The blueprint, or null when redux holds nothing usable yet. */
    blueprint = () => {
        const details = this.props.newPaperDetails;
        if (details == null || !Array.isArray(details.subjects)) {
            return null;
        }
        return details;
    }

    update = (next) => this.props.updateNewPaperDetails(next);

    // ---- question bank -----------------------------------------------------

    loadQuestions = (pageIndex, pageSize, searchText) => {
        this.setState({ isLoadingQuestions: true });
        QuestionsReceiver.getAllFilteredQuestions(searchText, [], [], pageIndex, pageSize)
            .then((response) => {
                const page = dataOf(response, { questions: [], pageCount: 0 });
                this.setState({
                    questions: Array.isArray(page.questions) ? page.questions : [],
                    pageCount: page.pageCount || 0,
                    currentPage: pageIndex + 1,
                    pageSize,
                    isLoadingQuestions: false,
                });
            });
    }

    onSearchChange = (searchText) => {
        this.setState({ searchText });
        if (this.searchTimer != null) {
            clearTimeout(this.searchTimer);
        }
        // Debounced for the same reason the question list is: one request per
        // keystroke both wastes the backend and lets a slower earlier response
        // overwrite a newer one.
        this.searchTimer = setTimeout(
            () => this.loadQuestions(0, this.state.pageSize, searchText),
            SEARCH_DEBOUNCE_MS
        );
    }

    onPageChange = (event, page) => this.loadQuestions(page - 1, this.state.pageSize, this.state.searchText);

    onPageSizeChange = (event) =>
        this.loadQuestions(0, coercePageSize(event.target.value), this.state.searchText);

    // ---- blueprint edits ---------------------------------------------------

    onToggleQuestion = (questionId) => {
        const blueprint = this.blueprint();
        if (blueprint === null || blueprint.activeSectionId === null) {
            notify.error('Choose a section before adding questions to it.');
            return;
        }
        this.update(toggleQuestion(blueprint, blueprint.activeSectionId, questionId));
    }

    onRemoveSubject = (subjectId) => {
        const blueprint = this.blueprint();
        const subject = findSubject(blueprint, subjectId);
        const count = subject === null
            ? 0
            : subject.sections.reduce((sum, section) => sum + section.questionIds.length, 0);
        // Confirmation only when there is something to lose. Asking every time trains
        // people to click through it.
        if (count > 0 && !window.confirm(
            'Remove this subject and the ' + count + ' question' + (count === 1 ? '' : 's') + ' selected in it?')) {
            return;
        }
        this.update(removeSubject(blueprint, subjectId));
    }

    onRemoveSection = (sectionId) => {
        const blueprint = this.blueprint();
        const section = allSections(blueprint).filter((candidate) => candidate.id === sectionId)[0];
        const count = section ? section.questionIds.length : 0;
        if (count > 0 && !window.confirm(
            'Remove this section and the ' + count + ' question' + (count === 1 ? '' : 's') + ' in it?')) {
            return;
        }
        this.update(removeSection(blueprint, sectionId));
    }

    // ---- publishing --------------------------------------------------------

    publish = async () => {
        const blueprint = this.blueprint();
        this.setState({ isPublishing: true, isConfirmingPublish: false });
        try {
            const request = toCreatePaperRequest(blueprint, UserDetailsUtil.getUserGoogleId());
            const response = await PaperAPIsConnector.createNewPaper(request);
            // The API layer signals failure by resolving with null rather than
            // rejecting, so this has to be checked explicitly. The previous builder
            // reported success unconditionally and redirected away from the work.
            if (response == null) {
                notify.error('Could not publish the paper. Nothing has been lost, try again.');
                this.setState({ isPublishing: false });
                return;
            }
            notify.success('Paper published.');
            window.location.href = currentURLHost + 'papers';
        } catch (error) {
            notify.error('Could not publish the paper. Nothing has been lost, try again.');
            this.setState({ isPublishing: false });
        }
    }

    // ---- render ------------------------------------------------------------

    getSummaryJSX = (blueprint) => {
        const questionCount = totalQuestionCount(blueprint);
        const marks = totalMarks(blueprint);
        const minutes = Number(blueprint.allottedPaperTime);
        const sectionCount = allSections(blueprint).length;
        // Only shown when both sides are real numbers. A "0.0 marks per minute"
        // readout on an empty paper is noise, and the project's conventions are
        // explicit about not displaying a figure that is not meaningful.
        const pace = (marks > 0 && Number.isFinite(minutes) && minutes > 0)
            ? (marks / minutes).toFixed(2)
            : null;
        const cell = 'flex flex-col';
        const value = 'text-xl font-bold text-gray-900 tabular-nums leading-tight';
        const label = 'text-xs text-gray-500';
        return (
            <div className='flex items-center gap-6 flex-wrap'>
                <div className={cell}>
                    <span className={value}>{questionCount}</span>
                    <span className={label}>{questionCount === 1 ? 'question' : 'questions'}</span>
                </div>
                <div className={cell}>
                    <span className={value}>{marks}</span>
                    <span className={label}>marks available</span>
                </div>
                <div className={cell}>
                    <span className={value}>{sectionCount}</span>
                    <span className={label}>{sectionCount === 1 ? 'section' : 'sections'}</span>
                </div>
                {pace !== null &&
                    <div className={cell}>
                        <span className={value}>{pace}</span>
                        <span className={label}>marks per minute</span>
                    </div>}
            </div>
        );
    }

    getProblemsJSX = (problems) => {
        if (problems.length === 0) {
            return (
                <PageCard padding='p-4' className='border-success-200 bg-success-50'>
                    <p className='text-sm font-semibold text-success-700'>
                        This paper is ready to publish.
                    </p>
                </PageCard>
            );
        }
        return (
            <PageCard padding='p-4'>
                <h2 className='text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2'>
                    Before publishing
                    <Badge variant='warning' className='ml-2'>{problems.length}</Badge>
                </h2>
                {/* The whole list, always. The wizard raised these one at a time on
                    step transitions, so the author never knew how much was left. */}
                <ul className='flex flex-col gap-1 list-disc pl-5'>
                    {problems.map((problem) => (
                        <li key={problem} className='text-sm text-gray-600'>{problem}</li>
                    ))}
                </ul>
            </PageCard>
        );
    }

    render() {
        if (typeof window === 'undefined') {
            return <div />;
        }
        const blueprint = this.blueprint();
        if (blueprint === null) {
            return (
                <div className='bg-gray-50 min-h-screen'>
                    <EducationalBridgeHeader />
                    <div className={layout.container + ' py-16'} />
                </div>
            );
        }
        const problems = validationProblems(blueprint);
        const section = activeSection(blueprint);
        const subject = section === null ? null : findSubject(blueprint, blueprint.activeSubjectId);
        const targetLabel = section === null
            ? null
            : ((subject && subject.name.trim() !== '' ? subject.name.trim() + ' · ' : '')
                + (section.name.trim() === '' ? 'Unnamed section' : section.name));

        return (
            <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader />
                <div className={layout.container + ' py-8'}>
                    <div className='flex items-end justify-between gap-4 flex-wrap'>
                        <div>
                            <h1 className={typography.h1}>Build a paper</h1>
                            <p className='mt-1 text-sm text-gray-500 max-w-2xl'>
                                Lay out the sections, set what each one is worth, then fill them from the
                                question bank. Nothing is published until you say so.
                            </p>
                        </div>
                        <Button
                            variant='primary'
                            size='lg'
                            disabled={!isPublishable(blueprint) || this.state.isPublishing}
                            onClick={() => this.setState({ isConfirmingPublish: true })}
                        >
                            {this.state.isPublishing ? 'Publishing…' : 'Publish paper'}
                        </Button>
                    </div>

                    {/* Sticky so the totals stay visible while scrolling the bank.
                        Watching the marks total move as questions are added is the
                        fastest way to tell whether a paper is the right size. */}
                    <PageCard padding='p-4' className='mt-5 sticky top-16 z-20'>
                        {this.getSummaryJSX(blueprint)}
                    </PageCard>

                    <PageCard className='mt-4'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <FormField label='Paper name' required className='md:col-span-2'>
                                {(fieldProps) => (
                                    <input
                                        {...fieldProps}
                                        type='text'
                                        placeholder='e.g. JEE Main 2026 Mock Test 1'
                                        value={blueprint.paperName}
                                        onChange={(event) => this.update(
                                            setPaperField(blueprint, 'paperName', event.target.value))}
                                    />
                                )}
                            </FormField>
                            <FormField label='Duration (minutes)' required>
                                {(fieldProps) => (
                                    <input
                                        {...fieldProps}
                                        type='number'
                                        min='1'
                                        className={controlClasses(false) + ' tabular-nums'}
                                        value={blueprint.allottedPaperTime}
                                        onChange={(event) => this.update(
                                            setPaperField(blueprint, 'allottedPaperTime', event.target.value))}
                                    />
                                )}
                            </FormField>
                        </div>
                        <div className='mt-4'>
                            <NewPaperTagComponent />
                        </div>
                    </PageCard>

                    <div className='mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start'>
                        <div className='xl:col-span-5 min-w-0'>
                            <PageCard>
                                <h2 className={typography.h3 + ' mb-3'}>Blueprint</h2>
                                <PaperBlueprintPanel
                                    blueprint={blueprint}
                                    onSelectSection={(id) => this.update(selectSection(blueprint, id))}
                                    onRenameSubject={(id, name) => this.update(renameSubject(blueprint, id, name))}
                                    onRenameSection={(id, name) => this.update(renameSection(blueprint, id, name))}
                                    onSectionMarksChange={(id, field, value) => this.update(
                                        setSectionMarks(blueprint, id, field, value))}
                                    onAddSubject={() => this.update(addSubject(blueprint))}
                                    onRemoveSubject={this.onRemoveSubject}
                                    onAddSection={(subjectId) => this.update(addSection(blueprint, subjectId))}
                                    onRemoveSection={this.onRemoveSection}
                                    onMoveSection={(id, offset) => this.update(moveSection(blueprint, id, offset))}
                                />
                            </PageCard>
                            <div className='mt-4'>
                                {this.getProblemsJSX(problems)}
                            </div>
                        </div>

                        <div className='xl:col-span-7 min-w-0'>
                            <PageCard>
                                <QuestionPicker
                                    questions={this.state.questions}
                                    isLoading={this.state.isLoadingQuestions}
                                    searchText={this.state.searchText}
                                    onSearchChange={this.onSearchChange}
                                    targetSectionLabel={targetLabel}
                                    selectedIdsInSection={section === null ? [] : section.questionIds}
                                    holdingSectionLabelFor={(questionId) => {
                                        const holder = sectionHoldingQuestion(blueprint, questionId);
                                        if (holder === null || holder.id === blueprint.activeSectionId) {
                                            return null;
                                        }
                                        return holder.name.trim() === '' ? 'another section' : holder.name;
                                    }}
                                    onToggleQuestion={this.onToggleQuestion}
                                    pageCount={this.state.pageCount}
                                    currentPage={this.state.currentPage}
                                    pageSize={this.state.pageSize}
                                    onPageChange={this.onPageChange}
                                    onPageSizeChange={this.onPageSizeChange}
                                    firstIndex={(this.state.currentPage - 1) * this.state.pageSize + 1}
                                />
                            </PageCard>
                        </div>
                    </div>
                </div>

                {/* Rendered conditionally rather than passed an `isOpen` prop:
                    ConfirmDialog locks body scroll in componentDidMount, so it has to
                    be mounted only while it is actually showing. */}
                {this.state.isConfirmingPublish &&
                    <ConfirmDialog
                        title='Publish this paper?'
                        confirmLabel='Publish'
                        isBusy={this.state.isPublishing}
                        onConfirm={this.publish}
                        onCancel={() => this.setState({ isConfirmingPublish: false })}
                    >
                        <p className='text-sm text-gray-600'>
                            <span className='font-semibold text-gray-900'>{blueprint.paperName.trim()}</span> will
                            go live with {totalQuestionCount(blueprint)} questions across{' '}
                            {allSections(blueprint).length} sections, worth {totalMarks(blueprint)} marks in{' '}
                            {blueprint.allottedPaperTime} minutes.
                        </p>
                    </ConfirmDialog>}

                <Footer />
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PaperBuilder);
