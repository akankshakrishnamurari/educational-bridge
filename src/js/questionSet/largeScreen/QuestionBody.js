import React from 'react';
import SingleSelectMCQQuestion from './SingleSelectMCQQuestion';
import NumericalQuestion from './NumericalQuestion';

// Picks the body component for a question based on its type.
//
// Every screen used to render SingleSelectMCQQuestion unconditionally, which was
// fine while single-select was the only type that existed. NUMERICAL questions
// have no options, so that path renders OptionList's "no answer options recorded"
// empty state and offers the learner no way to answer. This is the one place that
// decides, so adding a further type means editing this file rather than hunting
// down every render site.
//
// All props are forwarded untouched: the call sites pass different subsets
// (solving, review, authoring preview, paper) and neither body component cares
// which it receives.

const QuestionBody = (props) => {
    const details = props.questionDetails;
    const questionType = details == null ? null : details.questionType;

    if (questionType === 'NUMERICAL') {
        return <NumericalQuestion {...props} />;
    }
    // Anything else, including a legacy document with no type recorded, is a
    // single-select MCQ.
    return <SingleSelectMCQQuestion {...props} />;
};

export default QuestionBody;
