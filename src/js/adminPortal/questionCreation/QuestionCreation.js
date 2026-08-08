import React from 'react';
import { connect } from 'react-redux';
import {updateNewQuestionDetails} from '../../../store/actions/solgressAction'
import SingleSelectMCQEditor from '../questionAdditionPortal/SingleSelectMCQEditor'
import Split from "react-split";
import SingleSelectMCQPreview from "../previews/SingleSelectMCQPreview";
import {JSXUtils} from "../../../utils/JSXUtils";
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import NewQuestionTagComponent from "./NewQuestionTagComponent";
import NewQuestionChannelComponent from "./NewQuestionChannelComponent"
import {CSSConventionUtil} from "../../../utils/CSSConventionUtil";
import {generalTextSize, smallerTextSize} from './../../../constants/TextSizeConstants';
import EducationalBridgeHeader from '../../header/EducationalBridgeHeader';
import {currentURLHost} from './../../../constants/hostConfig';
import SingleSelectMCQQuestion from '../../questionSet/largeScreen/SingleSelectMCQQuestion';
import ClipLoader from "react-spinners/ClipLoader";
import {UserDetailsUtil} from "../../../utils/UserDetailsUtil";
import notify from '../../../utils/notify';
import Button from '../../../components/common/Button';
import { typography } from '../../../constants/designTokens';


const mapDispatchToProps = dispatch => ({
    updateNewQuestionDetails: (payload) => dispatch(updateNewQuestionDetails(payload))
})


const mapStateToProps = state => {
    return {
        newQuestionDetails: state.solgressReducer.newQuestionDetails
    };
}

class QuestionCreation extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeNewQuestionDetails = this.initializeNewQuestionDetails.bind(this);
    }

    updateQuestionDetails = (event, editor) => {
        this.saveQuestionDescription(editor.getData());
    }


    saveQuestionDescription = (data) => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.questionDescription = data;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    initializeNewQuestionDetails = () => {
        const search = window.location.search;
        const questionId = new URLSearchParams(search).get('question_id');
        if(questionId === undefined || questionId === null) {
            let payload = {
                "questionType" : 'SINGLE_SELECT_MCQ',
                "isEditingQuestion": true,
                "questionDescription": '<p><span style="background-color: #e03e2d;"><strong>Note : </strong>This is a sample Question. Please update it as per your need.</span></p>\n<p style="text-align: left;">&nbsp;</p>\n<p style="text-align: left;">If Gopal is <strong>exactly 2 year younger</strong> than Murari today is Murari\'s birthday. What would be age of <span style="background-color: #86f363;">Gopal exactly one year after today in months ?</span></p>',
                "options" : [{
                    id: 'option1',
                    text: '25'
                  },
                  {
                    id: 'option2',
                    text: '24'
                  },
                  {
                    id: 'option3',
                    text: '300'
                  },
                  {
                    id: 'option4',
                    text: '288'
                  }],
                "numberOfOptions":4,
                "optionsEditing":[],
                "selectedPreviewOption":{},
                "tags": [],
                "channels": [],
                "correctOptions": [2],
                "helpSectionEnabled": false,
                "isCheckingPreviewWhileEditingQuestion": false,
                "fulfilled": false

            };
            this.props.updateNewQuestionDetails(payload);
        }
        else {
            QuestionsReceiver.getQuestion(questionId).then(questionData=>{
                let payload = {
                    "id" : questionData.data.id,
                    "questionType" : questionData.data.questionType,
                    "isEditingQuestion": true,
                    "questionDescription" : questionData.data.description,
                    "answerDescription": questionData.data.answerDescription,
                    "options" : questionData.data.options,
                    "numberOfOptions":questionData.data.options.length,
                    "optionsEditing":[],
                    "selectedPreviewOption":{},
                    "tags":questionData.data.tags,
                    "channels":[],
                    "correctOptions": [JSXUtils.getNormalisedPreviewOptionId(questionData.data.options, questionData.data.correctOptionId)],
                    "helpSectionEnabled": false,
                    "selectedChannel": questionData.data.channel===null?undefined:questionData.data.channel,
                    "searchedChannelKey": questionData.data.channel===null?"":questionData.data.channel.channelName,
                    "isCheckingPreviewWhileEditingQuestion": false,
                    "fulfilled": questionData.data.fulfilled
                };
                this.props.updateNewQuestionDetails(payload);
            });
        }
    }

    updateNumberOfOption = (event) => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.numberOfOptions = event.target.value;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    updateQuestionType = () => {

    }

    getHelpSectionJSX = () => {
        if(!this.props.newQuestionDetails.helpSectionEnabled) {
            return <div/>;
        }
        return <div>
            <div className="bg-success-50 py-2">
                <h3 className = {generalTextSize}>
                    Help Section
                </h3>
            </div>
            <p className={generalTextSize + ' py-2'}>
                1. How to create a multiple choice question on educationalbridge ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/y7169jEvb-Y" className='w-full'/>
        </div>
    }

    updateHelpSectionEnabling = (event) => {
        let payload = {...this.props.newQuestionDetails};
        payload.helpSectionEnabled = event.target.checked;
        this.props.updateNewQuestionDetails(payload);
    }

    renderQuestionConfigurationView =   () => {
        return <div className="h-full w-full">
            <div className=" px-2 mx-auto justify-between w-full" >
                <div className="flex lg:flex-row flex-col w-full">
                    <div className="flex flex-row ...">
                        <div className=''>
                            <h4 className={generalTextSize + " leading-tight text-gray-800 py-3"}>
                                Enable Help Section:
                            </h4>
                        </div>
                        <div class="flex justify-center px-2">
                            <input type="checkbox" onChange = {(event) => this.updateHelpSectionEnabling(event)}/>
                        </div>
                    </div>
                </div>
                <div className="flex lg:flex-row flex-col items-center pb-2 w-full">
                    <div className="flex flex-row w-full ...">
                        <div>
                            <h4 className={generalTextSize + " leading-tight text-gray-800 pr-2"}>
                                Question Type :
                            </h4>
                        </div>
                        <div class="flex justify-center ">
                                <select 
                                    class={smallerTextSize + " px-2 bg-white border border-solid rounded flex h-fit py-1"}
                                    onChange={this.updateQuestionType()}>
                                    <option value="SINGLE_SELECT_MCQ" selected className={smallerTextSize + "px-1"}>MCQ (Single Select)</option>
                                </select>
                            </div>
                    </div>
                </div>
                <div className="flex lg:flex-row flex-col items-center pb-2 w-full">
                    <div className="flex flex-row w-full ...">
                        <div>
                            <h4 className={generalTextSize + " leading-tight text-gray-800 "}>
                                Number of options :
                            </h4>
                        </div>
                        <input className={"mx-2 font-normal w-12 flex items-center px-4 " + generalTextSize }
                               placeholder="Placeholder"
                               value = {this.props.newQuestionDetails.numberOfOptions}
                               onChange={(event)=>this.updateNumberOfOption(event)}
                        />
                    </div>
                </div>
            </div>
            <div className="max-h-screen">
                {this.getHelpSectionJSX()}
            </div>
        </div>;
    }

    clearOption = () => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.selectedPreviewOption = {};
        this.props.updateNewQuestionDetails(questionDetails);
    }


    selectOption = (selectedOptionId) => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.selectedPreviewOption = selectedOptionId;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    previewQuestionJSX = () => {
        if(this.props.newQuestionDetails.questionType == 'SINGLE_SELECT_MCQ') {
            // let submittedQuestionDetails = {"questionData":this.props.newQuestionDetails, "selectedOptionId":this.props.newQuestionDetails.selectedPreviewOption};
            // return <div className='w-full flex flex-row bg-primary-50'>
            //     <div className='w-4/12'></div>
            //     <div className='bg-white'>
            //         <SingleSelectMCQQuestion
            //             questionDetails={this.props.newQuestionDetails}
            //             questionText = {this.props.newQuestionDetails.questionDescription}
            //             options = {JSXUtils.buildMCQOptionsPreviewData(this.props.newQuestionDetails.options, this.props.newQuestionDetails.numberOfOptions)}
            //             selectedOptionId = {this.props.newQuestionDetails.selectedPreviewOption}
            //             clearOption = {this.clearOption}
            //             selectOption = {this.selectOption}
            //             correctOption = {this.props.newQuestionDetails.correctOptions[0]}
            //             answerDescription = {this.props.newQuestionDetails.answerDescription}
            //             needCompletePreview = {true}
            //             submittedQuestionDetails = {submittedQuestionDetails}
            //         />
            //     </div>
            //     <div className='w-4/12'></div>
            // </div>;
                return <div className=" min-h-screen " >
                    <div className="flex flex-col md:flex-row ..." >
                        <div className='max-w-[0%] lg:min-w-[15%] lg:max-w-[15%]'>
                            {/* Position for ads */}
                        </div>
                        <div  className='w-full'>
                            <SingleSelectMCQQuestion
                                questionDetails={this.props.newQuestionDetails}
                                // questionText = {this.props.newQuestionDetails.questionDescription}
                                options = {JSXUtils.buildMCQOptionsPreviewData(this.props.newQuestionDetails.options, this.props.newQuestionDetails.numberOfOptions)}
                                // tags={this.props.n}
                                
                                // selectedOptionId = {this.props.newQuestionDetails.selectedPreviewOption}
                                // clearOption = {this.clearOption}
                                // selectOption = {this.selectOption}
                                // correctOption = {this.props.newQuestionDetails.correctOptions[0]}
                                // answerDescription = {this.props.newQuestionDetails.answerDescription}
                                // needCompletePreview = {true}
                                // submittedQuestionDetails = {submittedQuestionDetails}
                            />
                        </div>
                        <div className='max-w-[0%] lg:min-w-[15%] lg:max-w-[15%]'>
                            {/* Position for ads */}
                        </div>
                    </div>
                </div>;
            // return <div className=" min-h-screen  ">
            //     <div className="flex flex-col md:flex-row ..." >
            //         <div className=" md:w-screen xl:w-3/12 px-4 bg-slate-100 border">
            //             {/* {this.renderQuestionConfigurationView()} */}
            //         </div>
            //         <SingleSelectMCQQuestion
            //             questionDetails={this.props.newQuestionDetails}
            //             // isEditingQuestion={this.props.newQuestionDetails.isEditingQuestion}
            //             questionText = {this.props.newQuestionDetails.questionDescription}
            //             options = {JSXUtils.buildMCQOptionsPreviewData(this.props.newQuestionDetails.options, this.props.newQuestionDetails.numberOfOptions)}
            //             selectedOptionId = {this.props.newQuestionDetails.selectedPreviewOption}
            //             // clearOption = {this.clearOption}
            //             // selectOption = {this.selectOption}
            //             // correctOption = {this.props.newQuestionDetails.correctOptions[0]}
            //             // answerDescription = {this.props.newQuestionDetails.answerDescription}
            //             // needCompletePreview = {true}
            //             // submittedQuestionDetails = {submittedQuestionDetails}
            //         />
            //         <div className=" md:w-screen xl:w-3/12 px-4 bg-slate-100">
            //             {/* Ads */}
            //         </div>
            //     </div>
            // </div>;
        }
        return <div>No preview supported for the given component type</div>;
    }

    renderQuestionCaptureView = () => {
        return <div className="w-full  shadow bg-white ">
            <SingleSelectMCQEditor editorRef = {this.props.editorRef}/>
            <div className={CSSConventionUtil.questionDescriptionCSS}>
                <div className='flex lg:flex-row justify-between'>
                    <div>
                        <h4 className={generalTextSize + " font-bold float my-1"}>
                            Question Tags
                        </h4>
                    </div>
                </div>
            </div>
            <NewQuestionTagComponent/>
            {/* <NewQuestionChannelComponent/> */}
            <div className={CSSConventionUtil.questionDescriptionCSS}>
                <div className='flex lg:flex-row justify-between'>
                    <div>
                        <h4 className={generalTextSize + " font-bold float my-1"}>
                            Auditor Section
                        </h4>
                    </div>
                </div>
            </div>
            <div className="flex flex-row items-center gap-3 px-5 py-3">
                <div className={typography.body}>
                    Confirm if you've audited this question
                </div>
                <select className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={this.props.newQuestionDetails.fulfilled}
                    onChange={(event => this.updateIfQuestionIsAudited(event))}
                >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div className='pb-10 pt-2'>
                <Button variant="primary" onClick={this.saveAndSubmitQuestion}>
                    Submit
                </Button>
            </div>
        </div>;
    }

    getQuestionCreationViewJSX = () => {
        return <div className=" min-h-screen ">
            <div className="flex flex-col md:flex-row ..." >
                <div className='max-w-[100%] lg:min-w-[20%] lg:max-w-[20%]'>
                    {this.renderQuestionConfigurationView()}
                </div>
                {this.renderQuestionCaptureView()}
                <div className='max-w-[0%] lg:min-w-[5%] lg:max-w-[5%]'>
                    {/* Position for ads */}
                </div>
            </div>
        </div>;
    }

    updateIfQuestionIsAudited = (event) => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.fulfilled = event.target.value;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    flipCheckingPreviewWhileEditingQuestionFlag = () => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.isCheckingPreviewWhileEditingQuestion = !questionDetails.isCheckingPreviewWhileEditingQuestion;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    getEditQuestionButton = () => {
        const isActive = this.props.newQuestionDetails.isCheckingPreviewWhileEditingQuestion;
        return <button className={"px-4 py-2 text-sm font-medium border transition-colors " + (isActive ? "bg-white text-gray-600 border-gray-300 hover:bg-gray-50" : "bg-primary-600 text-white border-primary-600 hover:bg-primary-700")}>
            Edit Question
        </button>;
    }

    getPreviewQuestionButton = () => {
        const isActive = this.props.newQuestionDetails.isCheckingPreviewWhileEditingQuestion;
        return <button className={"px-4 py-2 text-sm font-medium border transition-colors " + (isActive ? "bg-primary-600 text-white border-primary-600 hover:bg-primary-700" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50")}>
            Preview Question
        </button>;
    }

    saveAndSubmitQuestion = () => {
        let tagIds = [];
        for(let i=0 ; i<this.props.newQuestionDetails.tags.length; i++) {
            tagIds.push(this.props.newQuestionDetails.tags[i].id);
        }
        let question = {};
        question.id = this.props.newQuestionDetails.id;
        question.questionType = this.props.newQuestionDetails.questionType;
        question.name = "New Question";
        question.description = this.props.newQuestionDetails.questionDescription;
        let options = [];
        for(let i=0; i<this.props.newQuestionDetails.numberOfOptions; i++) {
            options.push({...this.props.newQuestionDetails.options[i]});
        }
        question.options = options;
        question.tagIds = tagIds;
        if(this.props.newQuestionDetails.selectedChannel !== undefined) {
            question.channelId = this.props.newQuestionDetails.selectedChannel.id;
        }
        question.answerDescription = this.props.newQuestionDetails.answerDescription;
        question.correctOptionId = this.props.newQuestionDetails.options[this.props.newQuestionDetails.correctOptions[0]].id;
        question.createdBy = UserDetailsUtil.getUserGoogleId();   
        question.isFulfilled = this.props.newQuestionDetails.fulfilled;
        console.log(question);
        QuestionsReceiver.upsertQuestion(question).then(questionData=>{
           notify.success("Question saved successfully.");
           window.location.href = currentURLHost + "question/view?question_id="+ questionData.data.id;
        });
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.newQuestionDetails === undefined){
            this.initializeNewQuestionDetails();
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>
        }
        return (
            <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div>
                    <div className="flex justify-center z-0 w-full bg-white border-b border-gray-100">
                        <div className="flex" onClick={this.flipCheckingPreviewWhileEditingQuestionFlag}> 
                            {this.getPreviewQuestionButton()}
                            {this.getEditQuestionButton()}
                        </div>
                    </div>
                    {this.props.newQuestionDetails.isCheckingPreviewWhileEditingQuestion
                        ? this.previewQuestionJSX()
                        : this.getQuestionCreationViewJSX()}
                </div>
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionCreation);
