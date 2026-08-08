import React from 'react';
import QuestionsReceiver from "../../apis/QuestionsReceiver"
import { connect } from 'react-redux';
import {updateSubmittedQuestionDetails} from '../../store/actions/solgressAction';
import QuestionBody from './largeScreen/QuestionBody';
import { isNumericalAnswerCorrect } from '../../components/questionSet/NumericalAnswerInput';
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
import { parseQuestionTaxonomy, subjectAccent, findTagByPrefix } from '../../utils/questionTaxonomy';
import { formatDuration, formatCount } from '../../utils/formatDuration';
import { listOf } from '../../apis/unwrap';
import ErrorState from '../../components/common/ErrorState';

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
// It still uses QuestionBody for the question body (which handles review
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
        this.state = { questionWithTags: null, loadFailed: false };
    }

    doNothing = () => {}

    componentDidMount() {
        this.initializeSubmittedQuestionDetails();
    }

    /**
     * Both failure paths used to return silently, which left the page on its loading
     * spinner permanently: a missing `response_id` and a failed request were
     * indistinguishable from a slow one. They now set `loadFailed` so the page can
     * say what happened and offer a retry.
     */
    initializeSubmittedQuestionDetails = () => {
        const search = window.location.search;
        const responseId = new URLSearchParams(search).get('response_id');
        if(responseId === null || responseId === undefined || responseId === '') {
            this.setState({ loadFailed: true });
            return;
        }
        this.setState({ loadFailed: false });
        QuestionsReceiver.getSubmittedQuestion(responseId).then(submittedQuestionData=>{
            if (submittedQuestionData == null || submittedQuestionData.data == null) {
                this.setState({ loadFailed: true });
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
        const question = details.questionData;
        const selected = details.selectedOptionId;
        if (selected == null || question == null) {
            return null;
        }
        // A NUMERICAL answer is a value, not an option id: "4" and "4.0" are the
        // same answer, so comparing the strings would report a correct answer as
        // wrong. Mirrors AnswerEvaluator on the backend.
        if (question.questionType === 'NUMERICAL') {
            if (question.correctAnswer == null) {
                return null;
            }
            return isNumericalAnswerCorrect(
                question.correctAnswer, selected, question.answerTolerance);
        }
        const correct = question.correctOptionId;
        if (correct == null) {
            return null;
        }
        return String(selected) === String(correct);
    }

    /**
     * How to name the correct answer in the verdict. An MCQ has an option letter;
     * a numerical question has only the value itself.
     */
    getCorrectOptionLetter = () => {
        const details = this.props.submittedQuestionDetails;
        const question = details.questionData;
        if (question == null || question.questionType === 'NUMERICAL') {
            return null;
        }
        const options = question.options || [];
        const index = options.findIndex(
            (option) => String(option.id) === String(question.correctOptionId)
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
        // A numerical question has no option letter, so name the value instead of
        // falling back to a verdict that never says what the answer was.
        const question = this.props.submittedQuestionDetails.questionData;
        const expectedValue = (question && question.questionType === 'NUMERICAL')
            ? question.correctAnswer
            : null;
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
                            : (expectedValue != null
                                ? <>The correct answer was <span className="font-semibold text-gray-900 tabular-nums">{expectedValue}</span>. Read the working below before moving on.</>
                                : 'Read the working below before moving on.'))
                    }
                </p>
            </div>
        </div>;
    }

    /**
     * Classification, from the separately-fetched question. Mirrors the solve page
     * sidebar so the two screens read as the same product.
     *
     * This was previously a full-width strip: a `justify-between` row with the
     * breadcrumb left and the difficulty meter pushed to the far right edge of the
     * page. At 1280px that put the subject and its difficulty about a screen apart,
     * and it could not survive being placed in a column. It is now a card that
     * stacks, so it works at any width.
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
        return <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className={typography.h2 + ' mb-3'}>This question</h2>
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
            {(taxonomy.exam || taxonomy.year) &&
                <p className="text-xs text-gray-500 mt-2">
                    {[taxonomy.exam, taxonomy.year].filter(Boolean).join('  ·  ')}
                </p>
            }
            {taxonomy.flags.length > 0 &&
                <div className="flex items-center gap-2 flex-wrap mt-2">
                    {taxonomy.flags.map((flag) => (
                        <Badge key={flag} variant="warning">{flag}</Badge>
                    ))}
                </div>
            }
            {taxonomy.difficulty &&
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <DifficultyMeter
                        level={taxonomy.difficultyLevel}
                        label={taxonomy.difficulty}
                    />
                </div>
            }
        </section>;
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
            return <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
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

        // `xl:grid-cols-2` is what stops four tiles being crushed into the 320px
        // sidebar. Below xl the sidebar is full width, so four across is right; from
        // xl up it becomes a narrow column and two across is the only fit.
        return <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className={typography.h2 + ' mb-3'}>Your record on this question</h2>
            <dl className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-2.5">
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
        return <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className={typography.h2 + ' mb-3'}>How everyone else did</h2>
            <dl className="grid grid-cols-2 gap-2.5">
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

    /**
     * Finds the next question to attempt.
     *
     * WHY THIS NO LONGER USES question/recommendation
     * -----------------------------------------------
     * That endpoint returns the question you are already on. Its service filters
     * candidates by the current question's COMPLETE tag set, and that set includes
     * its unique Year and Paper tags, so exactly one row can ever match: this one.
     * The button therefore reloaded the question that had just been answered, which
     * on a results page reads as the app being stuck.
     *
     * The classification request this page already makes carries real tags, so a
     * sibling is found the same way the solve page finds them: narrowest available
     * classification first, falling back to the question list.
     */
    redirectToNextRecommendedQuestion = () => {
        this.setState({ isLoadingNext: true });
        const details = this.props.submittedQuestionDetails;
        const currentId = details && details.questionData ? details.questionData.id : null;
        const tags = this.state.questionWithTags ? this.state.questionWithTags.tags : null;
        const tag = findTagByPrefix(tags, ['topic', 'chapter', 'chapter group', 'subject']);
        if (tag === null) {
            // No usable classification: the list is a better destination than a
            // button that appears to do nothing.
            window.location.href = currentURLHost + 'questions';
            return;
        }
        QuestionsReceiver.getAllFilteredQuestions('', [tag.id], [], 0, 12).then(response=>{
            const sibling = listOf(response, 'questions')
                .find((candidate) => candidate && candidate.id && candidate.id !== currentId);
            if (sibling == null) {
                window.location.href = currentURLHost + 'questions';
                return;
            }
            window.location.href = currentURLHost + "question/view?question_id=" + sibling.id;
        }).catch(() => {
            // Without this the button latched: `isLoadingNext` was set true up
            // front and only ever cleared by navigating away, so a rejected
            // request left "Finding one…" disabled forever with no way back. The
            // question list is a valid destination, so failing over to it keeps
            // the practice loop intact rather than stranding the page.
            this.setState({ isLoadingNext: false });
            window.location.href = currentURLHost + 'questions';
        });
    }

    /**
     * Pinned continuation bar. A results page that ends in a dead stop breaks the
     * practice loop; the next action should always be one tap away.
     *
     * WIDTH
     * -----
     * This used to hardcode `w-full max-w-3xl mx-auto px-4 sm:px-6`, a literal copy
     * of the `layout.reading` token. Two consequences:
     *
     *   1. Its edges did not line up with anything. The header spans
     *      `layout.container` (1280px), so "Back to questions" and "Next question"
     *      sat roughly 256px inboard of the wordmark and avatar directly above them
     *      on a wide display, and inboard of the solve page's own action bar, which
     *      uses the token. Solving a question and reading its result are one flow
     *      and the furniture jumped between the two screens.
     *   2. Being a copy rather than a reference, it could not track the page column
     *      it is supposed to sit under, so the two drifted apart silently.
     *
     * It now uses the same token as the page body and the header. `z-40` is
     * deliberate and stays: the header dropdowns are `z-50`, so an open account or
     * search menu correctly covers this bar rather than being clipped by it.
     *
     * The safe-area inset keeps the buttons above the iOS home indicator, which
     * otherwise overlaps a `fixed bottom-0` bar.
     */
    getActionBarJSX = () => {
        return <div
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className={layout.container + " py-3 flex items-center justify-between gap-4"}>
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
        if (this.state.loadFailed) {
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className={layout.reading + ' py-10'}>
                    <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
                        <ErrorState
                            title="We couldn't load this result"
                            description="The link may be incomplete, or the connection dropped on the way."
                            onRetry={this.initializeSubmittedQuestionDetails}
                        />
                    </div>
                </div>
            </div>;
        }
        if(details === undefined || details.questionData == null || isStale){
            return  <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size={60}/>
                </div>
            </div>
        }
        return (
            <div className="bg-gray-50 min-h-screen pb-24">
                <EducationalBridgeHeader/>
                {/* Symmetric gutters via the shared container token. Two earlier
                    problems, in order:
                      - it applied padding-right only, so the column sat visibly
                        off-centre against every other page;
                      - it was then capped at the 768px `reading` measure, which left
                        roughly 256px of dead gutter each side on a wide display and,
                        worse, shrank the page the moment you submitted an answer:
                        the solve page is `layout.container`, so the same question
                        was 1280px wide one click earlier.
                    Reading measure is preserved where it matters by keeping the
                    prose in the main column and moving the reference material into a
                    sidebar, exactly as the solve page does. */}
                <div className={layout.container + " py-6 md:py-8"}>
                <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
                    <div className="flex-1 min-w-0 w-full">
                        {this.getVerdictJSX()}

                        <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                            <QuestionBody
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
                    </div>

                    {/* Reference column: what this question was, how you have done
                        on it, and how everyone else did. All three are things you
                        consult while reading the solution rather than after it, so
                        they belong beside it, not stacked below. */}
                    <aside className="w-full xl:w-80 xl:shrink-0">
                        <div className="xl:sticky xl:top-20 flex flex-col gap-4">
                            {this.getClassificationJSX()}
                            {this.getUserStatsJSX()}
                            {this.getCommunityStatsJSX()}
                        </div>
                    </aside>
                </div>
                </div>
                {this.getActionBarJSX()}
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(GeneralQuestionSubmissionView);
