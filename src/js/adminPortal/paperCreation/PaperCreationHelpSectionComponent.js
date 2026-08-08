import React from 'react';
import { connect } from 'react-redux'
import {updateNewPaperDetails, savePaperDetails, saveQuestionSet} from "../../../store/actions/solgressAction";
import {AiOutlineEdit}  from "react-icons/ai";
import { BsEyeFill } from "react-icons/bs";
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import { dataOf } from '../../../apis/unwrap';

// Fallback shape for the paged list endpoint, used when a request fails so
// render paths that read `.questions` / `.pageCount` keep working.
const EMPTY_PAGE = { questions: [], pageCount: 0, pageSize: 10 };

const mapDispatchToProps = dispatch => ({
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload)),
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload)),
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload))
})


const mapStateToProps = state => {
    return {
        newPaperDetails: state.solgressReducer.newPaperDetails,
        paperDetails: state.solgressReducer.paperDetails,
        questionSet: state.solgressReducer.questionSet
    };
}

/**
 * Running summary of the paper being built, beside the builder.
 *
 * FOUR THINGS WERE WRONG
 * ----------------------
 * 1. The multi-section branch returned `<div>yo boy</div>`. Any author who turned on
 *    more than one section per subject — which the builder offers as a checkbox —
 *    got the literal text "yo boy" where the paper summary should be.
 *
 * 2. The duration was the hardcoded string "100 minutes" in both branches, ignoring
 *    `allottedPaperTime`, which is the value the author sets in the form directly
 *    above and the value actually submitted. The summary asserted a number that was
 *    not the paper's.
 *
 * 3. The per-subject rows read `subjectWiseSectionNegativeMarks[0][0]` inside a loop
 *    over subjects, so every subject displayed the FIRST subject's negative marks.
 *
 * 4. The edit and preview controls were `<div onClick>` with unlabelled icons: not
 *    focusable, and announced as nothing.
 *
 * Rows also had no `key`, and `border-1` is not a Tailwind class so the header's
 * intended hairline never rendered.
 */
class PaperCreationHelpSectionComponent extends React.Component {

    moveCurrentSectionToQuestionSelection = (subjectIndex) => {
        let payload = {...this.props.newPaperDetails};
        payload.currentTab = 'QUESTION_SELECTION';
        payload.currentSubjectIndex = subjectIndex;
        this.props.updateNewPaperDetails(payload);
        QuestionsReceiver.getAllFilteredQuestions(
            (this.props.questionSet || {}).searchedKey || '', [], []
        ).then(questionsData=>{
            let questionPayload = {...this.props.questionSet};
            questionPayload.questions = this.normalise(dataOf(questionsData, EMPTY_PAGE), subjectIndex);
            this.props.saveQuestionSet(questionPayload);
        });
    }

    moveCurrentSectionToQuestionSelectionSelectedQuestions = (subjectIndex) => {
        let payload = {...this.props.newPaperDetails};
        payload.currentTab = 'QUESTION_SELECTION_SELECTED_QUESTION';
        payload.currentSubjectIndex = subjectIndex;
        QuestionsReceiver.getQuestionsByQuestionIds(this.props.newPaperDetails.selectedQuestionIds).then(questionsData=>{
            let questionPayload = {...this.props.questionSet};
            questionPayload.questions = this.normalise(dataOf(questionsData, EMPTY_PAGE), subjectIndex);
            this.props.saveQuestionSet(questionPayload);
            this.props.updateNewPaperDetails(payload);
        });
    }

    normalise = (questionSet, subjectIndex) => {
        let selectedQuestionIds = [...this.props.newPaperDetails.selectedQuestionIds];
        let subjectName = this.props.newPaperDetails.subjectNames[subjectIndex];
        let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[subjectIndex][this.props.newPaperDetails.currentSectionIndex];
        let questionIdsSelectedForSubjectWiseSection = (this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions === undefined
                                                        || this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName] === undefined
                                                        || this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName] === undefined
                                                    )? []
                                                    : this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName];
        let blockedQuestionIds = selectedQuestionIds.filter(function(selectedQuestionId) {
            return !questionIdsSelectedForSubjectWiseSection.includes(selectedQuestionId);
        });
        const filtered = (questionSet.questions || []).filter(function(question){
            return !blockedQuestionIds.includes(question.id);
        });
        return {"questions": filtered, "pageCount": questionSet.pageCount};
    }

    /** Configured duration, not a constant. Empty while being retyped. */
    getAllottedTimeLabel = () => {
        const minutes = Number(this.props.newPaperDetails.allottedPaperTime);
        return Number.isFinite(minutes) && minutes > 0 ? minutes + ' min' : 'not set';
    }

    marksAt = (table, subjectIndex, sectionIndex, fallback) => {
        const row = Array.isArray(table) ? table[subjectIndex] : undefined;
        const raw = Array.isArray(row) ? row[sectionIndex] : undefined;
        const value = Number(raw);
        return Number.isFinite(value) ? value : fallback;
    }

    getSectionCount = (subjectIndex) => {
        const counts = this.props.newPaperDetails.subjectWiseNumberOfSections;
        const count = Array.isArray(counts) ? Number(counts[subjectIndex]) : 1;
        return Number.isFinite(count) && count > 0 ? count : 1;
    }

    getSelectedCountFor = (subjectName, sectionName) => {
        const bySubject = this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions;
        if (bySubject === undefined || bySubject[subjectName] === undefined) {
            return 0;
        }
        const ids = bySubject[subjectName][sectionName];
        return Array.isArray(ids) ? ids.length : 0;
    }

    getJumpButtonsJSX = (subjectIndex) => {
        return <span className='inline-flex items-center gap-1'>
            <button
                type="button"
                className='p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
                onClick={()=> this.moveCurrentSectionToQuestionSelection(subjectIndex)}
                aria-label="Choose questions for this section"
                title="Choose questions"
            >
                <AiOutlineEdit className='w-4 h-4' aria-hidden="true"/>
            </button>
            <button
                type="button"
                className='p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
                onClick={()=> this.moveCurrentSectionToQuestionSelectionSelectedQuestions(subjectIndex)}
                aria-label="Review the questions already chosen"
                title="Review chosen questions"
            >
                <BsEyeFill className='w-4 h-4' aria-hidden="true"/>
            </button>
        </span>;
    }

    getMarksJSX = (positive, negative) => {
        return <span className='inline-flex items-center gap-1 tabular-nums'>
            <span className='px-1.5 py-0.5 rounded bg-success-100 text-success-700 text-xs font-semibold'>
                {positive > 0 ? '+' + positive : positive}
            </span>
            <span className='px-1.5 py-0.5 rounded bg-danger-100 text-danger-700 text-xs font-semibold'>
                {negative}
            </span>
        </span>;
    }

    /**
     * One row per section, which is the level the marking scheme is actually
     * configured at. The previous version had a separate hand-written branch for
     * "one subject, one section" and "many subjects, one section", and no branch at
     * all for many sections — hence the placeholder. A single loop covers all three.
     */
    getSectionRowsJSX = () => {
        const details = this.props.newPaperDetails;
        const rows = [];
        let maximumPaperMarks = 0;
        const subjectCount = Number(details.numberOfSubjects) || 0;
        const showSubjectName = subjectCount > 1;

        for (let subjectIndex = 0; subjectIndex < subjectCount; subjectIndex += 1) {
            const subjectName = details.subjectNames[subjectIndex];
            const sectionCount = this.getSectionCount(subjectIndex);
            for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex += 1) {
                const sectionNames = details.subjectWiseSectionNames[subjectIndex] || [];
                const sectionName = sectionNames[sectionIndex];
                const plannedCount = this.marksAt(details.subjectWiseSectionWiseNumberOfQuestions, subjectIndex, sectionIndex, 0);
                const positive = this.marksAt(details.subjectWiseSectionPositiveMarks, subjectIndex, sectionIndex, 0);
                // Read at [subjectIndex][sectionIndex]. Was [0][0], so every row
                // repeated the first subject's negative marking.
                const negative = this.marksAt(details.subjectWiseSectionNegativeMarks, subjectIndex, sectionIndex, 0);
                const selectedCount = this.getSelectedCountFor(subjectName, sectionName);
                maximumPaperMarks += plannedCount * positive;
                const isComplete = plannedCount > 0 && selectedCount >= plannedCount;
                rows.push(
                    <div
                        key={subjectIndex + ':' + sectionIndex}
                        className='flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors'
                    >
                        <span className='min-w-0'>
                            <span className='block font-medium text-gray-900 truncate'>
                                {showSubjectName && sectionCount > 1
                                    ? subjectName + ' \u00b7 ' + sectionName
                                    : (showSubjectName ? subjectName : sectionName)}
                            </span>
                            <span className={'block text-xs tabular-nums ' + (isComplete ? 'text-success-700' : 'text-gray-500')}>
                                {selectedCount} of {plannedCount} questions
                            </span>
                        </span>
                        <span className='shrink-0 flex items-center gap-2'>
                            {this.getMarksJSX(positive, negative)}
                            {this.getJumpButtonsJSX(subjectIndex)}
                        </span>
                    </div>
                );
            }
        }
        return { rows, maximumPaperMarks };
    }

    render() {
        const details = this.props.newPaperDetails;
        if (details === undefined || !Array.isArray(details.subjectNames)) {
            return <div/>;
        }
        const { rows, maximumPaperMarks } = this.getSectionRowsJSX();
        const selectedTotal = Array.isArray(details.selectedQuestionIds) ? details.selectedQuestionIds.length : 0;
        const plannedTotal = Number(details.numberOfQuestions) || 0;
        return <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
            <div className='px-3 py-2 bg-gray-50 border-b border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-900'>Paper overview</h3>
            </div>
            <dl className='px-3 py-2.5 border-b border-gray-100 grid grid-cols-3 gap-2 text-center'>
                <div>
                    <dt className='text-xs text-gray-500'>Questions</dt>
                    <dd className='text-sm font-semibold text-gray-900 tabular-nums'>{selectedTotal}/{plannedTotal}</dd>
                </div>
                <div>
                    <dt className='text-xs text-gray-500'>Time</dt>
                    <dd className='text-sm font-semibold text-gray-900 tabular-nums'>{this.getAllottedTimeLabel()}</dd>
                </div>
                <div>
                    <dt className='text-xs text-gray-500'>Max marks</dt>
                    <dd className='text-sm font-semibold text-gray-900 tabular-nums'>{maximumPaperMarks}</dd>
                </div>
            </dl>
            <div className='divide-y divide-gray-100'>
                {rows}
            </div>
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperCreationHelpSectionComponent);
