import React from 'react';
import '../App.css';
import SingleSelectMCQQuestion from "../questionSet/largeScreen/SingleSelectMCQQuestion";
import {JSXUtils} from "../../utils/JSXUtils";

class QuestionView extends React.Component {

    constructor(props) {
        super(props)
        this.saveQuestionOption = this.saveQuestionOption.bind(this);
        this.updateQuestionAnswer = this.updateQuestionAnswer.bind(this);
    }

    saveQuestionOption = () => {
        this.props.saveQuestionOption(this.props.currentQuestionNumber, 'A');
    }

    updateQuestionAnswer = (questionId, optionId) => {
        this.props.updateQuestionAnswer(questionId, optionId);
    }

    render() {
        let currentQuestionNumber = this.props.paperDetails.currentQuestionNumber;
        let questionDetails = this.props.paperDetails.paper.data.questions[currentQuestionNumber-1];
        return (
            <div className=" justify-between w-full " >
                {JSXUtils.getQuestionNumberView(currentQuestionNumber)}
                <SingleSelectMCQQuestion
                    questionDetails = {this.props.questionDetails}
                    selectedOptionId = {this.props.paperDetails.candidateResponses[questionDetails.id]}
                    updateQuestionAnswer = {this.updateQuestionAnswer}
                />
                <div className="flex items-center justify-between w-full">
                    <div
                        className="flex flex-col lg:flex-row w-full items-start lg:items-center rounded bg-white shadow">
                    </div>
                </div>
            </div>
        );
    }

}

export default QuestionView;
