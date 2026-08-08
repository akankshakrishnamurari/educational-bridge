import React from 'react';
import QuestionsReceiver from "../../apis/QuestionsReceiver"
import { connect } from 'react-redux';
import {updateSubmittedQuestionDetails} from '../../store/actions/solgressAction';
import SingleSelectMCQQuestion from './largeScreen/SingleSelectMCQQuestion';
import { currentURLHost } from './../../constants/hostConfig';
import EducationalBridgeHeader from '../../js/header/EducationalBridgeHeader';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import ClipLoader from "react-spinners/ClipLoader";
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import MathContent from '../../components/common/MathContent';
import DifficultyMeter from '../../components/common/DifficultyMeter';
import StatTile from '../../components/common/StatTile';
import { typography, layout } from '../../constants/designTokens';
import { accent } from '../../constants/accents';
import { parseQuestionTaxonomy, subjectAccent } from '../../utils/questionTaxonomy';
import { formatDuration, formatCount } from '../../utils/formatDuration';

// Result page shown after an answer is submitted.
//
// WHAT THIS PAGE USED TO BE
// -------------------------
// A thin wrapper around the admin-portal component SingleSelectMCQPreview, plus a
// <JSONPretty> dump of the raw analytics object under the heading "Your Analysis
// for this Question". Three problems:
//
//   1. It never actually told you whether you got the question right. The only
//      signal was a tinted option row, which you had to find and interpret. The
//      single most important fact on a results page was not stated.
//   2. The analytics were real and genuinely useful -- attempts, correct attempts,
//      best time, whether the first attempt was correct -- but rendered as JSON.
//   3. Its container used `pr-4 sm:pr-6 lg:pr-8`: right padding only, no left, so
//      the content sat visibly off-centre against every other page.
//
// It still uses SingleSelectMCQQuestion for the question body (which handles review
// mode and the real per-option response distribution), but no longer routes through
// SingleSelectMCQPreview -- that component remains in use by four authoring
// surfaces and carries their conventions, not a learner's.
//
// DATA NOTE
// ---------
// The submission endpoint builds `questionData` with the single-argument
// QuestionResponseAdapter overload, which stubs every tagName to the literal
// string "DEFAULT". So the classification (subject/chapter/topic/difficulty) is
// NOT available on this payload. It is fetched separately, and the header simply
// does not render if that request fails -- knowing which topic you just got wrong
// is the difference between actionable and merely informative.

const mapDispatchToProps = dispatch => ({
    updateSubmittedQuestionDetails: (payload) => dispatch(updateSubmittedQuestionDetails(payload))
})

const mapStateToProps = state => {
    return {
        submittedQuestionDetails: state.solgressReducer.submittedQuestionDetails
    };
}

class GeneralQuestionSubmissionView extends React.Component {

    constructor(props) {
        super(props)
        this.state = { questionWithTags: null };
    }

    doNothing = () => {}

    componentDidMount() {
        this.initializeSubmittedQuestionDetails();
    }

    initializeSubmittedQuestionDetails = () => {
        const search = window.location.search;
        const responseId = new URLSearchParams(search).get('response_id');
        if(responseId === null || responseId === undefined) {
            return;
        }
        QuestionsReceiver.getSubmittedQuestion(responseId).then(submittedQuestionData=>{
            if (submittedQuestionData == null || submittedQuestionData.data == null) {
                return;
            }
            this.props.updateSubmittedQuestionDetails(submittedQuestionData.data);
            this.loadClassification(submittedQuestionData.data);
        });
    }

    /**
     * Second, optional request purely for the tag taxonomy. Failure is silent: the
     * classification header is omitted and the rest of the page is unaffected.
     */
    loadClassification = (submitted) => {
        const questionId = submitted && submitted.questionData ? submitted.questionData.id : null;
        if (questionId == null || this.state.questionWithTags != null) {
            return;
        }
        QuestionsReceiver.getQuestion(questionId).then((questionData) => {
            if (questionData != null && questionData.data != null) {
                this.setState({ questionWithTags: questionData.data });
            }
        }).catch(() => {});
    }

    isCorrect = () => {
        const details = this.props.submittedQuestionDetails;
        const selected = details.selectedOptionId;
        const correct = details.questionData ? details.questionData.correctOptionId : null;
        if (selected == null || correct == null) {
            return null;
        }
        return String(selected) === String(correct);
    }

    getCorrectOptionLetter = () => {
        const details = this.props.submittedQuestionDetails;
        const options = (details.questionData && details.questionData.options) || [];
        const index = options.findIndex(
            (option) => String(option.id) === String(details.questionData.correctOptionId)
        );
        return index === -1 ? null : String.fromCharCode(65 + index);
    }

    /**
     * Verdict. The whole point of the page, so it leads, and it states the outcome
     * in words rather than relying on colour alone.
     */
    getVerdictJSX = () => {
        const correct = this.isCorrect();
        const letter = this.getCorrectOptionLetter();
        if (correct === null) {
            return <div />;
        }
        const surface = correct
            ? 'bg-success-50 border-success-200'
            : 'bg-danger-50 border-danger-200';
        const iconWrap = correct ? 'bg-success-600' : 'bg-danger-600';
        const heading = correct ? 'text-success-800' : 'text-danger-800';
        return <div className={'flex items-center gap-4 rounded-xl border p-4 md:p-5 ' + surface}>
            <span className={'shrink-0 w-11 h-11 rounded-full flex items-center justify-center ' + iconWrap} aria-hidden="true">
                {correct
                    ? <svg className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.7a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                    : <svg className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 01-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z" clipRule="evenodd" /></svg>
                }
            </span>
            <div className="min-w-0">
                <h1 className={'text-xl md:text-2xl font-bold tracking-tight ' + heading}>
                    {correct ? 'Correct' : 'Not quite'}
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                    {correct
                        ? 'Well done. The full working is below.'
                        : (letter
                            ? <>The correct answer was option <span className="font-semibold text-gray-900">{letter}</span>. Read the working below before moving on.</>
                            : 'Read the working below before moving on.')
                    }
                </p>
            </div>
        </div>;
    }

    /**
     * Classification strip, from the separately-fetched question. Mirrors the
     * header on the solve page so the two read as the same product.
     */
    getClassificationJSX = () => {
        const question = this.state.questionWithTags;
        if (question == null) {
            return <div />;
        }
        const taxonomy = parseQuestionTaxonomy(question.tags);
        if (taxonomy.breadcrumb.length === 0 && taxonomy.flags.length === 0 && !taxonomy.difficulty) {
            return <div />;
        }
        const tone = accent(subjectAccent(taxonomy.subject));
        return <div className="flex items-start justify-between gap-4 flex-wrap mt-5">
            <div className="min-w-0">
                <nav className="flex items-center gap-1.5 flex-wrap text-sm" aria-label="Question classification">
                    {taxonomy.subject &&
                        <span className={'font-semibold ' + tone.text}>{taxonomy.subject}</span>
                    }
                    {taxonomy.chapter &&
                        <>
                            <span className="text-gray-300" aria-hidden="true">/</span>
                            <span className="text-gray-600">{taxonomy.chapter}</span>
                        </>
                    }
                    {taxonomy.topic && taxonomy.topic !== taxonomy.chapter &&
                        <>
                            <span className="text-gray-300" aria-hidden="true">/</span>
                            <span className="text-gray-600">{taxonomy.topic}</span>
                        </>
                    }
                </nav>
                <div className="flex items-center gap-3 flex-wrap mt-2">
                    {(taxonomy.exam || taxonomy.year) &&
                        <span className="text-xs text-gray-500">
                            {[taxonomy.exam, taxonomy.year].filter(Boolean).join('  ·  ')}
                        </span>
                    }
                    {taxonomy.flags.map((flag) => (
                        <Badge key={flag} variant="warning">{flag}</Badge>
                    ))}
                </div>
            </div>
            <DifficultyMeter
                level={taxonomy.difficultyLevel}
                label={taxonomy.difficulty}
                className="shrink-0 mt-1"
            />
        </div>;
    }

    /**
     * Worked solution, expanded by default. On the solve page it is collapsed so it
     * cannot spoil the question; here the answer has already been submitted, so
     * hiding the explanation behind a click serves nobody.
     */
    getSolutionJSX = () => {
        const details = this.props.submittedQuestionDetails;
        const description = details.questionData ? details.questionData.answerDescription : null;
        const hasDescription = typeof description === 'string' && description.trim().length > 0;
        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2 + ' mb-3'}>Worked solution</h2>
            {hasDescription
                ? <MathContent html={description} className="text-sm md:text-base text-gray-700" />
                : <p className="text-sm text-gray-500">
                    No worked solution has been added for this question yet.
                </p>
            }
        </section>;
    }

    /**
     * Personal record. Only rendered when the payload actually carries analytics --
     * the backend attaches them only for a submission with a user email, so an
     * anonymous attempt legitimately has none, and inventing zeroes would be a lie.
     */
    getUserStatsJSX = () => {
        const analytics = this.props.submittedQuestionDetails.userQuestionAnalyticsResponse;
        if (analytics == null) {
            if (UserDetailsUtil.getUserGoogleId() != null) {
                return <div />;
            }
            return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <h2 className={typography.h2}>Track your progress</h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    Sign in to keep a record of your attempts, accuracy and timing on every question.
                </p>
            </section>;
        }

        const attempts = analytics.numberOfAttempts;
        const correctAttempts = analytics.correctAttempts;
        const accuracy = (typeof attempts === 'number' && attempts > 0 && typeof correctAttempts === 'number')
            ? Math.round((correctAttempts * 100) / attempts)
            : null;
        // Lombok generates isFirstAttemptCorrect(), which Jackson serialises as
        // `firstAttemptCorrect`. Both spellings are read so the tile survives either.
        const firstAttemptCorrect = (analytics.firstAttemptCorrect !== undefined)
            ? analytics.firstAttemptCorrect
            : analytics.isFirstAttemptCorrect;
        const bestTime = formatDuration(analytics.bestCorrectAttemptTime);
        const totalTime = formatDuration(analytics.totalTimeSpent);

        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2 + ' mb-3'}>Your record on this question</h2>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {typeof attempts === 'number' &&
                    <StatTile label="Attempts" value={formatCount(attempts)} />
                }
                {accuracy !== null &&
                    <StatTile
                        label="Accuracy"
                        value={accuracy + '%'}
                        hint={formatCount(correctAttempts) + ' of ' + formatCount(attempts) + ' correct'}
                    />
                }
                {bestTime &&
                    <StatTile label="Best time" value={bestTime} hint="fastest correct attempt" />
                }
                {typeof firstAttemptCorrect === 'boolean' &&
                    <StatTile
                        label="First try"
                        value={firstAttemptCorrect ? 'Correct' : 'Missed'}
                        tone={firstAttemptCorrect ? 'success' : 'danger'}
                    />
                }
                {!bestTime && totalTime &&
                    <StatTile label="Time spent" value={totalTime} hint="across all attempts" />
                }
            </dl>
        </section>;
    }

    /**
     * Cohort figures. Average is derived rather than served: the payload gives a
     * total across all respondents and a respondent count, so the mean is computed
     * here and omitted entirely when the count is zero.
     */
    getCommunityStatsJSX = () => {
        const details = this.props.submittedQuestionDetails;
        const totalResponses = details.totalResponses;
        const totalTimeSpent = details.totalTimeSpent;
        if (typeof totalResponses !== 'number' || totalResponses <= 0) {
            return <div />;
        }
        const averageSeconds = (typeof totalTimeSpent === 'number' && totalResponses > 0)
            ? totalTimeSpent / totalResponses
            : null;
        const averageTime = formatDuration(averageSeconds);
        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2 + ' mb-3'}>How everyone else did</h2>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <StatTile label="Attempts" value={formatCount(totalResponses)} hint="by all learners" />
                {averageTime &&
                    <StatTile label="Average time" value={averageTime} hint="per attempt" />
                }
            </dl>
            <p className="mt-3 text-xs text-gray-400">
                The bars beside each option above show how answers were distributed.
            </p>
        </section>;
    }

    redirectToNextRecommendedQuestion = () => {
        this.setState({ isLoadingNext: true });
        QuestionsReceiver.getNextRecommendedQuestion(
            this.props.submittedQuestionDetails.questionData.id,
            UserDetailsUtil.getUserGoogleId()
        ).then(questionsData=>{
            const questionId = questionsData && questionsData.data ? questionsData.data.questionId : null;
            if (questionId == null) {
                this.setState({ isLoadingNext: false });
                return;
            }
            window.location.href = currentURLHost + "question/view?question_id=" + questionId;
        }).catch(() => {
            this.setState({ isLoadingNext: false });
        });
    }

    /**
     * Pinned continuation bar. A results page that ends in a dead stop breaks the
     * practice loop; the next action should always be one tap away.
     */
    getActionBarJSX = () => {
        return <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                <a
                    href={currentURLHost + 'questions'}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                >
                    Back to questions
                </a>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={this.redirectToNextRecommendedQuestion}
                    disabled={this.state.isLoadingNext === true}
                >
                    {this.state.isLoadingNext === true ? 'Finding one…' : 'Next question'}
                    <span aria-hidden="true">&rarr;</span>
                </Button>
            </div>
        </div>;
    }

    render() {
        const details = this.props.submittedQuestionDetails;
        // `submittedQuestionDetails` is a persisted redux slice, so on a second
        // submission it still holds the PREVIOUS result while the new one is in
        // flight. Rendering that would briefly show the wrong verdict -- telling
        // someone they were correct when they were not is the worst possible
        // failure on this page -- so the loader is held until the response in the
        // store matches the one named in the URL.
        const requestedResponseId = typeof window === 'undefined'
            ? null
            : new URLSearchParams(window.location.search).get('response_id');
        const isStale = details !== undefined
            && requestedResponseId != null
            && details.responseId != null
            && String(details.responseId) !== String(requestedResponseId);
        if(details === undefined || details.questionData == null || isStale){
            return  <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>
        }
        return (
            <div className="bg-gray-50 min-h-screen pb-24">
                <EducationalBridgeHeader/>
                {/* Symmetric gutters via the shared reading token. This page
                    previously applied padding-right only, so its content column sat
                    off-centre relative to every other page. */}
                <div className={layout.reading + " py-6 md:py-8"}>
                <div className="min-w-0">
                    {this.getVerdictJSX()}
                    {this.getClassificationJSX()}

                    <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                        <SingleSelectMCQQuestion
                            questionDetails = {details.questionData}
                            selectedOptionId = {details.selectedOptionId}
                            updateQuestionAnswer = {this.doNothing}
                            needCompletePreview = {true}
                            optionIdToOptionResponseCount = {details.optionIdToOptionResponseCount}
                            totalResponseCount = {details.totalResponses}
                            submittedQuestionDetails = {details}
                            options = {details.questionData ? details.questionData.options : []}
                        />
                    </section>

                    {this.getSolutionJSX()}
                    {this.getUserStatsJSX()}
                    {this.getCommunityStatsJSX()}
                </div>
                </div>
                {this.getActionBarJSX()}
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(GeneralQuestionSubmissionView);
