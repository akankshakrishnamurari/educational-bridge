import React from 'react';
import QuestionsReceiver from "../../apis/QuestionsReceiver"
import { connect } from 'react-redux';
import {updateQuestionDetails, updateQuestionComments} from '../../store/actions/solgressAction';
import SingleSelectMCQQuestion from '../questionSet/largeScreen/SingleSelectMCQQuestion';
import {Helmet} from 'react-helmet';
import { currentURLHost } from '../../constants/hostConfig';
import QuestionComment from './QuestionComment';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import ClipLoader from "react-spinners/ClipLoader";
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DifficultyMeter from '../../components/common/DifficultyMeter';
import { layout } from '../../constants/designTokens';
import { accent } from '../../constants/accents';
import { parseQuestionTaxonomy, subjectAccent } from '../../utils/questionTaxonomy';

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

class GeneralQuestionView extends React.Component {

    constructor(props) {
        super(props)
        this.updateQuestionAnswer = this.updateQuestionAnswer.bind(this);
    }

    initializeQuestionDetails  () {
        const search = window.location.search;
        const questionId = new URLSearchParams(search).get('question_id');
        if(questionId === null || questionId === undefined) {
            return;
        }
        QuestionsReceiver.getQuestion(questionId).then(questionData=>{
            let questionDetails = {...questionData.data};
            questionDetails.isCommentRefreshing = false;
            questionDetails.commentIndex = null;
            questionDetails.replyIndex = null;
            questionDetails.commentIndexToEdit = null;
            questionDetails.replyIndexToEdit = null;
            questionDetails.isVotingDetailsRefreshing = false;
            questionDetails.submittedByUser=false;
            questionDetails.commentIndexRefreshing = -1;
            questionDetails.commentReplyIndexRefreshing = -1;
            this.props.updateQuestionDetails(questionDetails);
        });
        this.initializeQuestionComments();
    }

    initializeQuestionComments () {
        const search = window.location.search;
        const questionId = new URLSearchParams(search).get('question_id');
        if(questionId === null || questionId === undefined) {
            return;
        }
        const userId = UserDetailsUtil.getUserGoogleId();
        QuestionsReceiver.getQuestionComment(questionId, userId).then(commentsData=>{
            this.props.updateQuestionComments(commentsData.data);
        });
    }

    componentDidMount(){
        this.initializeQuestionDetails();
    }

    updateQuestionAnswer = (questionId, optionId) => {
        let payload = {...this.props.questionDetails};
        payload.selectedOptionId = optionId;
        this.props.updateQuestionDetails(payload);
    }

    reloadQuestionVoting = () => {
        const userId = UserDetailsUtil.getUserGoogleId();
        QuestionsReceiver.getQuestionVoting(this.props.questionDetails.id, userId).then(questionVotingDetails => {
            let payload = {...this.props.questionDetails};
            payload.isVotingDetailsRefreshing = false;
            payload.upvoteCount = questionVotingDetails.data.upvoteCount;
            payload.downvoteCount = questionVotingDetails.data.downvoteCount;
            payload.hasUserUpvoted = questionVotingDetails.data.hasUserUpvoted;
            payload.hasUserDownvoted = questionVotingDetails.data.hasUserDownvoted;
            this.props.updateQuestionDetails(payload);
        });
    }

    reloadQuestionCommentVoting = () => {
        this.refreshComments();
    }

    upvoteQuestion = () => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if(userId==null) {
            notify.info("Please login to mark your vote.");
            return;
        }
        let payload = {...this.props.questionDetails};
        payload.isVotingDetailsRefreshing = true;
        this.props.updateQuestionDetails(payload);
        QuestionsReceiver.upvoteQuestion(this.props.questionDetails.id, userId).then(upvoteResponse => {
            this.reloadQuestionVoting();
        });
    }

    downvoteQuestion = () => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if(userId==null) {
            notify.info("Please login to mark your vote.");
            return;
        }
        let payload = {...this.props.questionDetails};
        payload.isVotingDetailsRefreshing = true;
        this.props.updateQuestionDetails(payload);
        QuestionsReceiver.downvoteQuestion(this.props.questionDetails.id, userId).then(downvoteResponse => {
            this.reloadQuestionVoting();
        });
    }

    upvoteQuestionComment = (commentIndex, replyIndex) => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if(userId==null) {
            notify.info("Please login to mark your vote.");
            return;
        }
        let payload = {...this.props.questionDetails};
        payload.commentIndexRefreshing = commentIndex;
        payload.commentReplyIndexRefreshing = replyIndex;
        this.props.updateQuestionDetails(payload);
        let commentId = this.props.questionComments[commentIndex].id;
        let replyId = (replyIndex==null)?null:this.props.questionComments[commentIndex].replies[replyIndex].id;
        QuestionsReceiver.upvoteQuestionComment(this.props.questionDetails.id, commentId, replyId, userId).then(upvoteResponse => {
            this.reloadQuestionCommentVoting();
        });

    }

    downvoteQuestionComment = (commentIndex, replyIndex) => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if(userId==null) {
            notify.info("Please login to mark your vote.");
            return;
        }
        let payload = {...this.props.questionDetails};
        payload.commentIndexRefreshing = commentIndex;
        payload.commentReplyIndexRefreshing = replyIndex;
        this.props.updateQuestionDetails(payload);
        let commentId = this.props.questionComments[commentIndex].id;
        let replyId = (replyIndex==null)?null:this.props.questionComments[commentIndex].replies[replyIndex].id;
        QuestionsReceiver.downvoteQuestionComment(this.props.questionDetails.id, commentId, replyId, userId).then(upvoteResponse => {
            this.reloadQuestionCommentVoting();
        });
    }

    submitQuestionResponse = () => {
        if(typeof window === `undefined`) {
            return;
        }
        let payload = {...this.props.questionDetails};
        payload.submittedByUser=true;
        this.props.updateQuestionDetails(payload);
        const search = window.location.search;
        const questionId = new URLSearchParams(search).get('question_id');
        const selectedOptionId = this.props.questionDetails.selectedOptionId;
        const questionRequestTime = this.props.questionDetails.requestTime;
        QuestionsReceiver.submitQuestionResponse(questionId, selectedOptionId, questionRequestTime).then( response => {
            window.location.href = currentURLHost + 'question/submission/view?response_id=' + response.data.responseId;
        })
    }

    refreshComments = () => {
        QuestionsReceiver.getQuestionComment(this.props.questionDetails.id, UserDetailsUtil.getUserGoogleId()).then(commentsData=>{
            this.props.updateQuestionComments(commentsData.data);
            let questionDetails = {...this.props.questionDetails}
            questionDetails.isCommentRefreshing = false;
            questionDetails.commentIndexRefreshing = -1;
            questionDetails.commentReplyIndexRefreshing = -1;
            this.props.updateQuestionDetails(questionDetails);
        });
    }

    updateQuestionComments = (comments) => {
        let questionDetails = {...this.props.questionDetails}
        questionDetails.isCommentRefreshing = true;
        this.props.updateQuestionDetails(questionDetails);
        QuestionsReceiver.updateQuestionComments(this.props.questionDetails.id, comments).then(response =>{
            this.refreshComments();
        });
    }

    updateTextBoxIndex = (commentIndex, replyIndex) => {
        let payload = {...this.props.questionDetails};
        payload.commentIndex = commentIndex;
        payload.replyIndex = replyIndex;
        payload.commentIndexToEdit = null; // replying means not editing and vice versa
        payload.replyIndexToEdit = null;
        this.props.updateQuestionDetails(payload);
    }


    updateEditingCommentBoxIndex = (commentIndexToEdit, replyIndexToEdit) => {
        let payload = {...this.props.questionDetails};
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
        const raw = this.props.questionDetails.description;
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
            text = (lastSpace > limit * 0.6 ? clipped.slice(0, lastSpace) : clipped) + '…';
        }
        return text;
    }

    getDocumentTitle = () => {
        const taxonomy = parseQuestionTaxonomy(this.props.questionDetails.tags);
        const context = [taxonomy.subject, taxonomy.chapter].filter(Boolean).join(' · ');
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

    /**
     * Context strip above the question.
     *
     * The page previously opened straight into the question stem with no
     * indication of what you were looking at -- no subject, no chapter, no
     * difficulty, no way back to the list. All of that metadata was already on
     * the payload, encoded in the tag names, and simply never rendered.
     */
    getQuestionHeaderJSX = () => {
        const taxonomy = parseQuestionTaxonomy(this.props.questionDetails.tags);
        const tone = accent(subjectAccent(taxonomy.subject));
        return <div className='mb-4'>
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
                    <div className='flex items-center gap-3 flex-wrap mt-2'>
                        {(taxonomy.exam || taxonomy.year) &&
                            <span className='text-xs text-gray-500'>
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
                    className='shrink-0 mt-1'
                />
            </div>
        </div>;
    }

    /**
     * Submit lives in a bar pinned to the viewport bottom.
     *
     * Question bodies here can be very long -- some carry diagrams and tables --
     * and the submit button used to sit inline after the options, so on a long
     * question it scrolled out of view and the primary action became something
     * you had to hunt for. Pinning it also gives somewhere honest to state
     * whether an option has been chosen yet.
     */
    getActionBarJSX = () => {
        const hasSelection = this.props.questionDetails.selectedOptionId != null;
        const isSubmitting = this.props.questionDetails.submittedByUser === true;
        return <div className='fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200'>
            <div className='w-full max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4'>
                <p className='text-sm text-gray-500'>
                    {hasSelection
                        ? 'Answer selected'
                        : 'Select an option to continue'}
                </p>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={this.submitQuestionResponse}
                    disabled={!hasSelection || isSubmitting}
                >
                    {isSubmitting ? 'Submitting…' : 'Submit answer'}
                </Button>
            </div>
        </div>;
    }

    render() {
        if(this.props.questionDetails === undefined){
            this.initializeQuestionDetails();
            return <div>
                <Helmet>
                    <title>Meta Title</title>
                    <meta name="description" content = "Meta Description Sample"/>
                </Helmet>
                <div className='bg-gray-50 min-h-screen'>
                    <EducationalBridgeHeader/>
                    <div className='flex justify-center py-20'>
                        <ClipLoader color="#2563EB" size="60"/>
                    </div>
                </div>
            </div>
        }
        return ( 
            <div>
            {/* The title and description previously received the raw question
                HTML, so browser tabs and search snippets showed markup and $$...$$
                LaTeX delimiters. They now get plain text, prefixed with the
                classification so a tab is identifiable among several open
                questions. The stray <h1> that used to sit in here did nothing:
                Helmet only manages document head elements. */}
            <Helmet>
                <title>{this.getDocumentTitle()}</title>
                <meta name="description" content={this.getMetaDescription()}/>
            </Helmet>
            <div className="bg-gray-50 min-h-screen pb-24">
                <EducationalBridgeHeader/>
                {/* Reading width. Solving is a focused, single-task activity, so the
                    column is capped for legibility rather than filling the wider
                    container the list page uses. */}
                <div className={layout.reading + " py-6 md:py-8"}>
                <div className="min-w-0">
                    {this.getQuestionHeaderJSX()}

                    {/* Surface 1: the problem. Previously the question, the options,
                        the submit button and the entire comment thread all shared a
                        single undifferentiated card, so nothing signalled where the
                        task ended and the discussion began. */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                        <SingleSelectMCQQuestion
                            questionDetails = {this.props.questionDetails}
                            selectedOptionId = {this.props.questionDetails.selectedOptionId}
                            updateQuestionAnswer = {this.updateQuestionAnswer}
                            updateQuestionComments = {this.updateQuestionComments}
                        />
                    </div>

                    {/* Surface 2: discussion, clearly separated from the task. */}
                    <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                        <QuestionComment 
                            questionDetails = {this.props.questionDetails}
                            updateQuestionDetails = {this.updateQuestionDetails}
                            questionComments = {this.props.questionComments}
                            updateQuestionComments = {this.updateQuestionComments}
                            updateTextBoxIndex = {this.updateTextBoxIndex}
                            updateEditingCommentBoxIndex = {this.updateEditingCommentBoxIndex}
                            initializeQuestionComments = {this.initializeQuestionComments}
                            upvoteQuestion = {this.upvoteQuestion}
                            downvoteQuestion =  {this.downvoteQuestion}
                            upvoteQuestionComment = {this.upvoteQuestionComment}
                            downvoteQuestionComment = {this.downvoteQuestionComment}
                        />
                    </div>
                </div>
                </div>
                {this.getActionBarJSX()}
            </div>
            </div>
        );
    }

}

const loadData  = async(ssrStore, path, params)  =>{
    const questionId = new URLSearchParams(params).get('question_id');
    if(questionId === null || questionId === undefined) {
        return;
    }
    let promisedResponse =  new Promise(function(fulfill, reject) {
        QuestionsReceiver.getQuestion(questionId).then(questionData=>{
            ssrStore.dispatch(updateQuestionDetails(questionData.data));
            fulfill(questionData.data);
        })
      }
    )
    return promisedResponse;
}
export {loadData}
export default connect(mapStateToProps, mapDispatchToProps)(GeneralQuestionView);
