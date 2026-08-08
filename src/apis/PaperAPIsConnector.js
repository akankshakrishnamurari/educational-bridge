import { currentHost } from './../constants/hostConfig';
import { requestJson, postJson } from './httpClient';

// Paper API. Resolves with `{data}` on success, `null` on any failure.
//
// `createNewPaper` was the worst offender in this file: it did not await the
// fetch, awaited the pending promise into an unused variable, and then returned
// the string "updated" unconditionally. A paper that failed to save with a 500
// reported success to the author, who then had no idea their paper was missing.

const encode = (value) => encodeURIComponent(value === null || value === undefined ? '' : value);

class PaperAPIsConnector {

    static createNewPaper = async (requestPayload) => postJson(
        'PaperAPIsConnector.createNewPaper',
        currentHost + 'paper',
        requestPayload
    )

    static submitPaper = async (paperId, paperInstanceId, userEmail, isFullResponseNeeded, paperDetails) => {
        const paperResponseBody = {
            paperId,
            questionIdToOptionIdMap: paperDetails.candidateResponses,
            currentQuestionNumber: paperDetails.currentQuestionNumber,
            questionStartTime: paperDetails.questionStartTime,
            questionsMarkedForReviews: [...(paperDetails.questionsMarkedForReviews || [])],
            questionWiseTimeSpent: { ...(paperDetails.questionWiseTimeSpent || {}) },
            paperStartTime: paperDetails.paperStartTime,
        };
        const url = currentHost + 'paper/submit?paper_id=' + encode(paperId)
            + '&paper_instance_id=' + encode(paperInstanceId)
            + '&is_full_response_needed=' + encode(isFullResponseNeeded)
            + '&user_email=' + encode(userEmail);
        return postJson('PaperAPIsConnector.submitPaper', url, paperResponseBody);
    }

    static getAllFilteredPapers = async (searchKey, tagIds, channelIds) => requestJson(
        'PaperAPIsConnector.getAllFilteredPapers',
        currentHost + 'suggestion/papers?paper_pattern=' + encode(searchKey)
            + '&tag_ids=' + encode(tagIds)
            + '&start_index=0&page_size=100'
    )

    static getUserSubmmittedPapersSummary = async (userEmail) => requestJson(
        'PaperAPIsConnector.getUserSubmmittedPapersSummary',
        currentHost + 'paper/submission/summary/user?user_email=' + encode(userEmail)
    )

    static getPaperDetails = async (paperId, paperInstanceId) => requestJson(
        'PaperAPIsConnector.getPaperDetails',
        currentHost + 'paper?paper_id=' + encode(paperId) + '&paper_instance_id=' + encode(paperInstanceId)
    )

    static getSubmittedPaperDetails = async (paperSubmissionResponseId) => requestJson(
        'PaperAPIsConnector.getSubmittedPaperDetails',
        currentHost + 'paper/submit?paper_submission_id=' + encode(paperSubmissionResponseId)
    )

}

export default PaperAPIsConnector;
