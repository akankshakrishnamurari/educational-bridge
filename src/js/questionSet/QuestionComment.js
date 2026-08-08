import React from 'react';
import {AiOutlineLike, AiOutlineDislike, AiOutlineEdit, AiFillLike, AiFillDislike} from 'react-icons/ai';
import {JSXUtils} from "../../utils/JSXUtils";
import {UserDetailsUtil} from "../../utils/UserDetailsUtil";
import TextEditor from "../adminPortal/platformCapabilities/TextEditor";
import { MiscUtils } from '../../utils/MiscUtils';
import {generalTextSize} from './../../constants/TextSizeConstants';
import notify from '../../utils/notify';
import ClipLoader from "react-spinners/ClipLoader";
import Button from '../../components/common/Button';
import { typography } from '../../constants/designTokens';

class QuestionComment extends React.Component {

    getVotingJSX = () => {
        // createdBy comes from the backend as a plain string (Google id / email / free text),
        // not a resolved user object, so we display it as-is rather than assuming .name/.picture.
        const createdBy = this.props.questionDetails.createdBy;
        const createdByUserName = (createdBy && typeof createdBy === 'object')
            ? (createdBy.name || '').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            : (createdBy || '');
        const createdByPicture = (createdBy && typeof createdBy === 'object') ? createdBy.picture : null;
        return <div className='py-3 px-2 border border-gray-100 bg-gray-50 rounded-lg'>
            {this.props.questionDetails.isVotingDetailsRefreshing 
                ? <div className='flex justify-center grow'><ClipLoader color="#2563EB" size={24}/></div>
                :<div className='flex flex-row items-center'>
                    <div className='flex flex-row items-center gap-1'>
                        <div className='cursor-pointer text-success-600' onClick={this.props.upvoteQuestion}>
                            {this.props.questionDetails.hasUserUpvoted ? <AiFillLike size={22}/> : <AiOutlineLike size={22}/>}
                        </div>
                        <div className={typography.caption + ' pr-3'}>{this.props.questionDetails.upvoteCount}</div>
                        <div className='cursor-pointer text-danger-600' onClick={this.props.downvoteQuestion}>
                            {this.props.questionDetails.hasUserDownvoted ? <AiFillDislike size={22}/> : <AiOutlineDislike size={22}/>}
                        </div>
                        <div className={typography.caption}>{this.props.questionDetails.downvoteCount}</div>
                    </div>                 
                    <div className='justify-end flex grow'>
                        <div className='flex flex-row items-center gap-2 bg-white rounded-full px-2 py-1 border border-gray-100'>
                            <span className={typography.caption}>Author:</span>
                            {createdByPicture &&
                                <img
                                    className="rounded-full w-6 h-6"
                                    src={createdByPicture}
                                    alt={createdByUserName}
                                    referrerPolicy="no-referrer"
                                />
                            }
                            <span className='text-sm text-gray-700'>{createdByUserName}</span>
                        </div>
                    </div>
                    
                </div>
            }
        </div>
    }

    getCommentReplyTextJSX = (commentIndex, replyIndex) => {
        if(this.props.questionDetails.commentIndex==commentIndex && this.props.questionDetails.replyIndex==replyIndex) {
            return this.getCommentPostBox();
        }
        else {
            return <div className='flex flex-row items-center gap-2 pt-1'>
                <button className='text-xs font-medium px-3 py-1 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors'
                    onClick={() => this.updateTextBoxIndex(commentIndex, replyIndex)}>Reply</button>
                {(this.props.questionDetails.commentIndexRefreshing==commentIndex && this.props.questionDetails.commentReplyIndexRefreshing==replyIndex)
                    ?<div className='flex items-center pl-2'><ClipLoader color="#2563EB" size={18}/></div>
                    :<div className='flex flex-row items-center gap-1'>
                        <div className='cursor-pointer text-success-600' onClick={() => this.props.upvoteQuestionComment(commentIndex, replyIndex)}>
                            {this.props.questionComments[commentIndex].replies[replyIndex].hasUserUpvoted ? <AiFillLike size={16}/> : <AiOutlineLike size={16}/>}
                        </div>
                        <div className={typography.caption}>{this.props.questionComments[commentIndex].replies[replyIndex].upvoteCount}</div>
                        <div className='cursor-pointer text-danger-600' onClick={() => this.props.downvoteQuestionComment(commentIndex, replyIndex)}>
                            {this.props.questionComments[commentIndex].replies[replyIndex].hasUserDownvoted ? <AiFillDislike size={16}/> : <AiOutlineDislike size={16}/>}
                        </div>
                        <div className={typography.caption}>{this.props.questionComments[commentIndex].replies[replyIndex].downvoteCount}</div>
                    </div>
                }
            </div>;
        }
    }

    getCommentReplyJSX = (reply, commentIndex, replyIndex) => {
        if (this.props.questionDetails.commentIndexToEdit==commentIndex && this.props.questionDetails.replyIndexToEdit==replyIndex) {
            return this.getCommentPostBox();
        }
        else {
            return <div className='flex items-start'>
                <div className='flex flex-col grow'>
                    <div className='flex flex-row items-start'>
                        <div className={typography.body + ' flex-1'} dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(reply.description)}}/>
                        {
                            (reply.userId == UserDetailsUtil.getUserGoogleId())
                            ?<div className='px-2 py-1 text-primary-600 cursor-pointer'><AiOutlineEdit size={16}
                                onClick={() => this.updateEditingCommentBoxIndex(commentIndex, replyIndex)}/>
                            </div>
                            :<div/>
                        }
                    </div>
                    {this.getCommentReplyTextJSX(commentIndex, replyIndex)}
                </div>
            </div>;
        }
    }

    getCommentRepliesJSX = (comment, commentIndex) => {
        if(comment.replies.length ==0) {
            return <div/>
        }
        let replies = [];
        comment.replies.forEach((reply, replyIndex) => {
            replies.push(
                <div className='hover:bg-gray-50 transition-colors' key={reply.id}>
                    <div className='flex flex-row py-3 px-2'>
                        <img 
                            className="rounded-full w-7 h-7 shrink-0" 
                            src={reply.avatarUrl}
                            alt={reply.userName || ''}
                            referrerPolicy="no-referrer"    
                        />
                        <div className='px-3 grow'>
                            {this.getCommentReplyJSX(reply, commentIndex, replyIndex)}
                        </div>
                    </div>
                </div>
            );
        });
        return <div className='pl-10 md:pl-16'>
            <div className="border-t border-gray-100">{replies}</div>
        </div>;
    }

    updateTextBoxIndex = (commentIndex, replyIndex) => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if(userId==null) {
            notify.info("Please login to add your comment.");
            return;
        }
        this.refreshTextBoxData();
        this.props.updateTextBoxIndex(commentIndex, replyIndex);
    }

    updateEditingCommentBoxIndex = (commentIndexToEdit, replyIndexToEdit) => {
        let userId = UserDetailsUtil.getUserGoogleId();
        if(userId==null) {
            notify.info("Please login to add your comment.");
            return;
        }
        this.refreshTextBoxData();
        this.props.updateEditingCommentBoxIndex(commentIndexToEdit, replyIndexToEdit);
    }

    getCommentDetailsTextJSX = (index) => {
        return <div className='flex flex-row items-center gap-2 pt-1'>
            <button className='text-xs font-medium px-3 py-1 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors'
                onClick={() => this.updateTextBoxIndex(index, null)}>Reply</button>
            {
                (this.props.questionDetails.commentIndexRefreshing==index && this.props.questionDetails.commentReplyIndexRefreshing==null)
                ?<div className='flex items-center pl-2'><ClipLoader color="#2563EB" size={18}/></div>
                :<div className='flex flex-row items-center gap-1'>
                    <div className='cursor-pointer text-success-600' onClick={() => this.props.upvoteQuestionComment(index, null)}>
                        {this.props.questionComments[index].hasUserUpvoted ? <AiFillLike size={16}/> : <AiOutlineLike size={16}/>}
                    </div>
                    <div className={typography.caption}>{this.props.questionComments[index].upvoteCount}</div>
                    <div className='cursor-pointer text-danger-600' onClick={() => this.props.downvoteQuestionComment(index, null)}>
                        {this.props.questionComments[index].hasUserDownvoted ? <AiFillDislike size={16}/> : <AiOutlineDislike size={16}/>}
                    </div>
                    <div className={typography.caption}>{this.props.questionComments[index].downvoteCount}</div> 
                </div>
            }
        </div>
    } 

    getCommentDetailJSX = (comment, index) => {
        if(this.props.questionDetails.commentIndexToEdit==index && this.props.questionDetails.replyIndexToEdit==null) {
            return this.getCommentPostBox();
        }
        else {
            return <div className='flex items-start'>
                <div className='flex flex-col grow'>
                    <div className='flex flex-row items-start'>
                        <div className={typography.body + ' flex-1'} dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(comment.description)}}/>
                        {
                            (comment.userId == UserDetailsUtil.getUserGoogleId())
                            ?<div className='px-2 py-1 text-primary-600 cursor-pointer'><AiOutlineEdit size={16}
                                onClick={() => this.updateEditingCommentBoxIndex(index, null)}/>
                            </div>
                            :<div/>
                        }
                    </div>
                    {
                        (this.props.questionDetails.commentIndex==index && this.props.questionDetails.replyIndex==null)
                            ?this.getCommentPostBox()
                            :this.getCommentDetailsTextJSX(index)
                    }
                </div>
            </div>;
        }
    } 

    getCommentJSX = (comment, index) => {
        return <div className='hover:bg-gray-50 transition-colors' key={comment.id}>
            <div className='flex flex-row py-3 px-2 border-b border-gray-100'>
                <img 
                    className="rounded-full w-8 h-8 shrink-0" 
                    src={comment.avatarUrl}
                    alt={comment.userName || ''}
                    referrerPolicy="no-referrer"    
                />
                <div className='px-3 grow'>
                    {this.getCommentDetailJSX(comment, index)}
                </div>
            </div>
        </div>;
    }

    getCommentsJSX = () => {
        let comments = [];
        let existingComments = this.props.questionComments;
        existingComments.forEach((comment, index) => {
            comments.push(
                this.getCommentJSX(comment,index)
            );
            comments.push(this.getCommentRepliesJSX(comment, index));
        }); 
        return comments;
    }

    updateCommentBoxData = (data) => {
        let state = {...this.state};
        if(state == undefined) {
            state = {};
        }
        state.commentBoxData = data;
        this.setState(state);
    }
    
    refreshTextBoxData = () => {
        this.setState({"commentBoxData": undefined});
    }

    cancelPostingCommentBoxData = () => {
        this.refreshTextBoxData();
        this.updateTextBoxIndex(null, null);
        this.updateEditingCommentBoxIndex(null, null);
    }

    isEditingExistingComment = () => {
        return (this.props.questionDetails.commentIndexToEdit!=null);
    }

    postCommentBoxData = () => {
        if(UserDetailsUtil.getUserGoogleId()==null) {
            notify.info("Please login to add comments.");
            return;
        }
        if(this.state.commentBoxData=="" || this.state.commentBoxData==null) {
            return;
        }
        let comments = [...this.props.questionComments];
        if(!this.isEditingExistingComment()){
            if(this.props.questionDetails.commentIndex==null) {
                let newComment = {};
                newComment.userId = UserDetailsUtil.getUserGoogleId();
                newComment.description = this.state.commentBoxData;
                newComment.upvoteCount = 0;
                newComment.downvoteCount = 0;
                newComment.id = MiscUtils.generateUUID();
                newComment.replies = [];
                comments.push(newComment);
            } else {
                let targetComment = {... comments[this.props.questionDetails.commentIndex]}
                let newReply = {};
                newReply.userId = UserDetailsUtil.getUserGoogleId();
                newReply.description = this.state.commentBoxData;
                newReply.upvoteCount = 0;
                newReply.downvoteCount = 0;
                newReply.id = MiscUtils.generateUUID();
                let targetReplies = [... targetComment.replies];
                targetReplies.push(newReply);
                targetComment.replies = targetReplies
                comments[this.props.questionDetails.commentIndex] = targetComment;
            }
        }
        else {
            if(this.props.questionDetails.replyIndexToEdit==null) { // editing comment
                let targetComment = {... comments[this.props.questionDetails.commentIndexToEdit]};
                targetComment.description =  this.state.commentBoxData;
                comments[this.props.questionDetails.commentIndexToEdit] = targetComment;
            }
            else { //editing comment reply
                let targetComment = {... comments[this.props.questionDetails.commentIndexToEdit]};
                let targetReplies = [... targetComment.replies];
                let targetReply = {... targetReplies[this.props.questionDetails.replyIndexToEdit]};
                targetReply.description =  this.state.commentBoxData;
                targetReplies[this.props.questionDetails.replyIndexToEdit] = targetReply;
                targetComment.replies = targetReplies;
                comments[this.props.questionDetails.commentIndexToEdit] = targetComment;
            }
        }
        this.props.updateQuestionComments(comments);
        this.refreshTextBoxData();
        this.updateTextBoxIndex(null, null);
    }

    getCommentPostBox = () => {
        let currentCommentData = "";
        if(this.props.questionDetails.commentIndexToEdit != null 
            && this.props.questionDetails.replyIndexToEdit==null) {
            currentCommentData = this.props.questionComments[this.props.questionDetails.commentIndexToEdit].description
        }
        else if(this.props.questionDetails.commentIndexToEdit != null 
            && this.props.questionDetails.replyIndexToEdit != null) {
            currentCommentData = this.props.questionComments[this.props.questionDetails.commentIndexToEdit].replies[this.props.questionDetails.replyIndexToEdit].description;
        }
        if(this.state != null && this.state!=undefined && this.state.commentBoxData != undefined) {
            currentCommentData = this.state.commentBoxData;
        }
        let postButtonText = 'Post Comment';
        if(this.props.questionDetails.commentIndexToEdit != null) {
            postButtonText = 'Update Comment';
        }
        if(this.props.questionDetails.commentIndex != null) {
            postButtonText = 'Post Reply';
        }
        return <div className='py-2'> 
            <TextEditor
                editorRef = {this.props.editorRef}
                onChange={this.updateCommentBoxData}
                data={currentCommentData}
            />
            <div className='flex flex-row gap-2 pt-2'>
                <Button size="sm" variant="primary" onClick={this.postCommentBoxData}>{postButtonText}</Button>
                <Button size="sm" variant="secondary" onClick={this.cancelPostingCommentBoxData}>Cancel</Button>
            </div>
        </div>
    }

    getComments = () => {
        if(this.props.questionDetails.isCommentRefreshing==true) {
            return <div className='flex justify-center py-6'><ClipLoader color="#2563EB" size={24}/></div>
        }
        return <div>
                {
                    (this.props.questionDetails.commentIndex == null 
                        && this.props.questionDetails.replyIndex == null
                        && this.props.questionDetails.commentIndexToEdit == null
                        && this.props.questionDetails.replyIndexToEdit == null)
                    ?this.getCommentPostBox()
                    :<div/>}
                {this.getCommentsJSX()}
            </div>;
    }

    render() {
        if(typeof window == `undefined` || this.props.questionComments == undefined) {
            if(typeof window != `undefined`){
                this.props.initializeQuestionComments();
            }
            return <div className='py-3 px-2 border border-gray-100 bg-gray-50 rounded-lg flex flex-row items-center justify-center gap-2'>
                <div className={typography.caption}>Loading comment section</div>
                <ClipLoader color="#2563EB" size={20}/>
            </div>
        }
        return ( 
            <div className='pt-4 sm:pt-6 pb-4'>
                {this.getVotingJSX()}
                <div className={typography.h3 + ' pt-6 pb-2'}>Comments</div>
                {this.getComments()}
            </div>
        );
    }

}

export default QuestionComment;
