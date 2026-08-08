import React from 'react';
import Split from "react-split";
import { connect } from 'react-redux';
import {saveQuestionSet, updateNewPaperDetails} from '../../../store/actions/solgressAction';
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { BsEyeFill } from "react-icons/bs";
import { AiFillTags } from 'react-icons/ai'
import { JSXUtils } from '../../../utils/JSXUtils';
import OptionSelectionCheckbox from "../../../utils/OptionSelectionCheckbox";
import SingleSelectMCQPreview from "../previews/SingleSelectMCQPreview";
import EducationalBridgePopupBox from '../../coreCapabilities/EducationalBridgePopupBox';
import { generalTextSize, clickableSearchTableBodyCellTextCSS, nonClickableSearchTableBodyCellTextCSS } from '../../../constants/TextSizeConstants';
import QuestionSetSearchBoxComponent from './../../questionSet/QuestionSetSearchBoxComponent';
import notify from '../../../utils/notify';
import {currentURLHost} from './../../../constants/hostConfig';
import Pagination from '@material-ui/lab/Pagination';
import { AiFillSetting } from "react-icons/ai";
import { Popover, ArrowContainer } from 'react-tiny-popover';
import PagingSection from '../platformCapabilities/PagingSection';
import ClipLoader from "react-spinners/ClipLoader";

const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload)),
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet,
        newPaperDetails: state.solgressReducer.newPaperDetails
    };
}

class QuestionSelectionConfigurationBox extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeQuestions = this.initializeQuestions.bind(this);
        this.openQuestionEditingViewInNewTab = this.openQuestionEditingViewInNewTab.bind(this);
    }

    initializeQuestions = () => {
        const search = window.location.search
        QuestionsReceiver.getAllFilteredQuestions("",[], [],0, 10).then(paperData=>{
            if(!this.props.showSelectedQuestions) {
                let payload = {};
                payload.tags = [];
                payload.suggestedTags = [];
                payload.isTagSearchActive = false;
                payload.questions = this.normalise(paperData.data, paperData.data.pageCount);
                payload.searchedKey = "";
                payload.helpSectionEnabled = false;
                payload.currentPage = 1;
                payload.currentPageSize = 10;
                this.props.saveQuestionSet(payload);
            }
        });
        if(this.props.showSelectedQuestions) {

        }
    }

    normalise = (questionSet, pageCount) => {
        let selectedQuestionIds = [...this.props.newPaperDetails.selectedQuestionIds];
        let subjectName = this.props.newPaperDetails.subjectNames[this.props.newPaperDetails.currentSubjectIndex];
        let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[this.props.newPaperDetails.currentSubjectIndex][this.props.newPaperDetails.currentSectionIndex];
        let questionIdsSelectedForSubjectWiseSection = (this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions === undefined
                                                        || this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName] === undefined
                                                        || this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName] === undefined
                                                    )? []
                                                    : this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName];
        let blockedQuestionIds = selectedQuestionIds.filter(function(selectedQuestionId) {
            return !questionIdsSelectedForSubjectWiseSection.includes(selectedQuestionId);
        });
        questionSet = questionSet.questions.filter(function(question){
            return !blockedQuestionIds.includes(question.id);
        });
        return {"questions" : questionSet, "pageCount" : pageCount};
    }

    openQuestionEditingViewInNewTab = (questionId) => {
        window.open(currentURLHost + 'question/upsert?question_id=' + questionId);
    }

    openQuestionSubmissionPopupView = (question) => {
        let triggerJSX = <BsEyeFill color = {'green'}  className='w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5' />;
        let popupContentHeader = <div className={generalTextSize + ' bg-success-50 text-center text-primary-800 flex justify-center py-1 pb-2 px-3 hover hover:underline flex w-full grow'}
                onClick={()=>window.open(currentURLHost + "question/view?question_id="+question.id)}>
                Click here for full view of Question
            </div>;
        let postPopupContent = <div className="border-b-2 ">
            <SingleSelectMCQPreview
                questionDetails = {question}
                options = {JSXUtils.buildMCQOptionsPreviewData(question.options, question.options.length)}
                needCompletePreview = {false}
            />
        </div>;
        return <EducationalBridgePopupBox
            popupModalClassName = "bg-white border-double border-4 border-gray-500 min-w-[80%]"
            popupTriggerContentClassName = ""
            popupTriggerContent = {triggerJSX}
            postPopupContentHeaderClassName = "h-full w-full"
            postPopupContentHeader = {popupContentHeader}
            postpopupContentClassName =""
            postPopupContent = {postPopupContent}
        />
    }

    redirectToQuestionSubmissionViewInSameTab = (questionId) => {
        window.location.href = currentURLHost + 'question/view?question_id=' + questionId
    }

    getQuestionsTableHeaderJSX = () => {
        let questionHeaderText = 'Questions';
        if (this.props.newPaperDetails.containsMoreThanOneSubject === "true") {
            questionHeaderText += " for ";
            questionHeaderText += this.props.newPaperDetails.subjectNames[this.props.newPaperDetails.currentSubjectIndex];
        }
        return <TableRow className = 'bg-gray-100'>
            <TableCell className='border border-slate-300'>
                <p className={generalTextSize + " text-left font-bold flex justify-center"}>
                    Select
                </p>
            </TableCell>
            <TableCell className='border border-slate-300'>
                <p className={generalTextSize + " font-bold flex justify-center"}>
                    View
                </p>
            </TableCell>
            <TableCell className='border border-slate-300'>
                <p className={generalTextSize + " text-left font-bold pl-10"}>
                    {questionHeaderText}
                </p>
            </TableCell>
        </TableRow>;
    }

    getQuestionTagsDivJSX = (question) => {
        if (question.tags.length === 0) {
            return;
        }
        let response = [];
        question.tags.forEach(tag=> {
            response.push(
                <span className='px-1'>
                    <span className='px-1 rounded-xl px-3 text-primary-800 text-xs' /*style={{'white-space':'nowrap'}}*/>{tag.tagName}</span>
                </span>
                )
        });
        return <div className='flex flex-row'>
            <div className='flex justify-top'>
                <span className='px-2'><AiFillTags size={15} color = {'blue'}/></span>
            </div>
            <div className=''>
                {response}
            </div>
        </div>;
    }

    activateQuestionViewPopup = (questionId) => {
        let payload = {...this.props.questionSet};
        payload.popupQuestionId = questionId;
        this.props.saveQuestionSet(payload);
    }

    deactivateQuestionViewPopup = (questionId) => {
        let payload = {...this.props.questionSet};
        payload.popupQuestionId = undefined;
        this.props.saveQuestionSet(payload);
    }

    selectQuestionId = (questionId) => {
        if(this.props.newPaperDetails.selectedQuestionIds.includes(questionId)) {
            return;
        }
        else if(this.props.newPaperDetails.selectedQuestionIds.length >= this.props.newPaperDetails.numberOfQuestions) {
            notify.warning("This paper already has all "
                + this.props.newPaperDetails.numberOfQuestions
                + " questions. Remove one before adding another.");
            return;
        }
        let payload = {...this.props.newPaperDetails}
        let selectedQuestionIds = [...payload.selectedQuestionIds];
        selectedQuestionIds.push(questionId);
        payload.selectedQuestionIds = selectedQuestionIds;

        // Update subject wise section wise selected questions

        let currentSubjectIndex = this.props.newPaperDetails.currentSubjectIndex;
        let currentSectionIndex = this.props.newPaperDetails.currentSectionIndex; 

        let subjectName = this.props.newPaperDetails.subjectNames[currentSubjectIndex];
        let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[currentSubjectIndex][currentSectionIndex];
        let subjectWiseSectionWiseSelectedQuestions = {...payload.subjectWiseSectionWiseSelectedQuestions};
        if(subjectWiseSectionWiseSelectedQuestions===undefined) {
            subjectWiseSectionWiseSelectedQuestions = {};
        }
        if(subjectWiseSectionWiseSelectedQuestions[subjectName] === undefined) {
            subjectWiseSectionWiseSelectedQuestions[subjectName] = {};
        }
        if(subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName] === undefined) {
            subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName] = [];
        }
        let sectionSpecificSelectedQuestion = [...subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName]];
        if(sectionSpecificSelectedQuestion.length === this.props.newPaperDetails.subjectWiseSectionWiseNumberOfQuestions[currentSubjectIndex][currentSectionIndex]) {
            notify.warning(subjectName + " \u00b7 " + sectionName
                + " is already full. Remove a question from it before adding another.");
            return;
        }
        let subjectSpecificSelectedQuestions = {...subjectWiseSectionWiseSelectedQuestions[subjectName]};
        sectionSpecificSelectedQuestion.push(questionId);
        subjectSpecificSelectedQuestions[sectionName] = [...sectionSpecificSelectedQuestion];
        subjectWiseSectionWiseSelectedQuestions[subjectName] = subjectSpecificSelectedQuestions;
        // subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName] = [];
        payload.subjectWiseSectionWiseSelectedQuestions = subjectWiseSectionWiseSelectedQuestions;

        this.props.updateNewPaperDetails(payload);
    }

    unSelectQuestionId = (questionId) => {
        if(!this.props.newPaperDetails.selectedQuestionIds.includes(questionId)) {
            return;
        }
        let payload = {...this.props.newPaperDetails}
        let selectedQuestionIds = payload.selectedQuestionIds.filter(function(item) {return item !== questionId});
        payload.selectedQuestionIds = selectedQuestionIds;

        // Update subject wise section wise selected questions
        let currentSubjectIndex = this.props.newPaperDetails.currentSubjectIndex;
        let currentSectionIndex = this.props.newPaperDetails.currentSectionIndex; 
        let subjectName = this.props.newPaperDetails.subjectNames[currentSubjectIndex];
        let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[currentSubjectIndex][currentSectionIndex];
        let subjectWiseSectionWiseSelectedQuestions = {...payload.subjectWiseSectionWiseSelectedQuestions};
        let subjectSpecificSelectedQuestions = {...subjectWiseSectionWiseSelectedQuestions[subjectName]};
        let sectionSpecificSelectedQuestions = [...subjectSpecificSelectedQuestions[sectionName]];
        sectionSpecificSelectedQuestions = sectionSpecificSelectedQuestions.filter(selectedQuestionId => selectedQuestionId !== questionId);
        subjectSpecificSelectedQuestions[sectionName] = sectionSpecificSelectedQuestions;
        subjectWiseSectionWiseSelectedQuestions[subjectName] = subjectSpecificSelectedQuestions;
        payload.subjectWiseSectionWiseSelectedQuestions = subjectWiseSectionWiseSelectedQuestions;
        this.props.updateNewPaperDetails(payload)
    }

    flipQuestionSelection = (questionId) => {
        if(!this.props.newPaperDetails.selectedQuestionIds.includes(questionId)) {
            this.selectQuestionId(questionId);
        } else {
            this.unSelectQuestionId(questionId);
        }
    }

    getQuestionsTableBodyRowsJSX = () => {
        let tableRows = [];
        if(this.props.questionSet === undefined || this.props.questionSet.isRefreshing===true) {
            let noTableFoundRow =<TableRow className="hover:bg-slate-100">
                <TableCell className='w-full'>
                    <div className='flex w-full justify-center ' style={{minHeight: window.innerHeight*0.6}}>
                        <ClipLoader color="#2563EB" size="60" className=''/>
                    </div>
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        } else if(this.props.questionSet.questions.questions.length===0) {
            let noTableFoundRow =<TableRow className="hover:bg-slate-100">
                <TableCell>
                    <p className={"flex justify-center " + generalTextSize}  style={{minHeight: window.innerHeight*0.5}}>                    
                        No question found with matching filters and search key. Please try updating the query and filter
                    </p>
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        this.props.questionSet.questions.questions.forEach((question, index) => {
            let newRow = <TableRow className="hover:bg-slate-100">
                <TableCell className='w-full'>
                    <div className=' flex flex-row w-full '>
                        <div className='flex flex-col '>
                            <OptionSelectionCheckbox
                                isSelected = {this.props.newPaperDetails.selectedQuestionIds.includes(question.id)}
                                markAsSelected = {this.selectQuestionId}
                                markAsUnselected = {this.unSelectQuestionId}
                                identifier = {question.id}
                            />
                            <div className='flex justify-center py-1' 
                                    onMouseLeave={()=>this.deactivateQuestionViewPopup(question.id)} 
                                    onMouseEnter={()=>this.activateQuestionViewPopup(question.id)}
                                    onMouseClick={()=>this.activateQuestionViewPopup(question.id)}
                                >
                                    {
                                        this.props.questionSet.popupQuestionId !== question.id
                                        ? <BsEyeFill color = {'gray'} className='w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5' onClick = {()=>this.activateQuestionViewPopup(question.id)}/>
                                        : this.openQuestionSubmissionPopupView(question)
                                    }
                            </div>
                        </div>
                        <div className='flex flex-row w-full' >
                            <div className="flex flex-col w-full" onClick = {()=>this.flipQuestionSelection(question.id)}>
                                <div className='w-full'>
                                    <p className={ nonClickableSearchTableBodyCellTextCSS + generalTextSize + "  w-full text-left text-black"}>
                                        <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(question.description.substring(0,200))}}></div>
                                    </p>
                                </div>
                                <div className='w-full'>
                                    {this.getQuestionTagsDivJSX(question)}
                                </div>
                            </div>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
             tableRows.push(newRow);
        });
        return tableRows;
    }

    getQuestionsTableJSX = () => {
        return <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        {/* <TableHead>
                            {this.getQuestionsTableHeaderJSX()}
                        </TableHead> */}
                        <TableBody>
                            {this.getQuestionsTableBodyRowsJSX()}
                        </TableBody>
                    </Table>
                </TableContainer>;
    }

    refreshSearch = (pageNumber, updatedPageSize) => {
        let updatedPageNumber = pageNumber;
        if(pageNumber == null) {
            updatedPageNumber = this.props.questionSet.currentPage - 1;
        }
        let tagIds = [];
        this.props.questionSet.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        let payload = {...this.props.questionSet};
        payload.isRefreshing = true;
        this.props.saveQuestionSet(payload);
        QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey, tagIds,[], updatedPageNumber, updatedPageSize).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = this.normalise(questionsData.data, questionsData.data.pageCount);
            payload.pageCount = questionsData.data.pageCount;
            payload.currentPage = updatedPageNumber + 1;
            payload.currentPageSize = updatedPageSize;
            payload.isRefreshing = false;
            this.props.saveQuestionSet(payload);
        });
    }

    removeTag = (tagId) => {
        let payload = {...this.props.questionSet};
        let tags = [...payload.tags];
        let suggestedTags = [...payload.suggestedTags];
        suggestedTags.push(tags.filter(function(tag) {return tag.id === tagId})[0]);
        tags = tags.filter(function(tag) {return tag.id !== tagId});
        payload.tags = tags;
        payload.suggestedTags = suggestedTags;
        let tagIds = [];
        tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey, tagIds, [], this.props.currentPage).then(questionsData=>{
            payload.questions = this.normalise(questionsData.data, questionsData.data.pageCount);
            payload.currentPage = 1;
            this.props.saveQuestionSet(payload);
        });
    }

    handlePageChange = (event, value) => {
        if(value<=0 || value>this.props.questionSet.pageCount) {
            return;
        }
        this.refreshSearch(value-1, this.props.questionSet.currentPageSize);
    }

    updatePageSize = (event) => {
        this.refreshSearch(0, event.target.value);
    }
    toggleLoginPopOver = () => {
        this.setState({"isPageSettingsConfigOpen" : this.state.isPageSettingsConfigOpen==undefined?true:!this.state.isPageSettingsConfigOpen});
    }

    render() {
        if(this.props.questionSet === undefined){
            this.initializeQuestions();
            return  <div className='py-20' style={{minHeight: window.innerHeight*0.70}}>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
        }
        return <div children="overflow-y-auto max-h-[49rem] min-h-[49rem] ...">
            <div className="w-full  shadow bg-white ">
                <div className='px-3'><QuestionSetSearchBoxComponent/></div>
                {this.getQuestionsTableJSX()}
                <PagingSection
                    pageCount = {this.props.questionSet.questions.pageCount}
                    currentPageNumber = {this.props.questionSet.currentPage}
                    handlePageChange= {this.handlePageChange}
                    currentPageSize = {this.props.questionSet.currentPageSize}
                    updatePageSize ={this.updatePageSize}
                    togglePageSettingPopover = {this.toggleLoginPopOver}
                    isPageSettingsConfigOpen = {this.state.isPageSettingsConfigOpen}
                />
            </div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionSelectionConfigurationBox);
