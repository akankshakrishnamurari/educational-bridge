import React from 'react';
import QuestionsReceiver from "../../apis/QuestionsReceiver"
import { connect } from 'react-redux';
import {updateQuestionDetails, updateQuestionComments} from '../../store/actions/solgressAction';
import SingleSelectMCQQuestion from '../questionSet/largeScreen/SingleSelectMCQQuestion';
import {CSSConventionUtil} from "../../utils/CSSConventionUtil";
import {Helmet} from 'react-helmet';
import { currentURLHost } from '../../constants/hostConfig';
import QuestionComment from './QuestionComment';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import {generalTextSize} from './../../constants/TextSizeConstants';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import ClipLoader from "react-spinners/ClipLoader";
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import AdRail from '../../components/common/AdRail';

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
            <Helmet>
                <title>{this.props.questionDetails.description}</title>
                <meta name="description" content = {this.props.questionDetails.description}/>
                {/* <link rel="canonical" href={window.location.href}/> */}
                <h1>{this.props.questionDetails.description}</h1>
            </Helmet>
            <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 items-start">
                <AdRail />
                <div className="flex-1 min-w-0 max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                        <SingleSelectMCQQuestion
                            questionDetails = {this.props.questionDetails}
                            selectedOptionId = {this.props.questionDetails.selectedOptionId}
                            updateQuestionAnswer = {this.updateQuestionAnswer}
                            updateQuestionComments = {this.updateQuestionComments}
                            
                        />
                        <div className="pt-2">
                            <Button variant="primary" onClick = {this.submitQuestionResponse}>
                                Submit
                            </Button>
                        </div>
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
                <AdRail />
                </div>
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
