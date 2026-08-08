import React from 'react';
import '../../App.css';
import { connect } from 'react-redux';
import {savePaperDetails} from '../../store/actions/solgressAction'
import QuestionBody from '../questionSet/largeScreen/QuestionBody';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import { PaperViewHelperUtil } from '../../utils/PaperViewHelperUtil';
import {currentURLHost} from '../../constants/hostConfig';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import ClipLoader from "react-spinners/ClipLoader";
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import QuestionPalette from '../../components/paperSet/QuestionPalette';
import ExamTimer from '../../components/paperSet/ExamTimer';
import StatTile from '../../components/common/StatTile';
import { typography, layout } from '../../constants/designTokens';
import { dataOf } from '../../apis/unwrap';
import ErrorState from '../../components/common/ErrorState';

// Fallback shape for the paged list endpoint, used when a request fails so
// render paths that read `.questions` / `.pageCount` keep working.


// Timed paper surface.
//
// This is the highest-stakes screen on the platform: it is the only one where a
// mistimed render or an accidental click costs the learner something they cannot
// undo. The redesign is therefore about certainty rather than decoration -- always
// knowing how long is left, what has been answered, and what submitting will do.
//
// FIVE THINGS THAT WERE WRONG
// ---------------------------
//  1. The countdown target was recomputed from Date.now() on every render, and
//     this component re-renders on every option click and navigation. See
//     ExamTimer for the detail. Now derived once as an absolute instant.
//  2. Nothing happened when the clock reached zero. The paper stayed open.
//  3. Submit was a single click straight to an irreversible navigation, with no
//     summary of what was being submitted.
//  4. The palette had three states and no legend, so "not seen" and "seen but
//     unanswered" looked identical.
//  5. Every autosave posted `this.props.paperDetails` -- the state BEFORE the
//     change -- and only then dispatched the new payload, so the server was
//     permanently one action behind. A reload lost the most recent answer.

const mapDispatchToProps = dispatch => ({
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload))
})

const mapStateToProps = state => {
    return {
        paperDetails: state.solgressReducer.paperDetails
    };
}

class PaperView extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isConfirmingSubmit: false, isSubmitting: false, loadFailed: false };
    }

    componentDidMount() {
        if (this.props.paperDetails === undefined) {
            this.initializePaperDetails();
        }
    }

    getUrlParams = () => {
        const search = typeof window === 'undefined' ? '' : window.location.search;
        const params = new URLSearchParams(search);
        return {
            paperId: params.get('paper_id'),
            paperInstanceId: params.get('paper_instance_id'),
        };
    }

    getUserEmail = () => {
        const userDetails = window.sessionStorage.userDetails;
        if(userDetails != null && userDetails !== "null" && userDetails !== undefined) {
            return JSON.parse(userDetails).email;
        }
        return null;
    }

    initializePaperDetails = () => {
        const { paperId, paperInstanceId } = this.getUrlParams();
        let payload = {
            "currentQuestionNumber" : 1,
            "questionStartTime" : Date.now(),
            "questionWiseTimeSpent" : {},
            "paper": {},
            "candidateResponses": {},
            "questionsMarkedForReviews": []
        };
        PaperAPIsConnector.getPaperDetails(paperId, paperInstanceId).then( paperData => {
            // Every field below used to be read straight off `paperData.data`. A
            // failed request resolves with null, so opening a paper while the API was
            // unreachable threw a TypeError here and left the page on its spinner
            // forever — during a timed exam, with no indication of what went wrong.
            const paper = dataOf(paperData);
            if (paper === null) {
                this.setState({ loadFailed: true });
                return;
            }
            payload.paper = paper;
            payload.questions = PaperViewHelperUtil.normalise(paper);

            // `paperSubmissionResponse` is absent on a paper that has never been
            // opened, so it is read defensively rather than assumed.
            const submission = paper.paperSubmissionResponse || {};
            payload.paperStartTime = submission.paperStartTime;
            const isNewPaper = (submission.currentQuestionNumber == null);
            if(!isNewPaper) {
                payload.currentQuestionNumber = submission.currentQuestionNumber;
                payload.questionStartTime = submission.questionStartTime == null ? Date.now() : submission.questionStartTime;
                payload.questionWiseTimeSpent = submission.questionWiseTimeSpent == null ? {} : submission.questionWiseTimeSpent;
                payload.questionsMarkedForReviews = [...(submission.questionsMarkedForReviews || [])];
                payload.candidateResponses = this.buildCandidateResponse(paper);
            }
            this.props.savePaperDetails(payload);
        });
    }

    buildCandidateResponse = (paperData) => {
        let candidateResponses = {};
        // Both levels are optional: a paper opened but not yet answered has no
        // submitted responses, and the nested `questionData` is absent on rows the
        // adapter could not resolve.
        const submitted = (paperData && paperData.paperSubmissionResponse
            && paperData.paperSubmissionResponse.questionSubmittedResponses) || [];
        submitted.forEach ( questionResponse => {
            if (questionResponse && questionResponse.questionData && questionResponse.questionData.id) {
                candidateResponses[questionResponse.questionData.id] = questionResponse.selectedOptionId;
            }
        });
        return candidateResponses;
    }

    /**
     * Persist and dispatch. The autosave now sends the payload being applied,
     * not the one being replaced -- previously it posted this.props.paperDetails
     * before dispatching, so the stored draft always lagged one interaction and a
     * refresh silently discarded the learner's most recent answer.
     */
    savePaperDetails = (payload) => {
        const { paperId, paperInstanceId } = this.getUrlParams();
        PaperAPIsConnector.submitPaper(paperId, paperInstanceId, this.getUserEmail(), true, payload).then();
        this.props.savePaperDetails(payload);
    }

    moveToPreviousQuestion = () => {
        this.changeCurrentQuestionNumber(parseInt(this.props.paperDetails.currentQuestionNumber)-1);
    }

    moveToNextQuestion = () => {
        this.changeCurrentQuestionNumber(parseInt(this.props.paperDetails.currentQuestionNumber)+1);
    }

    clearQuestionResponse = () => {
        let payload = {...this.props.paperDetails};
        let candidateResponses = {...payload.candidateResponses};
        let questionId = this.getCurrentQuestion().id;
        delete candidateResponses[questionId];
        payload.candidateResponses = candidateResponses;
        this.savePaperDetails(payload);
    }

    changeCurrentQuestionNumber = (newQuestionNumber) => {
        const total = this.props.paperDetails.questions.length;
        // Clamped rather than notified. Reaching the last question is not an error
        // worth interrupting someone mid-exam with a toast; the Next control is
        // simply disabled at the boundary.
        if (newQuestionNumber < 1 || newQuestionNumber > total) {
            return;
        }
        let payload = {...this.props.paperDetails};
        let currentQuestionId = this.props.paperDetails.questions[payload.currentQuestionNumber-1].id;
        let questionWiseTimeSpent = {...payload.questionWiseTimeSpent};
        let timeSpentOnQuestion = 
            (questionWiseTimeSpent.hasOwnProperty(currentQuestionId)?parseInt(questionWiseTimeSpent[currentQuestionId]):0)
            + (Date.now()-payload.questionStartTime);
        questionWiseTimeSpent[currentQuestionId] = timeSpentOnQuestion;
        payload.currentQuestionNumber = newQuestionNumber;
        payload.questionWiseTimeSpent = questionWiseTimeSpent;
        payload.questionStartTime = Date.now();
        this.savePaperDetails(payload);
    }

    updateQuestionAnswer = (questionId, optionId) => {
        let payload = {...this.props.paperDetails};     
        let candidateResponses = {...payload.candidateResponses};
        candidateResponses[questionId] = optionId;
        payload.candidateResponses = candidateResponses;
        this.savePaperDetails(payload);
    }

    getCurrentQuestion = () => {
        const details = this.props.paperDetails;
        return details.questions[details.currentQuestionNumber - 1];
    }

    isCurrentMarked = () => {
        const details = this.props.paperDetails;
        return (details.questionsMarkedForReviews || []).includes(this.getCurrentQuestion().id);
    }

    /**
     * Single toggle rather than separate mark/unmark handlers that each no-op in
     * one direction.
     */
    toggleMarkForReview = () => {
        let payload = {...this.props.paperDetails};
        const questionId = this.getCurrentQuestion().id;
        let marked = [...(payload.questionsMarkedForReviews || [])];
        if (marked.includes(questionId)) {
            marked = marked.filter((item) => item !== questionId);
        } else {
            marked.push(questionId);
        }
        payload.questionsMarkedForReviews = marked;
        this.savePaperDetails(payload);
    }

    getAnsweredCount = () => {
        const details = this.props.paperDetails;
        return Object.keys(details.candidateResponses || {}).filter(
            (key) => details.candidateResponses[key] !== undefined && details.candidateResponses[key] !== null
        ).length;
    }

    submitPaper = () => {
        this.setState({ isSubmitting: true });
        const { paperId, paperInstanceId } = this.getUrlParams();
        PaperAPIsConnector.submitPaper(paperId, paperInstanceId, this.getUserEmail(), false, this.props.paperDetails)
            .then(() => {
                window.location.href = currentURLHost + "paper/submission/view?paper_submission_response_id=" + paperInstanceId;
            })
            .catch(() => {
                // Navigate regardless: the submission may well have landed, and
                // leaving the learner on a spinner after a final submit is worse
                // than sending them to the report where the truth is visible.
                window.location.href = currentURLHost + "paper/submission/view?paper_submission_response_id=" + paperInstanceId;
            });
    }

    /**
     * Fires when the countdown reaches zero. A timed paper that stays open past
     * its own deadline is not a timed paper.
     */
    handleTimeExpired = () => {
        if (this.state.isSubmitting) {
            return;
        }
        this.submitPaper();
    }

    getExamHeaderJSX = () => {
        const details = this.props.paperDetails;
        const paper = details.paper || {};
        const allottedMinutes = Number(paper.allotted_paper_time) || 0;
        const totalMillis = allottedMinutes * 60 * 1000;
        // Absolute end instant. Constant for the lifetime of the attempt, which is
        // what makes the countdown stable.
        const endTime = (Number(details.paperStartTime) || Date.now()) + totalMillis;
        const total = details.questions.length;
        const answered = this.getAnsweredCount();
        const progress = total > 0 ? Math.round((answered * 100) / total) : 0;

        return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                    <h1 className={typography.h2 + ' truncate'}>
                        {paper.paper_name || 'Practice paper'}
                    </h1>
                    <p className="mt-1 text-xs text-gray-500 tabular-nums">
                        {total} questions
                        {allottedMinutes > 0 ? '  ·  ' + allottedMinutes + ' minutes' : ''}
                    </p>
                </div>
                <ExamTimer
                    endTime={endTime}
                    totalMillis={totalMillis}
                    onExpire={this.handleTimeExpired}
                />
            </div>
            {/* Progress is stated as a bar as well as a count: under time pressure
                a proportion is read faster than a fraction. */}
            <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-600">Progress</span>
                    <span className="text-gray-500 tabular-nums">{answered} / {total} answered</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary-600 transition-all"
                        style={{ width: progress + '%' }}
                        role="progressbar"
                        aria-valuenow={answered}
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-label="Questions answered"
                    />
                </div>
            </div>
        </div>;
    }

    getQuestionMetaJSX = () => {
        const details = this.props.paperDetails;
        const question = this.getCurrentQuestion();
        const context = [question.subjectName, question.sectionName].filter(Boolean).join('  ·  ');
        return <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-baseline gap-2.5">
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                    Question {details.currentQuestionNumber}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">
                    of {details.questions.length}
                </span>
                {context &&
                    <span className="text-xs text-gray-500">{context}</span>
                }
            </div>
            <button
                type="button"
                onClick={this.toggleMarkForReview}
                className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                    this.isCurrentMarked()
                        ? 'bg-warning-100 text-warning-800 hover:bg-warning-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ].join(' ')}
                aria-pressed={this.isCurrentMarked()}
            >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M5 3a2 2 0 00-2 2v12l7-4 7 4V5a2 2 0 00-2-2H5z" />
                </svg>
                {this.isCurrentMarked() ? 'Marked for review' : 'Mark for review'}
            </button>
        </div>;
    }

    getNavigationBarJSX = () => {
        const details = this.props.paperDetails;
        const isFirst = details.currentQuestionNumber <= 1;
        const isLast = details.currentQuestionNumber >= details.questions.length;
        const hasResponse = details.candidateResponses[this.getCurrentQuestion().id] !== undefined;
        return <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
            <div className={layout.container + ' py-3 flex items-center justify-between gap-3'}>
                <Button variant="secondary" onClick={this.moveToPreviousQuestion} disabled={isFirst}>
                    <span aria-hidden="true">&larr;</span>
                    <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={this.clearQuestionResponse} disabled={!hasResponse}>
                        Clear
                    </Button>
                    <Button variant="danger" onClick={() => this.setState({ isConfirmingSubmit: true })}>
                        Submit paper
                    </Button>
                </div>
                <Button variant="primary" onClick={this.moveToNextQuestion} disabled={isLast}>
                    <span className="hidden sm:inline">Next</span>
                    <span aria-hidden="true">&rarr;</span>
                </Button>
            </div>
        </div>;
    }

    /**
     * Submit confirmation. States plainly what is unfinished, because the moment
     * before an irreversible action is the only moment that information is useful.
     */
    getSubmitDialogJSX = () => {
        if (!this.state.isConfirmingSubmit) {
            return null;
        }
        const details = this.props.paperDetails;
        const total = details.questions.length;
        const answered = this.getAnsweredCount();
        const unanswered = total - answered;
        const marked = (details.questionsMarkedForReviews || []).length;
        return <ConfirmDialog
            title="Submit this paper?"
            description="You will not be able to change your answers afterwards."
            confirmLabel="Submit paper"
            confirmVariant="danger"
            cancelLabel="Keep working"
            isBusy={this.state.isSubmitting}
            onCancel={() => this.setState({ isConfirmingSubmit: false })}
            onConfirm={this.submitPaper}
        >
            <dl className="grid grid-cols-3 gap-2">
                <StatTile label="Answered" value={answered} />
                <StatTile
                    label="Unanswered"
                    value={unanswered}
                    tone={unanswered > 0 ? 'danger' : 'neutral'}
                />
                <StatTile label="Marked" value={marked} />
            </dl>
        </ConfirmDialog>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if (this.state.loadFailed === true) {
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className={layout.container + ' py-10'}>
                    <ErrorState
                        title="We couldn&rsquo;t open this paper"
                        description="Your answers so far are saved on the server. Reload to continue where you left off."
                        onRetry={() => { this.setState({ loadFailed: false }); this.initializePaperDetails(); }}
                    />
                </div>
            </div>;
        }
        if(this.props.paperDetails === undefined || this.props.paperDetails.questions === undefined) {
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    {/* `size` must be a number: react-spinners multiplies it, so the
                        string "60" produced NaN-based CSS. */}
                    <ClipLoader color="#2563EB" size={60}/>
                </div>
            </div>;
        }
        const details = this.props.paperDetails;
        const currentQuestionDetails = this.getCurrentQuestion();
        const selectedOptionId = details.candidateResponses[currentQuestionDetails.id];
        return (
            <div className="bg-gray-50 min-h-screen pb-24">
                <EducationalBridgeHeader/>
                {/* No ad rails on this page: an exam is a focus surface and the
                    palette already occupies the right-hand column. */}
                <div className={layout.container + ' py-6'}>
                    <div className="flex flex-col lg:flex-row gap-5 items-start">
                        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4">
                            {this.getExamHeaderJSX()}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                                {this.getQuestionMetaJSX()}
                                <div className="mt-4">
                                    <QuestionBody
                                        questionDetails = {currentQuestionDetails}
                                        selectedOptionId = {selectedOptionId}
                                        updateQuestionAnswer = {this.updateQuestionAnswer}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Sticky so the navigator stays reachable on a long
                            question instead of scrolling off the top. */}
                        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <QuestionPalette
                                    questions={details.questions}
                                    candidateResponses={details.candidateResponses}
                                    questionsMarkedForReviews={details.questionsMarkedForReviews}
                                    questionWiseTimeSpent={details.questionWiseTimeSpent}
                                    currentQuestionNumber={details.currentQuestionNumber}
                                    onSelect={this.changeCurrentQuestionNumber}
                                />
                            </div>
                        </aside>
                    </div>
                </div>
                {this.getNavigationBarJSX()}
                {this.getSubmitDialogJSX()}
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperView);
