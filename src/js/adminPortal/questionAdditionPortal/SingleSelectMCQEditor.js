import React from 'react';
import { connect } from 'react-redux';
import {updateNewQuestionDetails} from '../../../store/actions/solgressAction'
import TextEditor from "../platformCapabilities/TextEditor";
import {JSXUtils} from "../../../utils/JSXUtils";
import {UserDetailsUtil} from "../../../utils/UserDetailsUtil";
import {CSSConventionUtil} from "../../../utils/CSSConventionUtil";
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import { ToastContainer, toast } from 'react-toastify';
import SingleSelectMCQPreview from "../previews/SingleSelectMCQPreview";
import EducationalBridgePopupBox from '../../coreCapabilities/EducationalBridgePopupBox';
import 'react-toastify/dist/ReactToastify.css';
import {generalTextSize} from './../../../constants/TextSizeConstants';
import { currentURLHost } from '../../../constants/hostConfig';

const mapDispatchToProps = dispatch => ({
    updateNewQuestionDetails: (payload) => dispatch(updateNewQuestionDetails(payload))
})


const mapStateToProps = state => {
    return {
        newQuestionDetails: state.solgressReducer.newQuestionDetails
    };
}

class SingleSelectMCQEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.renderQuestionDescriptionEditor = this.renderQuestionDescriptionEditor.bind(this);
        this.renderOptionsSelectionsEditor = this.renderOptionsSelectionsEditor.bind(this);
        this.selectSingleSelectMCQCorrectOption = this.selectSingleSelectMCQCorrectOption.bind(this);
        this.getCorrectOptionSelectionCheckbox = this.getCorrectOptionSelectionCheckbox.bind(this);
        this.getOptionCorrectnessSelectionButton = this.getOptionCorrectnessSelectionButton.bind(this);
        this.renderOptionEditorJSX = this.renderOptionEditorJSX.bind(this);
    }

    updateQuestionDetails = (data) => {
        this.saveQuestionDescription(data);
    }

    updateAnswerDetails = (data) => {
        this.saveAnswerDescription(data);
    }

    updateOptionData = (data) => {
        this.saveOptionData(this.props.newQuestionDetails.optionsEditing[0], data);
    }

    saveOptionData = (index, data) => {
        let questionDetails = {...this.props.newQuestionDetails};
        let options = [...questionDetails.options];
        let option = {...options[index]};
        option.text = data;
        options[index] = option;
        questionDetails.options = options;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    saveQuestionDescription = (data) => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.questionDescription = data;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    saveAnswerDescription = (data) => {
        let questionDetails = {...this.props.newQuestionDetails};
        questionDetails.answerDescription = data;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    startEditingOption = (index) => {
        let questionDetails = {...this.props.newQuestionDetails};
        let optionsEditing = [];
        //Restrict to maximum one question option can be edited at a time
        optionsEditing.push(index);
        questionDetails.optionsEditing = optionsEditing;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    saveAndExitEditingOption = (index, data) => {
        let questionDetails = {...this.props.newQuestionDetails};
        let optionsEditing = questionDetails.optionsEditing.filter(function(item) {return item !== index})
        questionDetails.optionsEditing = optionsEditing;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    selectSingleSelectMCQCorrectOption = (selectedOptionId) => {
        if(this.props.newQuestionDetails.correctOptions.length == 1 && this.props.newQuestionDetails.correctOptions.includes(selectedOptionId)){
            return;
        }
        let questionDetails = {...this.props.newQuestionDetails};
        let options = [];
        options.push(selectedOptionId);
        questionDetails.correctOptions = options;
        this.props.updateNewQuestionDetails(questionDetails);
    }

    renderQuestionDescriptionEditor = () => {
        if(this.props.newQuestionDetails.isEditingQuestion) {
            return <div className="bg-slate-200 rounded ">
                <div className="flex lg:flex-row justify-between border border-primary-200">
                    <div>{this.questionDescriptionTextHeader()}</div>
                </div>
                <div
                    className="bg-gray-200 border bg-slate-100 border-primary-200">
                    <TextEditor
                        editorRef = {this.props.editorRef}
                        onChange={this.updateQuestionDetails}
                        data={JSXUtils.htmlDecode(this.props.newQuestionDetails.questionDescription)}
                    />
                </div>
            </div>;
        } else {
            return <div>
                <div className="flex lg:flex-row justify-between">
                    <div>{this.questionDescriptionTextHeader()}</div>
                </div>
                {JSXUtils.getQuestionRenderingJSX(this.props.newQuestionDetails.questionDescription)}
            </div>
        }
    }

    initializeAdditionalNumberOfOptions = (numberOfOptions) => {
        let newQuestionDetails = {...this.props.newQuestionDetails};
        let options = [...this.props.newQuestionDetails.options];
        let remainingOptionsCount =  numberOfOptions-options.length;
        if(remainingOptionsCount <= 0) {
            return;
        }
        for(let i=0; i<remainingOptionsCount; i++) {
            options.push({
                id : "option"+options.length+1,
                text : "sample option"
            });
        }
        newQuestionDetails.options = options;
        this.props.updateNewQuestionDetails(newQuestionDetails);
    }

    flipOptionEditingDecision = (index) => {
        if(this.props.newQuestionDetails.optionsEditing.includes(index)) {
            this.saveAndExitEditingOption(index, "data")
        } else {
            this.startEditingOption(index)
        }
    }   

    optionDescriptionTextHeader = (index) => {
        let optionNumber = index+1;
        let optionText = this.props.newQuestionDetails.options[index].text;
        return <div onClick={() => this.flipOptionEditingDecision(index)}>
            <div className="flex items-center justify-between w-full">
                <div className="flex flex-col lg:flex-row w-full items-start lg:items-center rounded bg-white ">
                    <br/>
                    <br/>
                    <div className="w-full lg:w-12/12 ">
                        <div className="flex flex-row ...">
                            <div>

                                    <div>
                                        <button className={"mx-2 my-2 bg-white transition-colors rounded text-gray-700 border border-gray-300 px-6 py-2 " + generalTextSize + " hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"}>
                                            <div className="flex flex-row ...">
                                                <div>
                                                    <p className={generalTextSize +" px-2 ..."}>
                                                        {optionNumber} :
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={generalTextSize }>
                                                        <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(optionText)}}></div>
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }

    isOptionCorrectCheckmark = (index) => {
        return JSXUtils.getOptionJSX("?..");
    }

    getOptionCorrectnessSelectionButton =  (index) => {
        if(this.props.newQuestionDetails.correctOptions.includes(index)){
            return this.getCorrectOptionSelectionCheckbox(index);
        }
        return this.getInCorrectOptionSelectionCheckbox(index);
    }

    getInCorrectOptionSelectionCheckbox = (index) => {
        return <div onClick={()=>this.selectSingleSelectMCQCorrectOption(index)}>
            <div className="flex items-center  w-full">
                <div className="flex flex-col ">
                    <button className={"mx-2 my-2 bg-white text-danger-600 border border-gray-300 transition-colors rounded px-9 py-3 " + generalTextSize + " hover:bg-danger-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"}>
                        <div className="flex flex-row ...">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd"
                                          d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                                    <path fill-rule="evenodd"
                                          d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/>
                                </svg>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>;
    }

    getCorrectOptionSelectionCheckbox = (index) => {
        return <div onClick={()=>this.selectSingleSelectMCQCorrectOption(index)}>
            <div className="flex items-center  w-full">
                <div className="flex flex-col ">
                    <button className={"mx-2 my-2 bg-success-600 text-white transition-colors rounded px-9 py-3 " + generalTextSize + " hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500"}>
                        <div className="flex flex-row ...">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                                    <path
                                        d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                                </svg>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>;
    }

    renderOptionEditorJSX = (index, data) => {
        if(this.props.newQuestionDetails.optionsEditing.includes(index)) {
            return <div>
                <div className="flex flex-row ...">
                    <div>{this.getOptionCorrectnessSelectionButton(index)}</div>
                    <div>{this.optionDescriptionTextHeader(index)}</div>
                </div>
                <div
                    className="bg-gray-200 border bg-slate-100 border-primary-300">
                    <TextEditor
                        editorRef = {this.props.editorRef}
                        onChange={this.updateOptionData}
                        defaultEditor="simple-text"
                        data={data}
                    />
                </div>
            </div>;
        } else {
            return <div className = "shadow shadow-slate-100">
            <div className="px-2 flex flex-row ...">
                <div>{this.getOptionCorrectnessSelectionButton(index)}</div>
                <div>{this.optionDescriptionTextHeader(index)}</div>
            </div>
            </div>;
        }
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
            let submittedQuestionDetails = {"questionData":this.props.newQuestionDetails, "selectedOptionId":this.props.newQuestionDetails.selectedPreviewOption};
            return <SingleSelectMCQPreview
                questionText = {this.props.newQuestionDetails.questionDescription}
                options = {JSXUtils.buildMCQOptionsPreviewData(this.props.newQuestionDetails.options, this.props.newQuestionDetails.numberOfOptions)}
                selectedOptionId = {this.props.newQuestionDetails.selectedPreviewOption}
                clearOption = {this.clearOption}
                selectOption = {this.selectOption}
                correctOption = {this.props.newQuestionDetails.correctOptions[0]}
                needCompletePreview = {true}
                submittedQuestionDetails = {submittedQuestionDetails}
            />
        }
        return <div>No preview supported for the given component type</div>;
    }

    openAnswerDescriptionCapturingPopupView = (question) => {
        let triggerJSX = <p className={generalTextSize}>
                            Update answer explanation
                        </p>;
        let postPopupContent = <div className='flex ...'>
            <div className="bg-gray-200 border bg-slate-100 border-primary-300">
                <div className='w-full flex justify-center py-3 text-bold'>
                    Answer Explanation
                </div>
                <TextEditor
                    editorRef = {this.props.editorRef}
                    onChange={this.updateAnswerDetails}
                    data={this.props.newQuestionDetails.answerDescription}
                />
            </div>
        </div>;
        return <EducationalBridgePopupBox
            popupModalClassName = "bg-white border-double border-4 border-gray-500 min-w-[80%]"
            popupTriggerContentClassName = ""
            popupTriggerContent = {triggerJSX}
            postPopupContentHeaderClassName = ""
            postPopupContentHeader = ""
            postpopupContentClassName =""
            postPopupContent = {postPopupContent}
        />
    }

    renderOptionsSelectionsEditor = () => {
        let numberOfOptions = this.props.newQuestionDetails.numberOfOptions;
        let result = [];
        if(this.props.newQuestionDetails.options.length < numberOfOptions) {
            this.initializeAdditionalNumberOfOptions(numberOfOptions);
            return result;
        }
        let header = <div className={CSSConventionUtil.questionDescriptionCSS}>
            <div className="flex flex-row justify-between ...">
                <div className="flex flex-row">
                    <div className="pr-3"><p className={generalTextSize}><b>Correct ?</b></p></div>
                    <div className="pl-3"><p className={generalTextSize}><b>Options</b></p></div>
                </div>
            </div>
        </div>;
        result.push(header)
        for(let i=0; i<numberOfOptions; i++) {
        let optionData = this.props.newQuestionDetails.options[i].text;
            result.push(this.renderOptionEditorJSX(i, optionData));
        }
        return result;
    }

    questionDescriptionTextHeader = ()  => {
        return <div className='py-4 px-2 '>
                <h4 className={generalTextSize + " font-bold "}>
                    Question Description
                </h4>
            </div>
    }

    renderAnswerEditor = () => {
        return <div className='bg-slate-100'>
            <div className={CSSConventionUtil.questionDescriptionCSS}>
                <div className="flex flex-row justify-between ...">
                    <div className="flex flex-row">
                        <p className={generalTextSize}><b>Answer Description</b></p>
                    </div>
                </div>
            </div>
            <div>
                <TextEditor
                    editorRef = {this.props.editorRef}
                    onChange={this.updateAnswerDetails}
                    data={JSXUtils.htmlDecode(this.props.newQuestionDetails.answerDescription)}
                />
            </div>
        </div>
    }

    render() {
        return (
            <div>
                <div className="border-b-4 resize-x">
                    {this.renderQuestionDescriptionEditor()}
                </div>
                {this.renderOptionsSelectionsEditor()}
                {this.renderAnswerEditor()}
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(SingleSelectMCQEditor);
