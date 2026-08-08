import React from 'react';
import Split from "react-split";
import { connect } from 'react-redux';
import {saveQuestionSet, savePaperSet, updateGeneralInfo} from '../../store/actions/solgressAction';
import QuestionsReceiver from "../../apis/QuestionsReceiver";
import TagReceiver from "../../apis/TagReceiver";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { AiFillSetting } from "react-icons/ai";
import { BsFillPencilFill, BsPlusSquare } from "react-icons/bs";
import { AiFillTags, AiFillSafetyCertificate } from 'react-icons/ai'
import { JSXUtils } from '../../utils/JSXUtils';
import {searchTableHeaderCellCSS, clickableSearchTableBodyCellTextCSS, nonClickableSearchTableBodyCellTextCSS, pagingSelectionButtonStyle,
     pagesizeOptionTextSize, generalTextSize} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import Pagination from '@material-ui/lab/Pagination';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import {MiscUtils} from "../../utils/MiscUtils";
import EducationalBridgePopupBox from '../coreCapabilities/EducationalBridgePopupBox';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload)),
    savePaperSet: (payload) => dispatch(savePaperSet(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet,
        paperSet: state.solgressReducer.paperSet,
        generalInfo: state.solgressReducer.generalInfo
    };
}

class QuestionSetSmallScreen extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeQuestions = this.initializeQuestions.bind(this);
        this.openQuestionEditingViewInNewTab = this.openQuestionEditingViewInNewTab.bind(this);
    }

    getPreDecidedTags = async () => { // Workaround : In case it's linked from my created questions. We pick this tag from session storage
        if( window.sessionStorage.getItem('createdByMe')==="true" ){
            let tags = [];
            await TagReceiver.getUserResourceCreationTag(JSON.parse(sessionStorage.getItem("userDetails")).email).then( tagData=> {
                    tags.push({...tagData.data})
                }
            );
            return tags;
        }
        return [];
    }

    resetResourceCreationSessionStorage = () => {
        window.sessionStorage.setItem('createdByMe',"false");
    }

    initializeQuestions = async () => {
        let tags = await this.getPreDecidedTags();
        const search = window.location.search;
        let tagIds = [];
        tags.forEach(tag => {
            tagIds.push(tag.id);
        });

        await QuestionsReceiver.getAllFilteredQuestions(typeof this.props.generalInfo === "undefined"?"":this.props.generalInfo.searchText, tagIds, [], 0, 10).then(paperData=>{
            let payload = {};
            payload.tags = tags;
            payload.suggestedTags = [];
            payload.isTagSearchActive = false;
            payload.questions = paperData.data;
            payload.searchedKey = "";
            payload.helpSectionEnabled = false;
            payload.searchCriteria = "SEARCH_BY_QUESTIONS";
            payload.currentPage = 1;
            payload.currentPageSize = 10;
            this.props.saveQuestionSet(payload);
        });

        await PaperAPIsConnector.getAllFilteredPapers("",tagIds, []).then(paperData=>{ 
            let payload = {};
            payload.tags = tags;
            payload.suggestedTags = [];
            payload.isTagSearchActive = false;
            payload.papers = paperData.data;
            payload.searchedKey = "";
            payload.helpSectionEnabled = false;
            payload.searchCriteria = "SEARCH_BY_PAPER_NAME";
            this.props.savePaperSet(payload);
        });
    }  

    openQuestionEditingViewInNewTab = (questionId) => {
        window.open(currentURLHost + 'question/upsert?question_id=' + questionId);
    }

    openQuestionSubmissionViewInNewTab = (questionId) => {
        window.open(currentURLHost + 'question/view?question_id=' + questionId);
    }

    redirectToQuestionSubmissionViewInSameTab = (questionId) => {
        window.location.href = currentURLHost + 'question/view?question_id=' + questionId
    }

    redirectToQuestionsView = () => {
        let generalInfo = {...this.props.generalInfo};
        generalInfo.isViewingQuestions = true;
        this.props.updateGeneralInfo(generalInfo);
    }

    redirectToPapersView = () => {
        let generalInfo = {...this.props.generalInfo};
        generalInfo.isViewingQuestions = false; // False means its paper
        this.props.updateGeneralInfo(generalInfo);

        let paperSet = {...this.props.paperSet};
    
    }
    
    getQuestionsTableHeaderJSX = () => {
        const isViewingQuestions = typeof this.props.generalInfo == "undefined" || this.props.generalInfo.isViewingQuestions;
        const tabBase = 'px-4 py-3 text-sm font-semibold border-b-2 transition-colors';
        const activeTab = 'border-primary-600 text-primary-700';
        const inactiveTab = 'border-transparent text-gray-500';
        return <TableRow className='bg-white'>
                    <TableCell
                         className={tabBase + ' ' + (isViewingQuestions ? activeTab : inactiveTab)}
                         onClick = {this.redirectToQuestionsView}
                         size = 'small'
                         padding='none'
                    >
                        Questions
                    </TableCell>
                    <TableCell 
                        className={tabBase + ' ' + (!isViewingQuestions ? activeTab : inactiveTab)}
                        onClick = {this.redirectToPapersView}
                        size = 'small'
                        padding = 'none'
                    >
                        Papers
                    </TableCell>
                    <TableCell className='w-full' padding='none'></TableCell>
                    <TableCell padding = 'none'>
                        <div className='flex items-center justify-end px-2 py-2 text-primary-600' 
                            onClick={ () =>
                                (typeof this.props.generalInfo == "undefined" || this.props.generalInfo.isViewingQuestions)
                                    ? window.location.href = currentURLHost + 'question/upsert'
                                    : window.location.href = currentURLHost + 'paper/new'
                            }>
                            <BsPlusSquare size = {20} />
                            <div className='text-xs pl-1'>
                                {typeof this.props.generalInfo == "undefined" || this.props.generalInfo.isViewingQuestions? "New Question" : "New Paper"}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>;
    }

    getTagsDivJSX = (tags) => {
        if (tags === 0 || tags == null) {
            return;
        }
        let response = [];
        tags.forEach(tag=> {
            response.push(
                <Badge key={tag.id} variant="neutral">{tag.tagName}</Badge>
                )
        });
        let fullTagViewPopupTriggerString = <div className='px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium'>
            {response.length>1? "+" + ( response.length-1 + " more"):""}
        </div>;
        
        let fullTagViewPopupContent = <div className='flex flex-row items-start gap-2 py-6 px-4'>
            <AiFillTags size={20} className="text-gray-400" />
            <div className='flex flex-col gap-1'>
                {response}
            </div>
        </div>;

        let fullTagViewPopup = <EducationalBridgePopupBox
            popupModalClassName = "bg-white border border-gray-100 shadow-lg flex w-screen h-fit"
            popupTriggerContentClassName = ""
            popupTriggerContent = {fullTagViewPopupTriggerString}
            postPopupContentHeaderClassName = "bg-primary-50 border-t border-l border-r rounded-t-lg border-gray-200 text-primary-700"
            postPopupContentHeader = "Question Tags"
            postpopupContentClassName = "bg-white border border-gray-200 rounded-b-lg"
            postPopupContent = {fullTagViewPopupContent}
        />
        return <div className='flex flex-row items-center gap-2 mt-1.5'>
            <AiFillTags size={13} className="text-gray-400" />
            <div className='flex flex-row items-center gap-1'>
                {response.length>0?response[0]:""}
                {fullTagViewPopup}
            </div>
        </div>;
    }

    getQuestionEligibleIcon = (question) => {
        if(question.createdBy != null && question.createdBy == UserDetailsUtil.getUserGoogleId()) {
            return <div className='flex items-center gap-2 px-2'>
                <BsFillPencilFill size={15} className="text-primary-600" onClick={()=>this.openQuestionEditingViewInNewTab(question.id)}/>
                {question.fulfilled && <AiFillSafetyCertificate className="text-success-600" size={18} />}
            </div>;
        }
        else {
            return <div className='flex items-center px-2'>
                    {question.fulfilled && <AiFillSafetyCertificate className="text-success-600" size={18} />}
                </div>
        }
    }

    getQuestionsTableBodyRowsJSX = () => {
        let tableRows = [];
        if(this.props.questionSet.questions == undefined || this.props.questionSet.questions.questions.length===0) {
            let noTableFoundRow = <TableRow>
                <TableCell className="border-0">
                    <EmptyState title="No questions found" description="Try adjusting your filters or search terms." />
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        this.props.questionSet.questions.questions.forEach((question, index) => {
            let newRow = <TableRow key={question.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="border-b border-gray-100">
                    <div className='flex flex-row items-start'>
                        <div className="flex flex-col flex-1">
                            <button className='text-left pt-2 pb-1'
                                onClick = {()=>this.redirectToQuestionSubmissionViewInSameTab(question.id)}
                            >
                                <div className={typography.body} dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(question.description)}}></div>
                            </button>
                            {this.getTagsDivJSX(question.tags)}
                        </div>
                        {this.getQuestionEligibleIcon(question)}
                    </div>
                </TableCell>
            </TableRow>;
            tableRows.push(newRow);
        });
        return tableRows;
    }

    redirectToPaperSubmissionViewInSameTab = (paperId) => {
        window.location.href = currentURLHost + 'paper/view?paper_id=' + paperId + '&paper_instance_id='+ MiscUtils.generateUUID();
    }

    getPapersTableBodyRowsJSX = () => {
        let tableRows = [];
        if(this.props.paperSet.papers == undefined || this.props.paperSet.papers.length===0) {
            let noTableFoundRow = <TableRow>
                <TableCell className="border-0">
                    <EmptyState title="No papers found" description="Try adjusting your filters or search terms." />
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        this.props.paperSet.papers.forEach((paper, index) => {
            let newRow = <TableRow key={paper.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="border-b border-gray-100">
                    <div className="flex flex-col w-full">
                        <p className={clickableSearchTableBodyCellTextCSS}
                            onClick = {()=>this.redirectToPaperSubmissionViewInSameTab(paper.id)}
                        >
                            <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(paper.paper_name)}}></div>
                        </p>
                        {this.getTagsDivJSX(paper.tags)}
                    </div>
                </TableCell>
            </TableRow>;
            tableRows.push(newRow);
        });
        return tableRows;
    }

    getQuestionsTableJSX = () => {
        return <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            {this.getQuestionsTableHeaderJSX()}
                        </TableHead>
                        <TableBody>
                            {
                                this.props.generalInfo==undefined || this.props.generalInfo.isViewingQuestions
                                    ?this.getQuestionsTableBodyRowsJSX()
                                    :this.getPapersTableBodyRowsJSX()
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
    } 

    refreshSearch = (pageNumber, updatedPageSize) => {
        let updatedPageNumber = pageNumber;
        if(pageNumber == null) {
            updatedPageNumber = this.props.questionSet.currentPage - 1;
        }
        let tagIds = [];
        this.props.generalInfo.selectedTags.forEach(tag =>{
            tagIds.push(tag.id);
        });

        QuestionsReceiver.getAllFilteredQuestions(
            this.props.questionSet.searchedKey,
             tagIds,
             [],
             updatedPageNumber,
             updatedPageSize
        ).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = questionsData.data;
            payload.currentPage = updatedPageNumber + 1;
            payload.currentPageSize = updatedPageSize;
            this.props.saveQuestionSet(payload);
        });
        this.setState({flag : this.state.flag==undefined?true:!this.state.flag}); // Forced re-render
    }

    showSelectedTags = () => {
        let response = [];
        this.props.questionSet.tags.forEach(element => {
            response.push(
                <div key={element.id} className="flex flex-row items-center gap-1">
                    <div>{JSXUtils.getTagViewJSX(element.tagName)}</div>
                    <button className="flex items-center justify-center rounded-full bg-gray-100 hover:bg-danger-100 w-5 h-5 text-gray-500 hover:text-danger-600 transition-colors" onClick={()=>this.removeTag(element.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"
                                 fill="currentColor" className="bi bi-x-lg" viewBox="0 0 14 14">
                                <path fill-rule="evenodd"
                                      d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                                <path fill-rule="evenodd"
                                      d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/>
                            </svg>
                    </button>
                </div>
            );
        });
        if(response.length === 0) {
            return;
        }
        return <div className="flex flex-row items-center gap-2 px-4 py-3 flex-wrap">
            <p className={typography.caption}>
                Filter on Tags:
            </p>
            {response}
        </div>;
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
        QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey, tagIds, [], 0).then(questionsData=>{
            payload.currentPage = 1;
            payload.questions = questionsData.data;
            this.props.saveQuestionSet(payload);
        });
    }

    updateHelpSectionEnabling = (event) => {
        let payload = {...this.props.questionSet};
        payload.helpSectionEnabled = event.target.checked;
        this.props.saveQuestionSet(payload);
    }

    getHelpSectionJSX = () => {
        if(this.props.questionSet.helpSectionEnabled === false) {
            return <div/>;
        }
        return <div>
            <div className="bg-success-50 py-2">
                <h3 className ='text-xl'>
                    Help Section
                </h3>
            </div>
            <p className='text-lg py-2'>
                1. How to create a multiple choice question on educationalbridge ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/y7169jEvb-Y" className='w-full'/>
            <p className='text-lg py-2'>
                2. What does preview means here ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/e_TxH59MclA" className='w-full'/>

            <p className='text-lg py-2'>
                3. How to add images into the questions ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/bVKHRtafgPc" className='w-full'/>
            <p className='text-lg py-2'>
                3. What is educationalbridge ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/hQ8GYk9gkcE" className='w-full'/>
        </div>;
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

    getPageSettingPopupDiv = () => {
        let popupContent = <div className='bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-3 py-2'>
                <div className='flex flex-row items-center py-1 gap-2'>
                    <div className={typography.caption}>
                        Page Number:
                    </div>
                    <input type="number"
                        className="bg-white text-gray-700 px-1 border border-gray-300 rounded text-center w-16"
                        name="custom-input-number"
                        min = "1"
                        max = {this.props.questionSet.pageCount}
                        value={this.props.questionSet.currentPage}
                        onChange={(event)=>this.handlePageChange(event, event.target.value)}
                    />
                </div>
                <div className='flex flex-row items-center py-1 gap-2'>
                    <div className={typography.caption}>
                        Page Size:
                    </div>
                    <select className="border border-gray-300 rounded text-sm px-1 py-0.5"
                        value={this.props.questionSet.currentPageSize}
                        onChange={(event => this.updatePageSize(event))}
                    >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                    </select>
                </div>
            </div>;
            return <Popover
                isOpen={this.state.isPageSettingsConfigOpen==undefined?false:this.state.isPageSettingsConfigOpen}
                positions={['right', 'bottom', 'left', 'up']} // preferred positions by priority
                content={({ position, childRect, popoverRect }) => (
                    <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
                    position={position}
                    childRect={childRect}
                    popoverRect={popoverRect}
                    arrowColor={'#FFFFFF'}
                    arrowSize={10}
                    arrowStyle={{ opacity: 0.9 }}
                    className='popover-arrow-container'
                    arrowClassName='popover-arrow'
                    >
                    {popupContent}
                    </ArrowContainer>
                )}
                onClickOutside = {() => this.toggleLoginPopOver()}  
            >
                <div className='py-5 text-gray-400' onClick={()=>this.toggleLoginPopOver()}>
                    <AiFillSetting size={24} />
                </div>
            </Popover>;
    }

    getPagingSection = () => {
        if(typeof this.props.generalInfo == "undefined" || !this.props.generalInfo.isViewingQuestions) {
            return <div/>;
        }
        let currentPageNumber = this.props.questionSet.currentPage;
        return <div className='flex flex-row justify-center items-center'>
                <div className='px-4'>
                    <Pagination 
                        className = "py-4" 
                        size="small"  
                        count={this.props.questionSet.questions.pageCount==0?1:this.props.questionSet.questions.pageCount} 
                        color="primary" 
                        variant="outlined"   
                        shape="rounded"  
                        page = {currentPageNumber}
                        showFirstButton 
                        showLastButton 
                        onChange={this.handlePageChange}/>
                </div>
                <div>
                    {this.getPageSettingPopupDiv()}
                </div>
            </div>;
    }

    updateSearchText = () => {
        QuestionsReceiver.getAllFilteredQuestions(this.props.generalInfo.searchText, [], []).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = questionsData.data;
            payload.searchedKey = this.props.generalInfo.searchText;
            this.props.saveQuestionSet(payload);
        });
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.questionSet === undefined){
            this.initializeQuestions();
            return <div></div>;
        }
        this.resetResourceCreationSessionStorage();
        return <div className='bg-gray-50 min-h-screen'>
            <EducationalBridgeHeader
                updateSearchText = {this.updateSearchText}
            />
            {/* No in-content ad units: advertising lives only in the left/right rails,
                which are desktop-only. See note in AdRail.js. */}
            <div className="w-full overflow-y-auto">
                {this.showSelectedTags()}
                {this.getQuestionsTableJSX()}
                {this.getPagingSection()}
            </div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionSetSmallScreen);
