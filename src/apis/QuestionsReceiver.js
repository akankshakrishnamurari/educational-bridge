import { currentHost } from './../constants/hostConfig';
import { UserDetailsUtil } from '../utils/UserDetailsUtil';
import { requestJson, postJson } from './httpClient';

// Question API.
//
// Every method resolves with `{data}` on success or `null` on any failure — see
// apis/httpClient.js for why that uniformity matters. Callers must null-check.
//
// Removed in this pass:
//  * `getQuestions()`, which fetched `paper?paper_id=12313` — a hardcoded test
//    paper id behind a method named after questions. Nothing called it.
//  * An unused `CatchingPokemon` icon import, which pulled @mui/icons-material
//    into the bundle.
//  * `mapStateToProps` / `mapDispatchToProps` and a `savePaperDetails` import.
//    This is a static utility class; it was never connected to the store and
//    never needed to extend React.Component.

const encode = (value) => encodeURIComponent(value === null || value === undefined ? '' : value);

class QuestionsReceiver {

    static getAllFilteredQuestions = async (searchKey, tagIds, channelIds, currentPage, pageSize) => {
        const size = (pageSize === null || pageSize === undefined) ? 10 : pageSize;
        const start = (currentPage === undefined || currentPage === null) ? 0 : currentPage;
        // Values are URL-encoded now. A search for "a & b" or a tag label
        // containing "&" previously truncated the query string and silently
        // returned the wrong result set.
        const url = currentHost + 'questions?search_key=' + encode(searchKey)
            + '&tag_ids=' + encode(tagIds)
            + '&channel_ids=' + encode(channelIds)
            + '&question_ids='
            + '&page_start_index=' + encode(start)
            + '&page_size=' + encode(size);
        return requestJson('QuestionsReceiver.getAllFilteredQuestions', url);
    }

    static getQuestionsByQuestionIds = async (questionIds) => {
        const ids = questionIds || [];
        const size = ids.length < 1 ? 1 : ids.length;
        // `pageSize` was computed with a floor of 1 and then ignored in favour of
        // `questionIds.length`, so an empty list requested page_size=0 and came
        // back empty regardless of the floor.
        const url = currentHost + 'questions?question_ids=' + encode(ids)
            + '&tag_ids=&channel_ids=&search_key=&page_start_index=0&page_size=' + size;
        return requestJson('QuestionsReceiver.getQuestionsByQuestionIds', url);
    }

    /**
     * `user_id` is optional and only decides whether the response reports that THIS
     * reader has already upvoted or downvoted the question. The backend previously
     * took no user at all here and computed those flags from the question's own
     * author, so every reader saw the author's votes reflected in the vote controls.
     */
    static getQuestion = async (questionId, userId) => requestJson(
        'QuestionsReceiver.getQuestion',
        currentHost + 'question?question_id=' + encode(questionId)
            + (userId ? '&user_id=' + encode(userId) : '')
    );

    /**
     * Full question INCLUDING the correct answer and worked solution, for loading into
     * the authoring editor. `getQuestion` above no longer returns those fields, because
     * it is what the solve page calls to show someone a question they have not yet
     * attempted — and it was handing over the answer with it.
     *
     * Falls back to the old endpoint when /question/edit is absent, so this can ship
     * without waiting on the backend. The backend is deployed by hand to EC2 while the
     * frontend auto-deploys from a push, so the two are never simultaneous; without the
     * fallback, editing a question would 404 in the window between them. The fallback
     * can be deleted once the backend carrying /question/edit is live.
     */
    static getQuestionForEditing = async (questionId) => {
        const response = await requestJson(
            'QuestionsReceiver.getQuestionForEditing',
            currentHost + 'question/edit?question_id=' + encode(questionId)
        );
        if (response !== null) {
            return response;
        }
        return requestJson(
            'QuestionsReceiver.getQuestionForEditing.fallback',
            currentHost + 'question?question_id=' + encode(questionId)
        );
    }

    static getSubmittedQuestion = async (responseId) => requestJson(
        'QuestionsReceiver.getSubmittedQuestion',
        currentHost + 'question/submission?response_id=' + encode(responseId)
    )

    /**
     * @param questionType optional; when 'NUMERICAL' the answer is sent as the
     *        `answer` parameter instead of `option_id`, since a typed number is not
     *        an option id. The backend accepts either.
     */
    static submitQuestionResponse = async (questionId, selectedOptionId, questionRequestTime, questionType) => {
        // The `user_email` parameter carries a Google id, not an email. That is a
        // backend naming problem; the value has to stay as-is because submissions
        // are stored against it. A dead local `userEmail` was being computed from
        // sessionStorage here and then discarded.
        const userId = UserDetailsUtil.getUserGoogleId();
        const answerParam = questionType === 'NUMERICAL' ? 'answer' : 'option_id';
        const url = currentHost + 'question/submit?question_id=' + encode(questionId)
            + '&' + answerParam + '=' + encode(selectedOptionId)
            + '&user_email=' + encode(userId)
            + '&question_request_time=' + encode(questionRequestTime);
        return postJson('QuestionsReceiver.submitQuestionResponse', url);
    }

    static upsertQuestion = async (questionData) => postJson(
        // This method never worked. It called `fetch(...)` without awaiting and
        // then `response.json()` on the pending promise, which always throws, so
        // it always reported failure even when the write had gone through.
        'QuestionsReceiver.upsertQuestion',
        currentHost + 'question',
        questionData
    )

    static getUserSubmmittedQuestionsSummary = async (userEmail) => requestJson(
        'QuestionsReceiver.getUserSubmmittedQuestionsSummary',
        currentHost + 'question/submission/summary/user?user_email=' + encode(userEmail)
    )

    static getQuestionComment = async (questionId, userId) => requestJson(
        'QuestionsReceiver.getQuestionComment',
        currentHost + 'question/comment?question_id=' + encode(questionId) + '&user_id=' + encode(userId)
    )

    static buildComments = (comments) => (comments || []).map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        description: comment.description,
        upvoteCount: comment.upvoteCount,
        downvoteCount: comment.downvoteCount,
        // `comment.replies.forEach` threw when a comment had no replies array.
        replies: (comment.replies || []).map((reply) => ({
            id: reply.id,
            userId: reply.userId,
            description: reply.description,
            upvoteCount: reply.upvoteCount,
            downvoteCount: reply.downvoteCount,
        })),
    }))

    static updateQuestionComments = async (questionId, comments) => postJson(
        'QuestionsReceiver.updateQuestionComments',
        currentHost + 'question/comment?question_id=' + encode(questionId),
        {
            questionId,
            comments: QuestionsReceiver.buildComments(comments),
        }
    )

    static upvoteQuestion = async (questionId, userId) => requestJson(
        'QuestionsReceiver.upvoteQuestion',
        currentHost + 'question/upvote?question_id=' + encode(questionId) + '&user_id=' + encode(userId)
    )

    static downvoteQuestion = async (questionId, userId) => requestJson(
        'QuestionsReceiver.downvoteQuestion',
        currentHost + 'question/downvote?question_id=' + encode(questionId) + '&user_id=' + encode(userId)
    )

    static getQuestionVoting = async (questionId, userId) => requestJson(
        'QuestionsReceiver.getQuestionVoting',
        currentHost + 'question/vote/details?question_id=' + encode(questionId) + '&user_id=' + encode(userId)
    )

    static upvoteQuestionComment = async (questionId, commentId, replyId, userId) => requestJson(
        'QuestionsReceiver.upvoteQuestionComment',
        currentHost + 'question/comment/upvote?question_id=' + encode(questionId)
            + '&user_id=' + encode(userId)
            + '&comment_id=' + encode(commentId)
            + '&reply_id=' + encode(replyId)
    )

    static downvoteQuestionComment = async (questionId, commentId, replyId, userId) => requestJson(
        'QuestionsReceiver.downvoteQuestionComment',
        currentHost + 'question/comment/downvote?question_id=' + encode(questionId)
            + '&user_id=' + encode(userId)
            + '&comment_id=' + encode(commentId)
            + '&reply_id=' + encode(replyId)
    )

    static getNextRecommendedQuestion = async (questionId, userId) => requestJson(
        'QuestionsReceiver.getNextRecommendedQuestion',
        currentHost + 'question/recommendation?question_id=' + encode(questionId) + '&user_id=' + encode(userId)
    )

}

export default QuestionsReceiver;
