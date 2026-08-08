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
import {searchTableHeaderCellCSS, clickableSearchTableBodyCellTextCSS, pagingSelectionButtonStyle,
     pagesizeOptionTextSize, generalTextSize, nonClickableSearchTableBodyCellTextCSS} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import Pagination from '@material-ui/lab/Pagination';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import {MiscUtils} from "../../utils/MiscUtils";
import QuestionSetSmallScreen from './QuestionSetSmallScreen';
import TagFilterViewLarge from './TagFilter/TagFilterViewLarge';
import { VscSettings } from "react-icons/vsc";
import {MdArrowDropDown} from "react-icons/md";
import ClipLoader from "react-spinners/ClipLoader";
import PagingSection from '../adminPortal/platformCapabilities/PagingSection';
import PageCard from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import AdRail from '../../components/common/AdRail';
import { typography, layout } from '../../constants/designTokens';

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

class QuestionSet extends React.Component {

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

        let searchText = "";
        let searchTextQueryParam = new URLSearchParams(window.location.search).get('search_text');
        if(searchTextQueryParam!=null) {
            searchText = searchTextQueryParam;
        }
        if(typeof this.props.generalInfo != "undefined") {
            searchText = this.props.generalInfo.searchText;
        }
        await QuestionsReceiver.getAllFilteredQuestions(searchText, tagIds, [], 0, 10).then(paperData=>{
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
       window.open(currentURLHost + 'question/upsert?question_id=' + questionId)
    }

    openQuestionSubmissionViewInNewTab = (questionId) => {
        window.open(currentURLHost + 'question/view?question_id=' + questionId);
    }

    redirectToQuestionSubmissionViewInSameTab = (questionId) => {
        window.location.href = currentURLHost + 'question/view?question_id=' + questionId
    }

    redirectToPaperSubmissionViewInNewTab = (paperId) => {
        window.open(currentURLHost + 'paper/view?paper_id=' + paperId + '&paper_instance_id='+ MiscUtils.generateUUID())
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
        const tabBase = 'px-4 md:px-6 py-3 text-sm font-semibold border-b-2 transition-colors';
        const activeTab = 'border-primary-600 text-primary-700';
        const inactiveTab = 'border-transparent text-gray-500 hover:text-gray-700';
        return <div className='bg-white border-b border-gray-100'>
                    <div className='flex flex-row'>
                        <button
                             className={tabBase + ' ' + (isViewingQuestions ? activeTab : inactiveTab)}
                             onClick={this.redirectToQuestionsView}
                        >
                            Questions
                        </button>
                        <button
                            className={tabBase + ' ' + (!isViewingQuestions ? activeTab : inactiveTab)}
                            onClick={this.redirectToPapersView}
                        >
                            Papers
                        </button>
                        <div className={tabBase + ' ' + inactiveTab + ' cursor-default'}>
                            Notes
                            <span className='ml-1 text-xs text-warning-600 font-normal'>upcoming</span>
                        </div>
                    </div>
                </div>;
    }

    getTagsDivJSX = (tags, createdBy) => {
        if (tags === 0) {
            return;
        }
        // Imported questions carry ~10 tags each. Showing all of them, prefixes and
        // all, buries the question text. So: drop the provenance/bookkeeping tags,
        // strip the "Prefix : " for display, and cap the visible count.
        const HIDDEN_TAG_PREFIXES = ['Created By : ', 'Source : '];
        const MAX_VISIBLE_TAGS = 4;
        const displayable = (tags || []).filter(
            tag => tag && tag.tagName && !HIDDEN_TAG_PREFIXES.some(p => tag.tagName.startsWith(p))
        );
        const stripPrefix = (name) => {
            const idx = name.indexOf(' : ');
            return idx === -1 ? name : name.slice(idx + 3);
        };
        let response = [];
        displayable.slice(0, MAX_VISIBLE_TAGS).forEach(tag=> {
            response.push(
                <Badge key={tag.id} variant="neutral">{stripPrefix(tag.tagName)}</Badge>
                )
        });
        const hiddenCount = displayable.length - response.length;
        if (hiddenCount > 0) {
            response.push(
                <Badge key="more" variant="gray">{'+' + hiddenCount}</Badge>
            );
        }
        // createdBy comes from the backend as a plain string (Google id / email / free text),
        // not a resolved user object, so we display it as-is rather than assuming .name/.picture.
        const createdByDisplayName = (createdBy && typeof createdBy === 'object')
            ? (createdBy.name || '').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            : (createdBy || '');
        const createdByPicture = (createdBy && typeof createdBy === 'object') ? createdBy.picture : null;
        return <div className='flex flex-row items-center gap-2 flex-wrap mt-2'>
            <div className='flex items-center gap-1 text-gray-400'>
                <AiFillTags size={14} />
            </div>
            {createdByDisplayName &&
                <div className='flex items-center gap-1.5 bg-gray-50 rounded-full pl-1 pr-2 py-0.5'>
                    {createdByPicture &&
                        <img
                            className="rounded-full w-5 h-5"
                            src={createdByPicture}
                            alt={createdByDisplayName}
                            referrerpolicy="no-referrer"
                        />
                    }
                    <span className='text-xs text-gray-500'>{createdByDisplayName}</span>
                </div>
            }
            <div className='flex gap-1 flex-wrap'>
                {response}
            </div>
        </div>;
    }

    getQuestionEligibleIcon = (question) => {
        if(question.createdBy != null && question.createdBy == UserDetailsUtil.getUserGoogleId()) {
            return <div className='flex items-center gap-2 px-2'>
                <BsFillPencilFill size={15} className="text-primary-600 cursor-pointer" onClick={()=>this.openQuestionEditingViewInNewTab(question.id)}/>
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
                    <EmptyState
                        title="No questions found"
                        description="Try adjusting your filters or search terms."
                    />
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        const currentUserGoogleId = UserDetailsUtil.getUserGoogleId();
        this.props.questionSet.questions.questions.forEach((question, index) => {
            const isOwner = currentUserGoogleId != null && question.createdBy === currentUserGoogleId;
            let newRow = <TableRow key={question.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="border-b border-gray-100 py-4">
                    <div className='flex flex-row items-start'>
                        <div className='flex flex-row grow cursor-pointer' onClick = {()=>this.redirectToQuestionSubmissionViewInSameTab(question.id)}>
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className={typography.body}>
                                    {/* Clamped preview - see .math-content--preview in index.css.
                                        Full body (with diagrams and tables) renders on the solve page. */}
                                    <div
                                        className="math-content math-content--preview"
                                        dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(question.description)}}
                                    ></div>
                                </div>
                                {this.getTagsDivJSX(question.tags, question.createdBy)}
                            </div>
                            {this.getQuestionEligibleIcon(question)}
                        </div>
                        <div className='flex flex-row gap-2 pl-4 shrink-0'>
                            <Button size="sm" variant="primary" onClick={()=>this.openQuestionSubmissionViewInNewTab(question.id)}>
                                Solve
                            </Button>
                            {isOwner &&
                                <Button size="sm" variant="secondary" onClick={()=>this.openQuestionEditingViewInNewTab(question.id)}>
                                    Edit
                                </Button>
                            }
                        </div>
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
                    <EmptyState
                        title="No papers found"
                        description="Try adjusting your filters or search terms."
                    />
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        this.props.paperSet.papers.forEach((paper, index) => {
            let newRow = <TableRow key={paper.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="border-b border-gray-100 py-4">
                    <div className='flex flex-row items-start'>
                        <div className='flex flex-col flex-1 cursor-pointer' onClick = {()=>this.redirectToPaperSubmissionViewInSameTab(paper.id)}>
                            <div className={typography.body}>
                                <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(paper.paper_name)}}></div>
                            </div>
                            {this.getTagsDivJSX(paper.tags)}
                        </div>
                        <div className='flex flex-row gap-2 pl-4 shrink-0'>
                            <Button size="sm" variant="primary" onClick={()=>this.redirectToPaperSubmissionViewInNewTab(paper.id)}>
                                Solve
                            </Button>
                        </div>
                    </div>
                </TableCell>
            </TableRow>;
            tableRows.push(newRow);
        });
        return tableRows;
    }

    getQuestionsTableJSX = () => {
        return <div className='w-full'>
                {this.getQuestionsTableHeaderJSX()}
                <TableContainer component={Paper} elevation={0} className='w-full' >
                    <Table aria-label="questions and papers list">
                        <TableBody>
                            {
                                this.props.generalInfo==undefined || this.props.generalInfo.isViewingQuestions
                                    ?this.getQuestionsTableBodyRowsJSX()
                                    :this.getPapersTableBodyRowsJSX()
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
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

    getPagingSection = () => {
        return <PagingSection
            pageCount = {this.props.questionSet.questions.pageCount}
            currentPageNumber = {this.props.questionSet.currentPage}
            handlePageChange= {this.handlePageChange}
            currentPageSize = {this.props.questionSet.currentPageSize}
            updatePageSize ={this.updatePageSize}
            togglePageSettingPopover = {this.toggleLoginPopOver}
            isPageSettingsConfigOpen = {this.state.isPageSettingsConfigOpen}
        />
    }

    updateSearchText = () => {
        QuestionsReceiver.getAllFilteredQuestions(this.props.generalInfo.searchText, [], []).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = questionsData.data;
            payload.searchedKey = this.props.generalInfo.searchText;
            this.props.saveQuestionSet(payload);
        });
    }

    /**
     * Page heading. The list previously started immediately under the header with no
     * title or context, so the page gave no sense of what you were looking at.
     * The page indicator is derived from the pagination the API already returns
     * rather than a hardcoded total, so it cannot drift out of date.
     */
    getPageHeadingJSX = () => {
        const isViewingQuestions = typeof this.props.generalInfo == "undefined" || this.props.generalInfo.isViewingQuestions;
        const set = this.props.questionSet || {};
        const currentPage = set.currentPage;
        const pageCount = set.pageCount;
        return <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
            <div>
                <h1 className={typography.h1}>
                    {isViewingQuestions ? 'Question bank' : 'Papers'}
                </h1>
                <p className='mt-1 text-sm text-gray-500'>
                    {isViewingQuestions
                        ? 'A curated collection of previous-year JEE Main questions with detailed solutions, searchable by subject, chapter, topic and year.'
                        : 'Timed practice papers curated from our question bank.'}
                </p>
            </div>
            {currentPage && pageCount
                ? <div className='text-sm text-gray-500 shrink-0'>
                    Page <span className='font-semibold text-gray-700'>{currentPage}</span> of {pageCount}
                </div>
                : null}
        </div>;
    }

    render() {
        if(MiscUtils.isUserOnSmallScreen()) {
            return <QuestionSetSmallScreen/>
        }
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.questionSet === undefined){
            this.initializeQuestions();
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader
                    updateSearchText = {this.updateSearchText}
                />
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>
        }
        this.resetResourceCreationSessionStorage();
        return <div className='bg-gray-50 min-h-screen'>
            <EducationalBridgeHeader
                updateSearchText = {this.updateSearchText}
            />
            {/* Same layout.container as the header, so the content column's left edge
                lines up with the wordmark. Rails are fixed-width; the content column
                flexes to fill whatever is left rather than being capped, which is what
                lets the list use the full width on a large display. */}
            <div className={layout.container + ' py-8 flex gap-6 items-start'}>
                <AdRail />
                {/* Content column stays free of ad units - advertising lives only in
                    the left/right rails. */}
                <div className="flex-1 min-w-0">
                    {this.getPageHeadingJSX()}
                    <div className='mt-6'>
                        <TagFilterViewLarge/>
                    </div>
                    <PageCard padding="p-0" className="mt-4 overflow-hidden">
                        {this.getQuestionsTableJSX()}
                    </PageCard>
                    <div className='w-full flex justify-center py-8'>
                        {this.getPagingSection()}
                    </div>
                </div>
                <AdRail />
            </div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionSet);
