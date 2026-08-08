

import React from 'react';
import {currentHost} from './../constants/hostConfig';
import { logError } from '../utils/logger';


class PaperAPIsConnector extends React.Component  {

    static createNewPaper = async(requestPayload) => {
        try {
            let response = fetch(currentHost +'/paper', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });
            let data = await response;
            return "updated";
        } catch (e) {
            logError('PaperAPIsConnector.createNewPaper', e);
            return null;
        }
    }

    static submitPaper =  async(paperId, paperInstanceId, userEmail, isFullResponseNeeded, paperDetails) => {
        try {
            let paperResponseBody = {};
            Object.assign(paperResponseBody, {'paperId': paperId});
            Object.assign(paperResponseBody, {'questionIdToOptionIdMap': paperDetails.candidateResponses});
            Object.assign(paperResponseBody, {'currentQuestionNumber': paperDetails.currentQuestionNumber});
            Object.assign(paperResponseBody, {'questionStartTime': paperDetails.questionStartTime});
            Object.assign(paperResponseBody, {'questionsMarkedForReviews': [...paperDetails.questionsMarkedForReviews]});
            Object.assign(paperResponseBody, {'questionWiseTimeSpent': {...paperDetails.questionWiseTimeSpent}});
            Object.assign(paperResponseBody, {'paperStartTime': paperDetails.paperStartTime});
            let response = await fetch(currentHost + 'paper/submit?paper_id=' + paperId + "&paper_instance_id=" + paperInstanceId + "&is_full_response_needed="+isFullResponseNeeded+"&user_email="+userEmail, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paperResponseBody)
                }
            );
            let data = await response.json();
            return {data};
        } catch (e) {
            logError('PaperAPIsConnector.submitPaper', e);
            return null;
        }
    }

    static getAllFilteredPapers = async(searchKey, tagIds, channelIds) => {
        try {
            let response = await fetch(
                currentHost + 'suggestion/papers?paper_pattern=' + searchKey
                +"&tag_ids="+tagIds
                + "&start_index="+ 0
                + "&page_size=" + 100
            )
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('PaperAPIsConnector.getAllFilteredPapers', e);
            return null;
        }
    }

    static getUserSubmmittedPapersSummary = async(userEmail) => {
        try {
            let response = await fetch(currentHost + '/paper/submission/summary/user?user_email=' + userEmail)
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('PaperAPIsConnector.getUserSubmmittedPapersSummary', e);
            return null;
        }
    }


    static getPaperDetails = async(paperId, paperInstanceId) => {
        try {
            let response = await fetch(currentHost + 'paper?paper_id=' + paperId + '&paper_instance_id=' + paperInstanceId)
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('PaperAPIsConnector.getPaperDetails', e);
            return null;
        }
    }

    static getSubmittedPaperDetails = async(paperSubmissionResponseId) => {
        try {
            let response = await fetch(currentHost +'paper/submit?paper_submission_id=' + paperSubmissionResponseId)
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('PaperAPIsConnector.getSubmittedPaperDetails', e);
            return null;
        }
    }

}

export default PaperAPIsConnector;
