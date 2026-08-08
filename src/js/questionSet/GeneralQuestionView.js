import React from 'react';
import QuestionsReceiver from '../../apis/QuestionsReceiver';
import { connect } from 'react-redux';
import { updateQuestionDetails, updateQuestionComments } from '../../store/actions/solgressAction';
import SingleSelectMCQQuestion from '../questionSet/largeScreen/SingleSelectMCQQuestion';
import { Helmet } from 'react-helmet';
import { currentURLHost } from '../../constants/hostConfig';
import QuestionComment from './QuestionComment';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import Footer from '../../components/common/Footer';
import ClipLoader from 'react-spinners/ClipLoader';
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DifficultyMeter from '../../components/common/DifficultyMeter';
import ErrorState from '../../components/common/ErrorState';
import QuestionSidebar from '../../components/questionSet/QuestionSidebar';
import { layout } from '../../constants/designTokens';
import { accent } from '../../constants/accents';
import { parseQuestionTaxonomy, subjectAccent, findTagByPrefix } from '../../utils/questionTaxonomy';
import { dataOf, listOf } from '../../apis/unwrap';

const mapDispatchToProps = dispatch => ({
    updateQuestionDetails: (payload) => dispatch(updateQuestionDetails(payload)),
    updateQuestionComments: (payload) => dispatch(updateQuestionComments(payload))
})

const mapStateToProps = state => {
    return {
        questionDetails: state.solgressReducer.questionDetails,
        questionComments: state.solgressReducer.questionComments
    };
}

// How many sibling questions to offer in the sidebar.
const SIBLING_COUNT = 6;

// Keys that select an option. Index in the string is the option index, so "1"
// picks the first option and "a" picks the first as well.
const NUMBER_KEYS = '123456789';
const LETTER_KEYS = 'abcdefghi';

/**
 * True when the keystroke should be left alone because the user is typing.
 *
 * The discussion thread on this page contains text inputs and a rich-text
 * editor. Without this check, typing "a" in a comment would silently change the
 * selected answer.
 */
const isTypingTarget = (target) => {
    if (!target) {
        return false;
    }
    const tag = (target.tagName || '').toLowerCase();
    return tag === 'input'
        || tag === 'textarea'
        || tag === 'select'
        || target.isContentEditable === true;
};

class GeneralQuestionView extends React.Component {

    constructor(props) {
        super(props)
        this.updateQuestionAnswer = this.updateQuestionAnswer.bind(this);
        this.state = {
            // 'loading' until the first fetch settles, then 'ready', 'notFound' or
            // 'error'. Previously there was no failure state at all: a failed load
            // left the spinner up forever because the only condition checked was
            // whether questionDetails was undefined.
            status: 'loading',
            // Options the learner has ruled out. Session-local by design.
            eliminatedIds: [],
            elapsedSeconds: 0,
            siblings: [],
            isSubmitting: false,
        };
        this.timerId = null;
    }

    componentDidMount() {
        // Redux holds the previously-viewed question, so navigating from question A
        // to question B used to paint A's stem and options until B arrived. Clearing
        // first means the loading state is shown instead of stale content.
        this.props.updateQuestionDetails(undefined);
        this.props.updateQuestionComments([]);
        this.loadQuestion();
        this.timerId = setInterval(this.tick, 1000);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    tick = () => {
        this.setState((prev) => ({ elapsedSeconds: prev.elapsedSeconds + 1 }));
    }

    getQuestionIdFromUrl = () => {
        if (typeof window === 'undefined') {
            return null;
        }
        return new URLSearchParams(window.location.search).get('question_id');
    }

    /**
     * Fetch the question, its comments and its topic siblings.
     *
     * This used to be called from render() as well as componentDidMount, so it
     * re-fired on every single render pass for as long as the fetch was in flight.
     */
    loadQuestion = () => {
        const questionId = this.getQuestionIdFromUrl();
        if (questionId === null || questionId === undefined || questionId === '') {
            this.setState({ status: 'notFound' });
            return;
        }
        this.setState({ status: 'loading' });

        QuestionsReceiver.getQuestion(questionId).then((response) => {
            const data = dataOf(response);
            if (data === null) {
                this.setState({ status: 'error' });
                return;
            }
            // A question id that does not exist comes back as a 2xx with no usable
            // body rather than a 404, so the absence of an id is what identifies it.
            if (!data.id) {
                this.setState({ status: 'notFound' });
                return;
            }
            const questionDetails = { ...data };
            questionDetails.isCommentRefreshing = false;
            questionDetails.commentIndex = null;
            questionDetails.replyIndex = null;
            questionDetails.commentIndexToEdit = null;
            questionDetails.replyIndexToEdit = null;
            questionDetails.isVotingDetailsRefreshing = false;
            questionDetails.submittedByUser = false;
            questionDetails.commentIndexRefreshing = -1;
            questionDetails.commentReplyIndexRefreshing = -1;
            this.props.updateQuestionDetails(questionDetails);
            this.setState({ status: 'ready' });
            this.loadSiblings(data);
        });

        this.initializeQuestionComments();
    }

    /**
     * Other questions on the same topic.
     *
     * The API has a `question/recommendation` endpoint, but it filters on the
     * complete tag set of the current question — including Year and Paper, which
     * are unique to it — so the only row that can match is the question itself. It
     * always returns the question you are already on. Narrowing to a single
     * classification tag here produces genuine siblings instead.
     */
    loadSiblings = (question) => {
        const tag = findTagByPrefix(question.tags, ['topic', 'chapter', 'chapter group', 'subject']);
        if (tag === null) {
            return;
        }
        QuestionsReceiver.getAllFilteredQuestions('', [tag.id], [], 0, SIBLING_COUNT + 4)
            .then((response) => {
                const questions = listOf(response, 'questions');
                const siblings = questions
                    .filter((candidate) => candidate && candidate.id && candidate.id !== question.id)
                    .slice(0, SIBLING_COUNT);
                this.setState({ siblings, siblingContext: tag });
            });
    }

    initializeQuestionComments = () => {
        const questionId = this.getQuestionIdFromUrl();
        if (questionId === null || questionId === undefined) {
            return;
        }
        const userId = UserDetailsUtil.getUserGoogleId();
        QuestionsReceiver.getQuestionComment(questionId, userId).then((response) => {
            // `.data` was read unguarded here, so a failed comment fetch threw and
            // took down the whole page even though the question itself had loaded.
            this.props.updateQuestionComments(listOf(response));
        });
    }

    /**
     * Keyboard control.
     *
     * Selecting an answer with the number or letter keys and submitting with Enter
     * is how people actually work through question banks at volume; reaching for
     * the mouse for every option is the main thing that makes a web question bank
     * feel slower than paper.
     */
    handleKeyDown = (event) => {
        if (this.state.status !== 'ready') {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        if (isTypingTarget(event.target)) {
            return;
        }
        const details = this.props.questionDetails;
        if (details === undefined || details === null) {
            return;
        }
        const options = details.options || [];

        if (event.key === 'Enter') {
            if (details.selectedOptionId != null && !this.state.isSubmitting) {
                event.preventDefault();
                this.submitQuestionResponse();
            }
            return;
        }

        const key = String(event.key).toLowerCase();
        let index = NUMBER_KEYS.indexOf(key);
        if (index === -1) {
            index = LETTER_KEYS.indexOf(key);
        }
        if (index === -1 || index >= options.length) {
            return;
        }
        event.preventDefault();
        const optionId = options[index].id;
        // Shift turns the same key into "rule this one out", which keeps the whole
        // interaction on the home row.
        if (event.shiftKey) {
            this.toggleEliminate(optionId);
            return;
        }
        this.updateQuestionAnswer(details.id, optionId);
    }

    toggleEliminate = (optionId) => {
        this.setState((prev) => {
            const isEliminated = prev.eliminatedIds.some((id) => String(id) === String(optionId));
            return {
                eliminatedIds: isEliminated
                    ? prev.eliminatedIds.filter((id) => String(id) !== String(optionId))
                    : [...prev.eliminatedIds, optionId],
            };
        });
        // Ruling out the option that is currently chosen would otherwise leave a
        // struck-through answer selected and submittable.
        const details = this.props.questionDetails;
        if (details && String(details.selectedOptionId) === String(optionId)) {
            const payload = { ...details };
            payload.selectedOptionId = null;
            this.props.updateQuestionDetails(payload);
        }
    }

    updateQuestionAnswer = (questionId, optionId) => {
        let payload = { ...this.props.questionDetails };
        payload.selectedOptionId = optionId;
        this.props.updateQuestionDetails(payload);
        // Choosing an option that was previously ruled out un-rules it, rather than
        // leaving a selected option rendered as struck through.
        this.setState((prev) => ({
            eliminatedIds: prev.eliminatedIds.filter((id) => String(id) !== String(optionId)),
        }));
    }

    reloadQuestionVoting = () => {
        const userId = UserDetailsUtil.getUserGoogleId();
        QuestionsReceiver.getQuestionVoting(this.props.questionDetails.id, userId).then((response) => {
            const data = dataOf(response);
            let payload = { ...this.props.questionDetails };
            payload.isVotingDetailsRefreshing = false;
            if (data !== null) {
                payload.upvoteCount = data.upvoteCount;
                payload.downvoteCount = data.downvoteCount;
                payload.hasUserUpvoted = data.hasUserUpvoted;
                payload.hasUserDownvoted = data.hasUserDownvoted;
            }
            this.props.updateQuestionDetails(payload);
        });
    }

    reloadQuestionCommentVoting = () => {
        this.refreshComments();
    }

    upvoteQuestion = () => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if (userId == null) {
            notify.info('Please sign in to vote.');
            return;
        }
        let payload = { ...this.props.questionDetails };
        payload.isVotingDetailsRefreshing = true;
        this.props.updateQuestionDetails(payload);
        QuestionsReceiver.upvoteQuestion(this.props.questionDetails.id, userId).then(() => {
            this.reloadQuestionVoting();
        });
    }

    downvoteQuestion = () => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if (userId == null) {
            notify.info('Please sign in to vote.');
            return;
        }
        let payload = { ...this.props.questionDetails };
        payload.isVotingDetailsRefreshing = true;
        this.props.updateQuestionDetails(payload);
        QuestionsReceiver.downvoteQuestion(this.props.questionDetails.id, userId).then(() => {
            this.reloadQuestionVoting();
        });
    }

    upvoteQuestionComment = (commentIndex, replyIndex) => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if (userId == null) {
            notify.info('Please sign in to vote.');
            return;
        }
        const comments = this.props.questionComments || [];
        const comment = comments[commentIndex];
        if (!comment) {
            return;
        }
        let payload = { ...this.props.questionDetails };
        payload.commentIndexRefreshing = commentIndex;
        payload.commentReplyIndexRefreshing = replyIndex;
        this.props.updateQuestionDetails(payload);
        // `comment.replies[replyIndex].id` was read without checking either level,
        // so a vote on a reply that had just been removed threw.
        const replyId = (replyIndex == null || !comment.replies || !comment.replies[replyIndex])
            ? null
            : comment.replies[replyIndex].id;
        QuestionsReceiver.upvoteQuestionComment(this.props.questionDetails.id, comment.id, replyId, userId)
            .then(() => this.reloadQuestionCommentVoting());
    }

    downvoteQuestionComment = (commentIndex, replyIndex) => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if (userId == null) {
            notify.info('Please sign in to vote.');
            return;
        }
        const comments = this.props.questionComments || [];
        const comment = comments[commentIndex];
        if (!comment) {
            return;
        }
        let payload = { ...this.props.questionDetails };
        payload.commentIndexRefreshing = commentIndex;
        payload.commentReplyIndexRefreshing = replyIndex;
        this.props.updateQuestionDetails(payload);
        const replyId = (replyIndex == null || !comment.replies || !comment.replies[replyIndex])
            ? null
            : comment.replies[replyIndex].id;
        QuestionsReceiver.downvoteQuestionComment(this.props.questionDetails.id, comment.id, replyId, userId)
            .then(() => this.reloadQuestionCommentVoting());
    }

    submitQuestionResponse = () => {
        if (typeof window === 'undefined') {
            return;
        }
        const details = this.props.questionDetails;
        if (!details || details.selectedOptionId == null || this.state.isSubmitting) {
            return;
        }
        this.setState({ isSubmitting: true });
        const questionId = details.id;
        const selectedOptionId = details.selectedOptionId;
        const questionRequestTime = details.requestTime;

        QuestionsReceiver.submitQuestionResponse(questionId, selectedOptionId, questionRequestTime)
            .then((response) => {
                const data = dataOf(response);
                // Submit used to navigate straight to `response.data.responseId`. On
                // failure that threw, and because the button had already been latched
                // into its submitting state it stayed disabled — the answer could not
                // be submitted again without a reload.
                if (data === null || !data.responseId) {
                    this.setState({ isSubmitting: false });
                    notify.error('We couldn\u2019t record your answer. Please try again.');
                    return;
                }
                window.location.href = currentURLHost + 'question/submission/view?response_id=' + data.responseId;
            });
    }

    refreshComments = () => {
        QuestionsReceiver.getQuestionComment(this.props.questionDetails.id, UserDetailsUtil.getUserGoogleId())
            .then((response) => {
                this.props.updateQuestionComments(listOf(response));
                let questionDetails = { ...this.props.questionDetails }
                questionDetails.isCommentRefreshing = false;
                questionDetails.commentIndexRefreshing = -1;
                questionDetails.commentReplyIndexRefreshing = -1;
                this.props.updateQuestionDetails(questionDetails);
            });
    }

    updateQuestionComments = (comments) => {
        let questionDetails = { ...this.props.questionDetails }
        questionDetails.isCommentRefreshing = true;
        this.props.updateQuestionDetails(questionDetails);
        QuestionsReceiver.updateQuestionComments(this.props.questionDetails.id, comments).then((response) => {
            if (response === null) {
                notify.error('We couldn\u2019t save that. Please try again.');
                let reverted = { ...this.props.questionDetails };
                reverted.isCommentRefreshing = false;
                this.props.updateQuestionDetails(reverted);
                return;
            }
            this.refreshComments();
        });
    }

    updateTextBoxIndex = (commentIndex, replyIndex) => {
        let payload = { ...this.props.questionDetails };
        payload.commentIndex = commentIndex;
        payload.replyIndex = replyIndex;
        payload.commentIndexToEdit = null; // replying means not editing and vice versa
        payload.replyIndexToEdit = null;
        this.props.updateQuestionDetails(payload);
    }

    updateEditingCommentBoxIndex = (commentIndexToEdit, replyIndexToEdit) => {
        let payload = { ...this.props.questionDetails };
        payload.commentIndexToEdit = commentIndexToEdit;
        payload.replyIndexToEdit = replyIndexToEdit;
        payload.commentIndex = null;
        payload.replyIndex = null;
        this.props.updateQuestionDetails(payload);
    }

    /**
     * Question stem as plain text, for use in the document head.
     *
     * Strips tags, unwraps $$...$$ maths to its inner source, decodes the handful
     * of entities the content actually uses, and collapses whitespace. Truncated
     * on a word boundary so titles do not end mid-word.
     */
    getPlainDescription = (limit) => {
        const details = this.props.questionDetails;
        const raw = details === undefined || details === null ? null : details.description;
        if (typeof raw !== 'string' || raw.length === 0) {
            return '';
        }
        let text = raw
            .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
        if (limit && text.length > limit) {
            const clipped = text.slice(0, limit);
            const lastSpace = clipped.lastIndexOf(' ');
            text = (lastSpace > limit * 0.6 ? clipped.slice(0, lastSpace) : clipped) + '\u2026';
        }
        return text;
    }

    getDocumentTitle = () => {
        const taxonomy = parseQuestionTaxonomy(this.props.questionDetails.tags);
        const context = [taxonomy.subject, taxonomy.chapter].filter(Boolean).join(' \u00b7 ');
        const stem = this.getPlainDescription(70);
        const parts = [];
        if (stem) {
            parts.push(stem);
        }
        if (context) {
            parts.push(context);
        }
        parts.push('EducationalBridge');
        return parts.join(' | ');
    }

    getMetaDescription = () => {
        const stem = this.getPlainDescription(155);
        return stem || 'Practise exam questions with worked solutions on EducationalBridge.';
    }

    getBreadcrumbJSX = () => {
        const taxonomy = parseQuestionTaxonomy(this.props.questionDetails.tags);
        const tone = accent(subjectAccent(taxonomy.subject));
        return <div className='mb-5'>
            <a
                href={currentURLHost + 'questions'}
                className='inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded'
            >
                <span aria-hidden="true">&larr;</span>
                All questions
            </a>
            <div className='mt-3 flex items-start justify-between gap-4 flex-wrap'>
                <div className='min-w-0'>
                    {taxonomy.breadcrumb.length > 0 &&
                        <nav className='flex items-center gap-1.5 flex-wrap text-sm' aria-label='Question classification'>
                            {taxonomy.subject &&
                                <span className={'font-semibold ' + tone.text}>{taxonomy.subject}</span>
                            }
                            {taxonomy.chapter &&
                                <>
                                    <span className='text-gray-300' aria-hidden="true">/</span>
                                    <span className='text-gray-600'>{taxonomy.chapter}</span>
                                </>
                            }
                            {taxonomy.topic && taxonomy.topic !== taxonomy.chapter &&
                                <>
                                    <span className='text-gray-300' aria-hidden="true">/</span>
                                    <span className='text-gray-600'>{taxonomy.topic}</span>
                                </>
                            }
                        </nav>
                    }
                    {taxonomy.flags.length > 0 &&
                        <div className='flex items-center gap-2 flex-wrap mt-2'>
                            {taxonomy.flags.map((flag) => (
                                <Badge key={flag} variant="warning">{flag}</Badge>
                            ))}
                        </div>
                    }
                </div>
                {/* On narrow viewports the sidebar drops below the question, so the
                    difficulty is surfaced up here where it is immediately visible. */}
                <DifficultyMeter
                    level={taxonomy.difficultyLevel}
                    label={taxonomy.difficulty}
                    className='shrink-0 mt-1 xl:hidden'
                />
            </div>
        </div>;
    }

    formatElapsed = () => {
        const total = this.state.elapsedSeconds;
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return minutes + ':' + String(seconds).padStart(2, '0');
    }

    /**
     * Submit bar pinned to the viewport bottom.
     *
     * Question bodies here can be long — some carry diagrams and tables — and the
     * submit button used to sit inline after the options, so on a long question the
     * primary action scrolled out of view.
     */
    getActionBarJSX = () => {
        const details = this.props.questionDetails;
        const hasSelection = details && details.selectedOptionId != null;
        const eliminatedCount = this.state.eliminatedIds.length;
        return <div className='fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200'>
            <div className={layout.container + ' py-3 flex items-center justify-between gap-4'}>
                <div className='flex items-center gap-4 min-w-0'>
                    <p className='text-sm text-gray-500 truncate'>
                        {hasSelection ? 'Answer selected' : 'Select an option to continue'}
                    </p>
                    {eliminatedCount > 0 &&
                        <span className='hidden sm:inline text-xs text-gray-400'>
                            {eliminatedCount} ruled out
                        </span>
                    }
                </div>
                <div className='flex items-center gap-4 shrink-0'>
                    {/* Time on this question. Counts from when the page opened; it is
                        a pacing cue, not a limit, so nothing happens when it grows. */}
                    <span
                        className='hidden sm:inline text-sm tabular-nums text-gray-400'
                        title='Time on this question'
                    >
                        {this.formatElapsed()}
                    </span>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={this.submitQuestionResponse}
                        disabled={!hasSelection || this.state.isSubmitting}
                    >
                        {this.state.isSubmitting ? 'Submitting\u2026' : 'Submit answer'}
                    </Button>
                </div>
            </div>
        </div>;
    }

    getShellJSX = (children, withActionBar) => (
        <div className='bg-gray-50 min-h-screen flex flex-col'>
            <EducationalBridgeHeader />
            <div className={layout.container + ' py-6 md:py-8 flex-1 w-full'}>
                {children}
            </div>
            {withActionBar ? this.getActionBarJSX() : <Footer />}
        </div>
    )

    render() {
        const { status } = this.state;

        if (status === 'loading') {
            return this.getShellJSX(
                <div className='flex justify-center py-20'>
                    {/* `size` must be a number: react-spinners multiplies it, and the
                        string "60" produced NaN-based CSS. */}
                    <ClipLoader color="#2563EB" size={60} />
                </div>,
                false
            );
        }

        if (status === 'error') {
            return this.getShellJSX(
                <ErrorState
                    title="We couldn&rsquo;t load this question"
                    description="The connection may have dropped. This is usually temporary."
                    onRetry={this.loadQuestion}
                />,
                false
            );
        }

        if (status === 'notFound' || this.props.questionDetails === undefined || this.props.questionDetails === null) {
            return this.getShellJSX(
                <ErrorState
                    title="That question doesn&rsquo;t exist"
                    description="The link may be out of date, or the question may have been removed."
                    onRetry={null}
                />,
                false
            );
        }

        const details = this.props.questionDetails;

        return (
            <div>
                {/* The loading branch used to ship a literal <title>Meta Title</title>
                    and "Meta Description Sample" to the document head, so any crawler
                    or link preview that resolved before the fetch completed saw
                    placeholder text. The head is now only written once there is
                    something real to put in it. */}
                <Helmet>
                    <title>{this.getDocumentTitle()}</title>
                    <meta name="description" content={this.getMetaDescription()} />
                </Helmet>

                <div className="bg-gray-50 min-h-screen pb-24">
                    <EducationalBridgeHeader />

                    <div className={layout.container + ' py-6 md:py-8'}>
                        {this.getBreadcrumbJSX()}

                        {/* Two columns from xl up. The page was previously capped at a
                            768px reading measure on the grounds that solving is a
                            focused activity, but a question is not an article: the
                            classification, difficulty, community signal and sibling
                            questions are all things a learner wants while deciding
                            what to do next, and at 768px there was nowhere to put
                            them, so most of the screen was empty. */}
                        <div className='flex flex-col xl:flex-row gap-6 xl:gap-8 items-start'>
                            <div className='flex-1 min-w-0 w-full'>
                                {/* Surface 1: the problem. */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                                    <SingleSelectMCQQuestion
                                        questionDetails={details}
                                        selectedOptionId={details.selectedOptionId}
                                        updateQuestionAnswer={this.updateQuestionAnswer}
                                        updateQuestionComments={this.updateQuestionComments}
                                        eliminatedIds={this.state.eliminatedIds}
                                        onToggleEliminate={this.toggleEliminate}
                                    />
                                </div>

                                {/* Surface 2: discussion, clearly separated from the task. */}
                                <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                                    <QuestionComment
                                        questionDetails={details}
                                        // Was `this.updateQuestionDetails`, which is not a
                                        // method on this class — only `this.props` has it —
                                        // so this prop was always undefined and any child
                                        // that called it threw.
                                        updateQuestionDetails={this.props.updateQuestionDetails}
                                        questionComments={this.props.questionComments}
                                        updateQuestionComments={this.updateQuestionComments}
                                        updateTextBoxIndex={this.updateTextBoxIndex}
                                        updateEditingCommentBoxIndex={this.updateEditingCommentBoxIndex}
                                        initializeQuestionComments={this.initializeQuestionComments}
                                        upvoteQuestion={this.upvoteQuestion}
                                        downvoteQuestion={this.downvoteQuestion}
                                        upvoteQuestionComment={this.upvoteQuestionComment}
                                        downvoteQuestionComment={this.downvoteQuestionComment}
                                    />
                                </div>
                            </div>

                            <QuestionSidebar
                                questionDetails={details}
                                siblings={this.state.siblings}
                                siblingContext={this.state.siblingContext}
                                elapsedLabel={this.formatElapsed()}
                                onUpvote={this.upvoteQuestion}
                                onDownvote={this.downvoteQuestion}
                            />
                        </div>
                    </div>

                    {this.getActionBarJSX()}
                </div>
            </div>
        );
    }

}

const loadData = async (ssrStore, path, params) => {
    const questionId = new URLSearchParams(params).get('question_id');
    if (questionId === null || questionId === undefined) {
        return;
    }
    // Was a `new Promise` wrapper around an already-async call whose reject path was
    // never wired up, so a failed prefetch hung forever.
    const response = await QuestionsReceiver.getQuestion(questionId);
    const data = dataOf(response);
    if (data === null) {
        return;
    }
    ssrStore.dispatch(updateQuestionDetails(data));
    return data;
}

export { loadData }
export default connect(mapStateToProps, mapDispatchToProps)(GeneralQuestionView);
