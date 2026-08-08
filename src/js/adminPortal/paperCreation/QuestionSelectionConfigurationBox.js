import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet, updateNewPaperDetails} from '../../../store/actions/solgressAction';
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { BsEyeFill } from "react-icons/bs";
import { AiFillTags } from 'react-icons/ai'
import { JSXUtils } from '../../../utils/JSXUtils';
import OptionSelectionCheckbox from "../../../utils/OptionSelectionCheckbox";
import SingleSelectMCQPreview from "../previews/SingleSelectMCQPreview";
import EducationalBridgePopupBox from '../../coreCapabilities/EducationalBridgePopupBox';
import { generalTextSize, nonClickableSearchTableBodyCellTextCSS } from '../../../constants/TextSizeConstants';
import QuestionSetSearchBoxComponent from './../../questionSet/QuestionSetSearchBoxComponent';
import notify from '../../../utils/notify';
import {currentURLHost} from './../../../constants/hostConfig';
import PagingSection from '../platformCapabilities/PagingSection';
import ClipLoader from "react-spinners/ClipLoader";
import { dataOf } from '../../../apis/unwrap';

// Imports removed from this file because nothing referenced them: `Split`
// (react-split), `TableHead`, `clickableSearchTableBodyCellTextCSS`,
// `Pagination`, `AiFillSetting`, and `Popover`/`ArrowContainer`. Paging and its
// page-size popover are owned by PagingSection, which is what this file renders,
// so the controls were imported here a second time and never mounted.

// Fallback shape for the paged list endpoint, used when a request fails so
// render paths that read `.questions` / `.pageCount` keep working.
const EMPTY_PAGE = { questions: [], pageCount: 0, pageSize: 10 };

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
        // `const search = window.location.search` was read here and never used.
        QuestionsReceiver.getAllFilteredQuestions("",[], [],0, 10).then(paperData=>{
            if(!this.props.showSelectedQuestions) {
                let payload = {};
                payload.tags = [];
                payload.suggestedTags = [];
                payload.isTagSearchActive = false;
                const page = dataOf(paperData, EMPTY_PAGE);
                payload.questions = this.normalise(page, page.pageCount);
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
        let triggerJSX = <BsEyeFill className='w-4 h-4 md:w-5 md:h-5 text-gray-500' aria-hidden="true"/>;
        // Was a <div onClick={window.open}>, i.e. a link that neither looked nor
        // behaved like one: no keyboard access, no middle-click, no "open in new tab".
        let popupContentHeader = <a
                href={currentURLHost + "question/view?question_id=" + question.id}
                target="_blank"
                rel="noreferrer"
                className={generalTextSize + ' bg-success-50 text-center text-primary-800 flex justify-center py-1 pb-2 px-3 hover:underline w-full grow'}
            >
                Open the full question in a new tab
            </a>;
        let postPopupContent = <div className="border-b-2 ">
            <SingleSelectMCQPreview
                questionDetails = {question}
                options = {JSXUtils.buildMCQOptionsPreviewData(question.options, question.options.length)}
                needCompletePreview = {false}
            />
        </div>;
        return <EducationalBridgePopupBox
            popupModalClassName = "bg-white border-double border-4 border-gray-500 min-w-[80%]"
            popupTriggerContentClassName = "p-1 rounded hover:bg-gray-100"
            popupTriggerContent = {triggerJSX}
            triggerAriaLabel = "Preview this question"
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

    // activateQuestionViewPopup / deactivateQuestionViewPopup used to push a
    // `popupQuestionId` through redux so a hover could swap one row's icon for a
    // modal. Now that the preview is an ordinary modal trigger present on every row,
    // there is no hover state to track — and routing transient hover state through
    // the global store was re-rendering the whole table on every mouse move.

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
            let noTableFoundRow =<TableRow key="loading">
                <TableCell className='w-full'>
                    <div className='flex w-full justify-center ' style={{minHeight: window.innerHeight*0.6}}>
                        <ClipLoader color="#2563EB" size={60}/>
                    </div>
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        // A failed list request leaves `questions` as the EMPTY_PAGE fallback, but a
        // partially-initialised slice can still have `questions` absent entirely,
        // and reading `.questions.length` off that threw.
        const page = this.props.questionSet.questions;
        if(page === undefined || !Array.isArray(page.questions) || page.questions.length===0) {
            let noTableFoundRow =<TableRow key="empty">
                <TableCell>
                    <p className={"flex justify-center text-center " + generalTextSize}  style={{minHeight: window.innerHeight*0.5}}>
                        No questions match those filters. Try widening your search.
                    </p>
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        this.props.questionSet.questions.questions.forEach((question, index) => {
            const isSelected = this.props.newPaperDetails.selectedQuestionIds.includes(question.id);
            // `key` was missing on every row, so React could not match rows across
            // renders: toggling one selection re-created the whole table.
            let newRow = <TableRow key={question.id} className="hover:bg-slate-100">
                <TableCell className='w-full'>
                    <div className='flex flex-row w-full gap-1'>
                        <div className='flex flex-col items-center shrink-0'>
                            <OptionSelectionCheckbox
                                isSelected = {isSelected}
                                markAsSelected = {this.selectQuestionId}
                                markAsUnselected = {this.unSelectQuestionId}
                                identifier = {question.id}
                                label = {'question ' + (index + 1)}
                            />
                            {/* The preview used to open on hover (onMouseEnter) and
                                close on mouse-out, with a third handler spelled
                                `onMouseClick` — not a React event, so that one never
                                fired at all. A hover-only preview cannot be opened on
                                a touch screen or by keyboard, which is most of the
                                ways someone would try. It is a normal modal trigger
                                now, rendered for every row. */}
                            <div className='flex justify-center py-1'>
                                {this.openQuestionSubmissionPopupView(question)}
                            </div>
                        </div>
                        {/* A real button, so the row can be selected from the keyboard.
                            The clickable element used to be a <div>. */}
                        <button
                            type="button"
                            className="flex flex-col w-full min-w-0 text-left px-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick = {()=>this.flipQuestionSelection(question.id)}
                            aria-pressed={isSelected}
                        >
                            {/* Was a <div> inside a <p> (invalid nesting), fed
                                `description.substring(0,200)` — a raw HTML string cut
                                at 200 characters, which routinely severed a tag or a
                                LaTeX delimiter mid-sequence. The full body is passed
                                through and clamped visually instead. */}
                            <span
                                className={nonClickableSearchTableBodyCellTextCSS + generalTextSize + ' block w-full text-left text-black line-clamp-3'}
                                dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(question.description)}}
                            />
                            <span className='block w-full'>
                                {this.getQuestionTagsDivJSX(question)}
                            </span>
                        </button>
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
            const page = dataOf(questionsData, EMPTY_PAGE);
            payload.questions = this.normalise(page, page.pageCount);
            payload.pageCount = page.pageCount;
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
            const page = dataOf(questionsData, EMPTY_PAGE);
            payload.questions = this.normalise(page, page.pageCount);
            payload.currentPage = 1;
            this.props.saveQuestionSet(payload);
        });
    }

    handlePageChange = (event, value) => {
        // Read the wrong path: pageCount lives on the response envelope
        // (questionSet.questions.pageCount), not on the slice, so `value > undefined`
        // was always false and the last page could be paged past indefinitely.
        const pageCount = (this.props.questionSet.questions || {}).pageCount;
        if(value<=0 || (pageCount != null && value>pageCount)) {
            return;
        }
        this.refreshSearch(value-1, this.props.questionSet.currentPageSize);
    }

    updatePageSize = (event) => {
        this.refreshSearch(0, event.target.value);
    }
    toggleLoginPopOver = () => {
        this.setState({"isPageSettingsConfigOpen" : this.state.isPageSettingsConfigOpen===undefined?true:!this.state.isPageSettingsConfigOpen});
    }

    componentDidMount() {
        // Was called from render().
        if(this.props.questionSet === undefined){
            this.initializeQuestions();
        }
    }

    render() {
        if(this.props.questionSet === undefined){
            return  <div className='flex justify-center py-20' style={{minHeight: window.innerHeight*0.70}}>
                    <ClipLoader color="#2563EB" size={60}/>
                </div>
        }
        {/* This was `<div children="overflow-y-auto max-h-[49rem] min-h-[49rem] ...">`.
            `children` is not `className`: the string was passed as the element's
            children prop and then discarded, because JSX's nested children take
            precedence over the attribute. The scroll container it describes never
            existed, so the question picker had no height cap and no internal
            scrolling — the paper builder grew to whatever length the result list
            happened to be instead of scrolling inside a fixed panel beside the
            section configuration. */}
        return <div className="overflow-y-auto max-h-[49rem] min-h-[49rem]">
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
