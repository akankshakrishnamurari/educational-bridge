import React from 'react';
import '../../../App.css';
import {JSXUtils} from "../../../utils/JSXUtils";
import {CSSConventionUtil} from "../../../utils/CSSConventionUtil";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {generalTextSize} from './../../../constants/TextSizeConstants';
import SingleSelectMCQQuestion from '../../questionSet/largeScreen/SingleSelectMCQQuestion';
import Collapsible from "react-collapsible";
import {AiOutlineDownSquare} from "react-icons/ai";
import { currentURLHost } from '../../../constants/hostConfig';
import { UserDetailsUtil } from '../../../utils/UserDetailsUtil';
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import { Chart } from "react-google-charts";

class SingleSelectMCQPreview extends React.Component {

    getAdditionalPreview = () => {
        let solutionSectiontiggerContent = <div className={'flex flex-row w-full  bg-slate-50 px-3 py-2' }>
            <div className={ generalTextSize + "  font-bold w-full "}>
                Solution Section
            </div>
            <div className='flex justify-end'>
                <AiOutlineDownSquare size={25}/>
            </div>
        </div>
        return <div>
                    <Collapsible 
                        trigger={solutionSectiontiggerContent}
                        className = "border-b-2 Collapsible__trigger">
                        <div>
                            <p className={generalTextSize + "  text-left pl-2 md:pl-10 py-2 bg-success-50 border border-slate-200 ..."}>
                                <div className='flex justify-center'>
                                    Correct Option is : option {this.props.correctOption + 1}
                                </div>
                            </p>
                        </div>
                        {this.getAnswerDescriptionJSX()}
                    </Collapsible>
        </div>
    }

    getAnswerDescriptionJSX = () => {
        if(this.props.answerDescription == null || this.props.answerDescription.length < 2) {
            return <div className=' px-4 md:px-10 py-5 border border-slate-200 ...'>
                <p className={ generalTextSize + " flex text-justify "}>
                    <div dangerouslySetInnerHTML={{__html: "Answer Description is not yet updated by the problem author"}}></div>
                </p>
            </div>;
        }
        return <div className=' px-4 md:px-10 py-5 border border-slate-200 ...'>
            <p className={ generalTextSize + " flex text-justify "}>
                <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.answerDescription)}}></div>
            </p>
        </div>
    }

    redirectToNextRecommendedQuestion = () => {
        QuestionsReceiver.getNextRecommendedQuestion(this.props.submittedQuestionDetails.questionData.id, UserDetailsUtil.getUserGoogleId()).then(questionsData=>{
            let questionId = questionsData.data.questionId;
            window.location.href = currentURLHost+"question/view?question_id="+questionId;
        });
    }

    doNothing = () => {}

    getNextSimilarQuestionButton = () => {
        return <div className='pb-2 bg-white'>
            <button 
                className={CSSConventionUtil.buttonClassName}
                onClick = {() => this.redirectToNextRecommendedQuestion()}
            >
                <div className="px-2 ...">
                    <div class="animate-ping absolute inline-flex h-4 w-5 flex justify-center rounded-full bg-success-700 opacity-20"></div>
                    <div className={generalTextSize + " text-white ..."} >
                        Next Question
                    </div>
                </div>
            </button>
        </div>
    }

    render() {
        if(this.props.needCompletePreview == false) {
            return (
                <div className='border-2 border-bg-slate-500'>
                    <div className='pb-10 md:px-24 bg-white'>
                        <SingleSelectMCQQuestion
                            questionDetails = {this.props.questionDetails}
                            selectedOptionId = {null}
                            updateQuestionAnswer = {this.doNothing}
                            selectedOptionBackgroundColor ={"bg-success-200"}
                            needCompletePreview = {false}
                            optionIdToOptionResponseCount = {null}
                            totalResponseCount = {null}
                            submittedQuestionDetails = {null}
                            options = {this.props.options}
                        />
                    </div>
                </div>
            );
        }
        return (
            <div className='border-2 border-bg-slate-500'>
                <div className='pb-4 bg-white'>
                    <SingleSelectMCQQuestion
                        questionDetails = {this.props.submittedQuestionDetails.questionData}
                        selectedOptionId = {this.props.submittedQuestionDetails.selectedOptionId}
                        updateQuestionAnswer = {this.doNothing}
                        selectedOptionBackgroundColor ={this.props.selectedOptionId==this.props.correctOptionId?"bg-success-200":"bg-danger-200"}
                        needCompletePreview = {this.props.needCompletePreview}
                        optionIdToOptionResponseCount = {this.props.submittedQuestionDetails.optionIdToOptionResponseCount}
                        totalResponseCount = {this.props.submittedQuestionDetails.totalResponses}
                        submittedQuestionDetails = {this.props.submittedQuestionDetails}
                        options = {this.props.options}
                    />
                </div>
                {this.getNextSimilarQuestionButton()}
                {this.props.needCompletePreview?this.getAdditionalPreview():<div/>}
            </div>
        );
    }

}

export default SingleSelectMCQPreview;
