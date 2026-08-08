import PaperAPIsConnector from "../apis/PaperAPIsConnector";
import { UserDetailsUtil } from './UserDetailsUtil';

// Fallback marking scheme, used only when a section carries no configured value.
// The builder seeds every section with +3/-1, so these are reached only if the
// state is malformed. The standard JEE Main objective scheme is the safest default.
const DEFAULT_CORRECT_ANSWER_MARKS = 4;
const DEFAULT_INCORRECT_ANSWER_MARKS = -1;

/**
 * Read a configured marks value out of the builder's `[subject][section]` arrays.
 *
 * The inputs are `<input type="number">`, so the stored value is a string, and it
 * is empty while the field is being cleared and retyped. Both cases have to be
 * coerced before they reach the API.
 */
const marksAt = (table, subjectIndex, sectionIndex, fallback) => {
    const row = Array.isArray(table) ? table[subjectIndex] : undefined;
    const raw = Array.isArray(row) ? row[sectionIndex] : undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
};

export class PaperSubmissionUtil {

    /**
     * Builds the create-paper request from the builder's redux state and sends it.
     *
     * @returns {Promise<boolean>} true when the paper was created.
     *
     * WHY THIS RETURNS A BOOLEAN NOW
     * ------------------------------
     * It used to `await PaperAPIsConnector.createNewPaper(...)`, throw the result
     * away, and return the string "updated the paper" unconditionally. The API layer
     * signals failure by resolving with null rather than rejecting, so this function
     * could not fail — which meant the caller's try/catch never fired, and an author
     * who had just spent twenty minutes assembling a paper was told it had been
     * published and redirected away from it even when the request had 500'd. The
     * work was gone and nothing said so.
     */
    static submitPaper = async (paperReduxDetails) => {
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
                // THE AUTHOR'S MARKING SCHEME WAS BEING DISCARDED
                // -----------------------------------------------
                // These two lines were the literals 4 and -1. The paper builder has a
                // per-section positive and negative marks input for every section (see
                // NewPaperPortal.getSubjectwiseMarkingSchemeJSX), the paper overview
                // panel displays whatever the author typed, and the confirm dialog
                // repeats it back — and then this function threw all of it away and
                // sent +4/-1 for every section of every paper. An author who set up
                // +2/0 for a section got a paper that marked it +4/-1, with nothing in
                // the UI to indicate the substitution.
                paperRequest[subjectName][sectionName]["correct_answer_marks"] = marksAt(
                    paperReduxDetails.subjectWiseSectionPositiveMarks,
                    subjectIndex,
                    sectionIndex,
                    DEFAULT_CORRECT_ANSWER_MARKS
                );
                paperRequest[subjectName][sectionName]["incorrect_answer_marks"] = marksAt(
                    paperReduxDetails.subjectWiseSectionNegativeMarks,
                    subjectIndex,
                    sectionIndex,
                    DEFAULT_INCORRECT_ANSWER_MARKS
                );
            }
        }
        let requestPayload = {};
        requestPayload["paper_name"] = paperReduxDetails.paperName;
        requestPayload["allotted_paper_time"] = parseInt(paperReduxDetails.allottedPaperTime);
        requestPayload["subject_wise_section_wise_questions"] = paperRequest;
        let tagIds = [];
        (paperReduxDetails.tags || []).forEach(tag=>{
            tagIds.push(tag.id);
        })
        requestPayload["tags"] = tagIds;
        requestPayload["created_by"] = UserDetailsUtil.getUserGoogleId();
        const response = await PaperAPIsConnector.createNewPaper(requestPayload);
        return response != null;
    };
}
