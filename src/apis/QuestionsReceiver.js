import {savePaperDetails} from "../store/actions/solgressAction";
import React from 'react';
import {currentHost} from './../constants/hostConfig';
import { CatchingPokemon } from "@mui/icons-material";
import { UserDetailsUtil } from "../utils/UserDetailsUtil";

const mapDispatchToProps = dispatch => ({
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload))
})


const mapStateToProps = state => {
    return {
        paperDetails: state.solgressReducer.paperDetails
    };
}

class QuestionsReceiver extends React.Component  {

    static getQuestions = async() => {
        try {
            const response = await fetch(currentHost + 'paper?paper_id=12313');
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static getAllFilteredQuestions = async(searchKey, tagIds, channelIds, currentPage, pageSize) => {
        try {
            let updatedPageSize = (pageSize==null || pageSize == undefined)?10:pageSize;
            let response = await fetch(
                currentHost + 'questions?search_key=' + searchKey
                + "&tag_ids="+ tagIds
                + "&channel_ids=" + channelIds
                + "&question_ids="
                + "&page_start_index="+ (currentPage==undefined?0:currentPage)
                + "&page_size="+ updatedPageSize
            )
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return {};
        }
    }

    static getQuestionsByQuestionIds = async(questionIds) => {
        try {
            let pageSize = questionIds.length;
            if(pageSize<1) {
                pageSize = 1;
            }
            let response = await fetch(
                currentHost + 'questions?question_ids=' + questionIds + "&tag_ids=&channel_ids=&search_key=&page_start_index=0&page_size="+questionIds.length
            )
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return {};
        }
    }

    static getQuestion = async(questionId) => {
        try {
            const response = await fetch(currentHost + 'question?question_id='+questionId);
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static getSubmittedQuestion = async(responseId) => {
        try {
            const response = await fetch(currentHost + 'question/submission?response_id=' + responseId);
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static submitQuestionResponse = async(questionId, selectedOptionId, questionRequestTime) => {
        try {
            let userDetails = window.sessionStorage.userDetails;
            let userEmail = '';
            if(userDetails!=null && userDetails != "null" && userDetails!=undefined) {
                userEmail = JSON.parse(userDetails).email;
            }
            const url = currentHost + 'question/submit?question_id='+questionId + '&option_id='+ selectedOptionId
                +'&user_email=' + UserDetailsUtil.getUserGoogleId() + "&question_request_time="+questionRequestTime ;
            const response = await fetch(url, {
                method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
            });
            let data = await response.json();
            return {data};
        }
        catch(e) {
            console.log(e);
            return null;
        }
    }

    static upsertQuestion = async(questionData) => {
        try {
            let response = fetch(currentHost + 'question', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(questionData)
                }
            );
            let data = await response.json();
            return {data};
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    static getUserSubmmittedQuestionsSummary = async(userEmail) => {
        try {
            let response = await fetch(currentHost + 'question/submission/summary/user?user_email=' + userEmail)
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static getQuestionComment = async(questionId, userId) => {
        try {
            let response = await fetch(currentHost + 'question/comment?question_id=' + questionId + "&user_id=" + userId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }
    }

    static buildComments = (comments) => {
        let response = [];
        comments.forEach(comment => {
            let commentBody = {};
            commentBody.id = comment.id;
            commentBody.userId = comment.userId;
            commentBody.description = comment.description;
            commentBody.upvoteCount = comment.upvoteCount;
            commentBody.downvoteCount = comment.downvoteCount;
            let commentReplies = [];
            comment.replies.forEach(reply => {
                let commentReply = {};
                commentReply.id = reply.id;
                commentReply.userId = reply.userId;
                commentReply.description = reply.description;
                commentReply.upvoteCount = reply.upvoteCount;
                commentReply.downvoteCount = reply.downvoteCount;
                commentReplies.push(commentReply);
            })
            commentBody.replies = commentReplies;
            response.push(commentBody);
        })
        return response;
    }

    static updateQuestionComments = async(questionId, comments) => {
        try {
            let requestBody = {};
            requestBody.comments = this.buildComments(comments);
            requestBody.questionId = questionId;
            let response = await fetch(currentHost + 'question/comment?question_id=' + questionId, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                }
            );
            return "updated";
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    static upvoteQuestion= async(questionId, userId) => {
        try {
            let response = await fetch(currentHost + '/question/upvote?question_id=' + questionId + '&user_id=' + userId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }
    }

    static downvoteQuestion = async(questionId, userId) => {
        try {
            let response = await fetch(currentHost + '/question/downvote?question_id=' + questionId + '&user_id=' + userId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }
    }

    static getQuestionVoting = async(questionId, userId) => {
        try {
            let response = await fetch(currentHost + '/question/vote/details?question_id=' + questionId + '&user_id=' + userId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }
    }

    static upvoteQuestionComment= async(questionId, commentId, replyId, userId) => {
        try {
            let response = await fetch(
                currentHost + '/question/comment/upvote?question_id=' + questionId + '&user_id=' + userId + '&comment_id=' + commentId + '&reply_id=' + replyId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }
    }

    static downvoteQuestionComment = async(questionId, commentId, replyId, userId) => {
        try {
            let response = await fetch(
                currentHost + '/question/comment/downvote?question_id=' + questionId + '&user_id=' + userId + '&comment_id=' + commentId + '&reply_id=' + replyId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }
    }

    static getNextRecommendedQuestion = async(questionId, emailId) => {
        try {
            let response = await fetch(
                currentHost + '/question/recommendation?question_id=' + questionId + '&user_id=' + emailId)
            let data = await response.json();
            return {data};
        } catch(e) {
            console.log(e);
            return {};
        }   
    }

}

export default QuestionsReceiver;
