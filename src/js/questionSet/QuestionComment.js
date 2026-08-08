import React from 'react';
import {AiOutlineLike, AiOutlineDislike, AiOutlineEdit, AiFillLike, AiFillDislike} from 'react-icons/ai';
import {JSXUtils} from "../../utils/JSXUtils";
import {UserDetailsUtil} from "../../utils/UserDetailsUtil";
import TextEditor from "../adminPortal/platformCapabilities/TextEditor";
import { MiscUtils } from '../../utils/MiscUtils';
import notify from '../../utils/notify';
import ClipLoader from "react-spinners/ClipLoader";
import Button from '../../components/common/Button';
import { typography } from '../../constants/designTokens';

class QuestionComment extends React.Component {

    constructor(props) {
        super(props);
        // State was previously never initialised, so every read had to be guarded
        // with `this.state != null && ...`.
        this.state = { commentBoxData: undefined, isComposing: false };
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
                    :this.getVoteControlsJSX(
                        this.props.questionComments[commentIndex].replies[replyIndex],
                        commentIndex,
                        replyIndex
                    )
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
                            // The handler sat on the icon inside a non-focusable div,
                            // so authors could not edit their own reply by keyboard.
                            ?<button
                                type="button"
                                className='shrink-0 p-1.5 rounded text-primary-600 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
                                onClick={() => this.updateEditingCommentBoxIndex(commentIndex, replyIndex)}
                                aria-label="Edit your reply"
                            >
                                <AiOutlineEdit size={16} aria-hidden="true"/>
                            </button>
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
                :this.getVoteControlsJSX(this.props.questionComments[index], index, null)
            }
        </div>
    }

    /**
     * Up/down vote pair for a comment or a reply.
     *
     * The two variants of this were duplicated inline, and in both the vote control
     * was a `<div onClick>` — so neither could be reached by keyboard and a screen
     * reader announced only the count beside an inert icon. They are buttons now,
     * with labels that say which way they vote and how the current state stands.
     */
    getVoteControlsJSX = (target, commentIndex, replyIndex) => {
        const upvoteCount = (target && target.upvoteCount) || 0;
        const downvoteCount = (target && target.downvoteCount) || 0;
        const hasUpvoted = target && target.hasUserUpvoted;
        const hasDownvoted = target && target.hasUserDownvoted;
        const buttonClass = 'inline-flex items-center gap-1 px-1.5 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ';
        return <div className='flex flex-row items-center gap-1'>
            <button
                type="button"
                className={buttonClass + 'text-success-600 hover:bg-success-50 focus:ring-success-500'}
                onClick={() => this.props.upvoteQuestionComment(commentIndex, replyIndex)}
                aria-pressed={hasUpvoted === true}
                aria-label={'Upvote' + (hasUpvoted ? ' (you have upvoted)' : '')}
            >
                {hasUpvoted ? <AiFillLike size={16} aria-hidden="true"/> : <AiOutlineLike size={16} aria-hidden="true"/>}
                <span className={typography.caption + ' tabular-nums'}>{upvoteCount}</span>
            </button>
            <button
                type="button"
                className={buttonClass + 'text-danger-600 hover:bg-danger-50 focus:ring-danger-500'}
                onClick={() => this.props.downvoteQuestionComment(commentIndex, replyIndex)}
                aria-pressed={hasDownvoted === true}
                aria-label={'Downvote' + (hasDownvoted ? ' (you have downvoted)' : '')}
            >
                {hasDownvoted ? <AiFillDislike size={16} aria-hidden="true"/> : <AiOutlineDislike size={16} aria-hidden="true"/>}
                <span className={typography.caption + ' tabular-nums'}>{downvoteCount}</span>
            </button>
        </div>;
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
                            ?<button
                                type="button"
                                className='shrink-0 p-1.5 rounded text-primary-600 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
                                onClick={() => this.updateEditingCommentBoxIndex(index, null)}
                                aria-label="Edit your comment"
                            >
                                <AiOutlineEdit size={16} aria-hidden="true"/>
                            </button>
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
        this.setState({ isComposing: false });
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
        // Close the composer after a successful post, otherwise the editor stayed
        // open with its content cleared and looked like the post had failed.
        this.setState({ isComposing: false });
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

    startComposing = () => {
        if (UserDetailsUtil.getUserGoogleId() == null) {
            notify.info('Please sign in to join the discussion.');
            return;
        }
        this.setState({ isComposing: true });
    }

    getComments = () => {
        if(this.props.questionDetails.isCommentRefreshing==true) {
            return <div className='flex justify-center py-6'><ClipLoader color="#2563EB" size={24}/></div>
        }
        // The top-level composer used to be permanently expanded, so a full
        // rich-text editor with its own toolbar sat on the page whether or not
        // anyone intended to write anything — it was the tallest element on the
        // whole view. It is now opened deliberately. Reply and edit boxes are
        // unaffected: those are already opened by an explicit action.
        const isIdle = this.props.questionDetails.commentIndex == null
            && this.props.questionDetails.replyIndex == null
            && this.props.questionDetails.commentIndexToEdit == null
            && this.props.questionDetails.replyIndexToEdit == null;
        const isComposing = this.state != null && this.state.isComposing === true;

        return <div>
                {/* Only the top-level composer is rendered here. When a reply or an
                    edit is in progress the box is rendered inline next to the comment
                    it belongs to, so rendering it here as well would put two editors
                    on the page at once. */}
                {isIdle && (isComposing
                    ? this.getCommentPostBox()
                    : <div className='pb-4'>
                        <Button size="sm" variant="secondary" onClick={this.startComposing}>
                            Add a comment
                        </Button>
                    </div>
                )}
                {this.getCommentsJSX()}
            </div>;
    }

    render() {
        // This used to call `this.props.initializeQuestionComments()` from inside
        // render whenever the comments were still undefined, which re-fired the
        // fetch on every render pass until one landed. The parent loads comments in
        // componentDidMount; an undefined value here simply means "not yet".
        if (typeof window === 'undefined' || this.props.questionComments === undefined) {
            return <div className='py-3 px-2 border border-gray-100 bg-gray-50 rounded-lg flex flex-row items-center justify-center gap-2'>
                <div className={typography.caption}>Loading discussion</div>
                <ClipLoader color="#2563EB" size={20}/>
            </div>
        }
        const count = (this.props.questionComments || []).length;
        return (
            <div className='pb-2'>
                {/* The vote controls and author credit that used to sit here now live
                    in the solve page sidebar. Keeping them in both places meant two
                    sets of vote buttons on one screen, and the pair here were
                    click-handlers on <div>s, so they could not be reached by
                    keyboard at all. */}
                <div className='flex items-baseline justify-between gap-3 pb-3'>
                    <h2 className={typography.h3}>
                        Discussion
                    </h2>
                    {count > 0 &&
                        <span className={typography.caption}>
                            {count === 1 ? '1 comment' : count + ' comments'}
                        </span>
                    }
                </div>
                {count === 0 &&
                    <p className={typography.caption + ' pb-3'}>
                        No comments yet. If you solved this a different way, post it &mdash;
                        that is usually the most useful thing on the page.
                    </p>
                }
                {this.getComments()}
            </div>
        );
    }

}

export default QuestionComment;
