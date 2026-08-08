import React from 'react';
import '../../App.css';
import { connect } from 'react-redux';
import {savePaperDetails} from '../../store/actions/solgressAction'
import SingleSelectMCQQuestion from "../questionSet/largeScreen/SingleSelectMCQQuestion";
import {JSXUtils} from "../../utils/JSXUtils";
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import { PaperViewHelperUtil } from '../../utils/PaperViewHelperUtil';
import {currentURLHost} from '../../constants/hostConfig';
import Countdown from 'react-countdown';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import { generalTextSize } from '../../constants/TextSizeConstants';
import ClipLoader from "react-spinners/ClipLoader";
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload))
})


const mapStateToProps = state => {
    return {
        paperDetails: state.solgressReducer.paperDetails
    };
}

class PaperView extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeSpeakerDetails = this.initializeSpeakerDetails.bind(this);
        this.moveToNextQuestion = this.moveToNextQuestion.bind(this);
        this.moveToPreviousQuestion = this.moveToPreviousQuestion.bind(this);
        this.saveQuestionOption = this.saveQuestionOption.bind(this);
        this.showQuestionPagingSection = this.showQuestionPagingSection.bind(this);
        this.changeCurrentQuestionNumber = this.changeCurrentQuestionNumber.bind(this);
    }

    initializeSpeakerDetails = () => {
        const search = window.location.search;
        const paperId = new URLSearchParams(search).get('paper_id');
        const paperInstanceId = new URLSearchParams(search).get('paper_instance_id');
        let payload = {
            "currentQuestionNumber" : 1,
            "questionStartTime" : Date.now(),
            "questionWiseTimeSpent" : {},
            "paper": {},
            "candidateResponses": {},
            "questionsMarkedForReviews": []
        };
        PaperAPIsConnector.getPaperDetails(paperId, paperInstanceId).then( paperData => {
            payload.paper = paperData.data;
            payload.questions = PaperViewHelperUtil.normalise(paperData.data);
            payload.paperStartTime = paperData.data.paperSubmissionResponse.paperStartTime;
            let isNewPaper = (paperData.data.paperSubmissionResponse.currentQuestionNumber==null); // only paper start time will be set in case of new paper
            if(!isNewPaper) {
                payload.currentQuestionNumber = paperData.data.paperSubmissionResponse.currentQuestionNumber;
                payload.questionStartTime = paperData.data.paperSubmissionResponse.questionStartTime==null?Date.now():paperData.data.paperSubmissionResponse.questionStartTime;
                payload.questionWiseTimeSpent = paperData.data.paperSubmissionResponse.questionWiseTimeSpent==null?{}:paperData.data.paperSubmissionResponse.questionWiseTimeSpent;
                payload.questionsMarkedForReviews = [...paperData.data.paperSubmissionResponse.questionsMarkedForReviews];
                payload.candidateResponses = this.buildCandidateResponse(paperData.data);
            }
            this.props.savePaperDetails(payload);
        });
    }

    buildCandidateResponse = (paperData) => {
        let candidateResponses = {};
        paperData.paperSubmissionResponse.questionSubmittedResponses.forEach ( questionResponse => {
            candidateResponses[questionResponse.questionData.id] = questionResponse.selectedOptionId;
        });
        return candidateResponses;
    }

    saveQuestionOption = (questionNumber, option) => {
        let payload = {...this.props.paperDetails};
        payload.questionOption = option;
        this.savePaperDetails(payload);
    }

    moveToPreviousQuestion = () => {
        this.changeCurrentQuestionNumber(parseInt(this.props.paperDetails.currentQuestionNumber)-1);
    }

    moveToNextQuestion = () => {
        this.changeCurrentQuestionNumber(parseInt(this.props.paperDetails.currentQuestionNumber)+1);
    }

    clearQuestionResponse = () => {
        let payload = {...this.props.paperDetails};
        let candidateResponses = {...payload.candidateResponses};
        let questionId = this.props.paperDetails.questions[this.props.paperDetails.currentQuestionNumber-1].id;
        delete candidateResponses[questionId];
        payload.candidateResponses = candidateResponses;
        this.savePaperDetails(payload);
    }

    changeCurrentQuestionNumber = (newQuestionNumber) => {
        if (newQuestionNumber < 1) {
            return;
        }
        if (newQuestionNumber > this.props.paperDetails.questions.length) {
            notify.info("No more questions available. Use the Submit button to finish the test.");
            return;
        }
        let payload = {...this.props.paperDetails};
        let currentQuestionId = this.props.paperDetails.questions[payload.currentQuestionNumber-1].id;
        let questionWiseTimeSpent = {...payload.questionWiseTimeSpent};
        let timeSpentOnQuestion = 
            (questionWiseTimeSpent.hasOwnProperty(currentQuestionId)?parseInt(questionWiseTimeSpent[currentQuestionId]):0)
            + (Date.now()-payload.questionStartTime);
        questionWiseTimeSpent[currentQuestionId] = timeSpentOnQuestion;
        payload.currentQuestionNumber = newQuestionNumber;
        payload.questionWiseTimeSpent = questionWiseTimeSpent;
        payload.questionStartTime = Date.now();
        this.savePaperDetails(payload);
    }

    updateQuestionAnswer = (questionId, optionId) => {
        let payload = {...this.props.paperDetails};     
        let candidateResponses = {...payload.candidateResponses};
        candidateResponses[questionId] = optionId;
        payload.candidateResponses = candidateResponses;
        this.savePaperDetails(payload);
    }

    markQuestionForReview = () => {
        let payload = {...this.props.paperDetails};
        let questionId = payload.questions[payload.currentQuestionNumber-1].id;

        let questionsMarkedForReviews = [...payload.questionsMarkedForReviews];
        if(questionsMarkedForReviews.includes(questionId)) {
            return;
        }
        questionsMarkedForReviews.push(questionId);
        payload.questionsMarkedForReviews = questionsMarkedForReviews;
        this.savePaperDetails(payload);
    }

    unmarkQuestionForReview = () => {
        let payload = {...this.props.paperDetails};
        let questionId = payload.questions[payload.currentQuestionNumber-1].id;

        let questionsMarkedForReviews = [...payload.questionsMarkedForReviews];
        if(!questionsMarkedForReviews.includes(questionId)) {
            return;
        }
        questionsMarkedForReviews = questionsMarkedForReviews.filter(function(item) {return item !== questionId})
        payload.questionsMarkedForReviews = questionsMarkedForReviews;
        this.savePaperDetails(payload);
    }

    savePaperDetails = (payload) => {
        const search = window.location.search;
        const paperId = new URLSearchParams(search).get('paper_id');
        const paperInstanceId = new URLSearchParams(search).get('paper_instance_id');
        const userDetails = window.sessionStorage.userDetails;
        let userEmail = null;
        if(userDetails != null && userDetails != "null" && userDetails != undefined) {
            userEmail=JSON.parse(userDetails).email;
        }
        PaperAPIsConnector.submitPaper(paperId, paperInstanceId, userEmail, true, this.props.paperDetails).then()
        this.props.savePaperDetails(payload);
    } 

    getReviewJSX = () => {
        let payload = {...this.props.paperDetails};
        let questionId = payload.questions[payload.currentQuestionNumber-1].id;
        if(payload.questionsMarkedForReviews.includes(questionId)) {
            return <button className="flex items-center text-sm font-medium text-warning-700 hover:text-warning-800 transition-colors" onClick={this.unmarkQuestionForReview}>
                Unmark for review
            </button>;
        } else {
            return <button className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors" onClick={this.markQuestionForReview}>
                Mark for review
            </button>;
        }
    }

    showQuestionPagingSection = () => {
        return <div className='w-full'>
            <div className="flex items-center justify-center py-6 lg:px-0 sm:px-6 px-4">
                <div className="w-full flex items-center justify-between border-t border-gray-200 pt-4">
                    <button className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors" onClick={this.moveToPreviousQuestion}>
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                            <path d="M1.1665 4H12.8332" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                            <path d="M1.1665 4L4.49984 7.33333" stroke="currentColor" strokeWidth="1.25"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M1.1665 4.00002L4.49984 0.666687" stroke="currentColor" strokeWidth="1.25"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Save and Previous
                    </button>
                    <button className="text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors" onClick={this.clearQuestionResponse}>
                        Clear Response
                    </button>
                    {this.getReviewJSX()}
                    <button className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors" onClick={this.moveToNextQuestion}>
                        Save and Next
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                            <path d="M1.1665 4H12.8332" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                            <path d="M9.5 7.33333L12.8333 4" stroke="currentColor" strokeWidth="1.25"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.5 0.666687L12.8333 4.00002" stroke="currentColor" strokeWidth="1.25"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>;
    }

    showQuestionStatus = () => {
        let questionStatuses = []
        this.props.paperDetails.questions.forEach((question, index) => {
            let statusClasses = 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
            let questionId = question.id;
            if(this.props.paperDetails.candidateResponses[questionId] != undefined) {
                statusClasses = 'bg-success-500 border-success-500 text-white hover:bg-success-600';
            }
            if(this.props.paperDetails.questionsMarkedForReviews.includes(questionId)) {
                statusClasses = 'bg-warning-400 border-warning-400 text-white hover:bg-warning-500';
            }
            let className = "w-9 h-9 mx-1 my-1 flex items-center justify-center transition-colors rounded-lg border text-xs font-medium focus:outline-none " + statusClasses;
            questionStatuses.push(
                <button key={questionId} className={className}
                    onClick={() => this.changeCurrentQuestionNumber(index+1)}
                >
                    {index+1}
                </button>
            );
        })
        return <div className="px-6 py-3 flex flex-wrap">
            {questionStatuses}
        </div>;
    }

    submitPaper = () => {
        const search = window.location.search;
        const paperId = new URLSearchParams(search).get('paper_id');
        const paperInstanceId = new URLSearchParams(search).get('paper_instance_id');
        const userDetails = window.sessionStorage.userDetails;
        let userEmail = null;
        if(userDetails != null && userDetails != "null" && userDetails != undefined) {
            userEmail=JSON.parse(userDetails).email;
        }
        PaperAPIsConnector.submitPaper(paperId, paperInstanceId, userEmail, false, this.props.paperDetails).then( response => {
        })
        window.location.href = currentURLHost + "paper/submission/view?paper_submission_response_id=" + paperInstanceId;
    }

    getQuestionNumberHeader = ( questionNumber) => {
        let remainingTimeInMillis = (this.props.paperDetails.paper.allotted_paper_time*60*1000+this.props.paperDetails.paperStartTime-Date.now()); // For now all papers have 3 hours allowed.
        let timeBGColor = "bg-success-50"
        let textColor = "text-success-700";
        if(remainingTimeInMillis<0.05*this.props.paperDetails.paper.allotted_paper_time*60*1000){ // <5% Time remaining
            textColor = 'text-danger-700';
            timeBGColor = 'bg-danger-50'
        } else if(remainingTimeInMillis<0.20*this.props.paperDetails.paper.allotted_paper_time*60*1000){ // <20%time remaining
            textColor = 'text-warning-700';
            timeBGColor = 'bg-warning-50'
        }
        return <div className="flex items-center justify-between w-full bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
            <div className={typography.h3}>
                Question {questionNumber}
            </div>
            <div className={"flex items-center gap-2 rounded-full px-3 py-1.5 " + timeBGColor}>
                <span className={typography.caption}>Time Remaining</span>
                <span className={textColor + ' font-bold text-sm'}>
                    <Countdown 
                        date={Date.now() + remainingTimeInMillis}
                        daysInHours = {true}
                    />
                </span>
            </div>
        </div>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.paperDetails === undefined) {
            this.initializeSpeakerDetails();
            return <div>
                <div className='bg-gray-50 min-h-screen'>
                    <EducationalBridgeHeader/>
                    <div className='flex justify-center py-20'>
                        <ClipLoader color="#2563EB" size="60"/>
                    </div>
                </div>
            </div>;
        }
        let currentQuestionNumber =  this.props.paperDetails.currentQuestionNumber;
        let currentQuestionDetails = this.props.paperDetails.questions[currentQuestionNumber-1];
        let selectedOptionId = this.props.paperDetails.candidateResponses[currentQuestionDetails.id];
        return (
            <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div className="flex w-full">
                    <div className="w-full flex flex-col sm:flex-row flex-nowrap sm:flex-wrap xl:flex-nowrap justify-center items-start md:px-8 lg:px-16 py-6 gap-4">
                        <div className="w-full lg:w-9/12">
                            <div className="flex flex-col gap-4">
                                {this.getQuestionNumberHeader(currentQuestionNumber)}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                                    <SingleSelectMCQQuestion
                                        questionDetails = {currentQuestionDetails}
                                        selectedOptionId = {selectedOptionId}
                                        updateQuestionAnswer = {this.updateQuestionAnswer}
                                    />
                                    {this.showQuestionPagingSection()}
                                </div>
                            </div>
                        </div>
                        <div className="w-full lg:w-3/12 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className={typography.h3}>Questions</div>
                            {this.showQuestionStatus()}
                            <div className="pt-2">
                                <Button variant="primary" className="w-full" onClick= {() => this.submitPaper()}>
                                    Submit Paper
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperView);
