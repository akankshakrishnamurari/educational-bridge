import React from 'react';
import QuestionsReceiver from "../../apis/QuestionsReceiver"
import { connect } from 'react-redux';
import {updateSubmittedQuestionDetails} from '../../store/actions/solgressAction';
import SingleSelectMCQPreview from './../adminPortal/previews/SingleSelectMCQPreview';
import {JSXUtils} from "./../../utils/JSXUtils";
import {generalTextSize} from './../../constants/TextSizeConstants';
import { currentURLHost } from './../../constants/hostConfig';
import EducationalBridgeHeader from '../../js/header/EducationalBridgeHeader';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import JSONPretty from 'react-json-pretty';
import Collapsible from "react-collapsible";
import {AiOutlineDownSquare} from "react-icons/ai";
import ClipLoader from "react-spinners/ClipLoader";
import AdRail from '../../components/common/AdRail';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    updateSubmittedQuestionDetails: (payload) => dispatch(updateSubmittedQuestionDetails(payload))
})


const mapStateToProps = state => {
    return {
        submittedQuestionDetails: state.solgressReducer.submittedQuestionDetails
    };
}


class GeneralQuestionView extends React.Component {

    constructor(props) {
        super(props)
        this.updateQuestionAnswer = this.updateQuestionAnswer.bind(this);
    }

    updateQuestionAnswer = (questionId, optionId) => {
        let payload = {...this.props.submittedQuestionDetails};
        payload.selectedOptionId = optionId;
        this.props.updateSubmittedQuestionDetails(payload);
    }

    initializeSubmittedQuestionDetails = () => {
        const search = window.location.search;
        const responseId = new URLSearchParams(search).get('response_id');
        if(responseId === null || responseId === undefined) {
            return;
        }
        QuestionsReceiver.getSubmittedQuestion(responseId).then(submittedQuestionData=>{
            this.props.updateSubmittedQuestionDetails(submittedQuestionData.data);
        });
    }

    getUserLevelAnalysisDetails = () => {
        if(UserDetailsUtil.getUserGoogleId() != null) {
            let triggerContent =  <div className='flex flex-row items-center w-full bg-gray-50 px-4 py-3 rounded-t-lg'>
                <div className={typography.h3 + " w-full"}>
                    Your Analysis for this Question
                </div>
                <div className='flex justify-end text-gray-400'>
                    <AiOutlineDownSquare size={20}/>
                </div>
            </div>

            let triggerData =  <JSONPretty id="json-pretty" className='flex text-justify bg-white px-6 py-4' data={this.props.submittedQuestionDetails.userQuestionAnalyticsResponse}></JSONPretty>
            return <Collapsible 
                trigger={triggerContent}
                className = "border border-gray-100 rounded-lg mt-4 Collapsible__trigger">
                {triggerData}
            </Collapsible>;
        }
        return <div/>
    }

    render() {
        if(this.props.submittedQuestionDetails === undefined){
            this.initializeSubmittedQuestionDetails();
            return  <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>
        }
        const normalisedSelectedOptionId = JSXUtils.getNormalisedPreviewOptionId(this.props.submittedQuestionDetails.questionData.options, this.props.submittedQuestionDetails.selectedOptionId);
        const normalisedCorrectOptionId = JSXUtils.getNormalisedPreviewOptionId(this.props.submittedQuestionDetails.questionData.options, this.props.submittedQuestionDetails.questionData.correctOptionId);
        return (
            <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div className="w-full max-w-[1800px] mx-auto pr-4 sm:pr-6 lg:pr-8 py-8 flex gap-6 items-start">
                <AdRail />
                <div className="flex-1 min-w-0 max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                        <SingleSelectMCQPreview
                            questionText = {this.props.submittedQuestionDetails.questionData.description}
                            options = {JSXUtils.buildMCQOptionsPreviewData(this.props.submittedQuestionDetails.questionData.options, this.props.submittedQuestionDetails.questionData.options.length)}
                            selectedOptionId = {normalisedSelectedOptionId}
                            correctOption = {normalisedCorrectOptionId}
                            answerDescription = {this.props.submittedQuestionDetails.questionData.answerDescription}
                            needCompletePreview = {true}
                            optionIdToOptionResponseCount = {this.props.submittedQuestionDetails.optionIdToOptionResponseCount}
                            totalResponseCount = {this.props.submittedQuestionDetails.totalResponses}
                            correctOptionId = {normalisedCorrectOptionId}
                            submittedQuestionDetails = {this.props.submittedQuestionDetails}
                        />
                        {this.getUserLevelAnalysisDetails()}
                    </div>
                </div>
                <AdRail />
                </div>
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(GeneralQuestionView);
