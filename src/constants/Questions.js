export const questions = [
    {
        questionId : "STUDENT_GRADE_DETERMINATION",
        questionInstruction : "Which of the following holds true for you ?",
        askingConditionTags: ["AGE_GROUP_12_15","BETA_USERS"],
        options : [
            {
                "tag" : "AGE_GROUP_12_15",
                "value" : "10th Grade Student",
                "nextQuestionId" : "NO_MORE_QUESTIONS"
            },
            {
                "tag" : "AGE_GROUP_12_15",
                "value" : "11th/12th Grade Student",
                "nextQuestionId" : "NO_MORE_QUESTIONS"
            },
            {
                "tag" : "AGE_GROUP_12_15",
                "value" : "None",
                "nextQuestionId" : "UNSUPPPORTED_USER_GROUP"
            }
        ]
    },
    {
        questionId : "10TH_GRADE_STUDENT_ISSUES",
        questionInstruction : "What is your concern related to?",
        options : [
            {
                "tag" : "Study related",
                "value" : "10th Grade Student",
                "nextQuestionId" : "NO_MORE_QUESTIONS"
            },
            {
                "tag" : "Family issues",
                "value" : "11th/12th Grade Student",
                "nextQuestionId" : "NO_MORE_QUESTIONS"
            },
            {
                "tag" : "Friends",
                "value" : "None",
                "nextQuestionId" : "UNSUPPPORTED_USER_GROUP"
            }
        ]
    }
];