// Pure data reshaping only — no React and no API calls, so neither is imported.
// Both used to be imported here and neither was ever referenced.

export class PaperViewHelperUtil {

    static normalise(paperDetails) {
        let normalisedPaperDetails = [];
        for(let subject in paperDetails.subject_wise_section_wise_questions) {
            for(let section in paperDetails.subject_wise_section_wise_questions[subject]) {
                for(let questionId in paperDetails.subject_wise_section_wise_questions[subject][section].question_id_to_question_details) {
                    let question = {...paperDetails.subject_wise_section_wise_questions[subject][section].question_id_to_question_details[questionId]};
                    question.subjectName = subject;
                    question.sectionName = section;
                    normalisedPaperDetails.push({...question});
                }

            }
        }
        return normalisedPaperDetails;
    }
}