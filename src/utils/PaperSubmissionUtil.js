import React from "react";
import PaperAPIsConnector from "../apis/PaperAPIsConnector";
import { UserDetailsUtil } from './UserDetailsUtil';


export class PaperSubmissionUtil {

    static submitPaper =  async (paperReduxDetails) => {
        let paperRequest  = {};
        for(let subjectIndex = 0; subjectIndex < paperReduxDetails.numberOfSubjects; subjectIndex++) {
            let subjectName = paperReduxDetails.subjectNames[subjectIndex];
            paperRequest[subjectName] = {};
            for(let sectionIndex = 0; sectionIndex < paperReduxDetails.subjectWiseNumberOfSections[subjectIndex]; sectionIndex++) {
                let sectionName = paperReduxDetails.subjectWiseSectionNames[subjectIndex][sectionIndex];
                let questionIds = [];
                for (let questionIndex = 0; questionIndex < paperReduxDetails.subjectWiseSectionWiseNumberOfQuestions[subjectIndex][sectionIndex]; questionIndex++) {
                    questionIds.push(
                        paperReduxDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName][questionIndex]
                    );
                }
                paperRequest[subjectName][sectionName] = {};
                paperRequest[subjectName][sectionName]["question_ids"] = questionIds;
                paperRequest[subjectName][sectionName]["correct_answer_marks"] = 4;
                paperRequest[subjectName][sectionName]["incorrect_answer_marks"] = -1;
            }
        }
        let requestPayload = {};
        requestPayload["paper_name"] = paperReduxDetails.paperName;
        requestPayload["allotted_paper_time"] = parseInt(paperReduxDetails.allottedPaperTime);
        requestPayload["subject_wise_section_wise_questions"] = paperRequest;
        let tagIds = [];
        paperReduxDetails.tags.forEach(tag=>{
            tagIds.push(tag.id);
        })
        requestPayload["tags"] = tagIds;
        requestPayload["created_by"] = UserDetailsUtil.getUserGoogleId();
        await PaperAPIsConnector.createNewPaper(requestPayload);
        return "updated the paper";
    };
}