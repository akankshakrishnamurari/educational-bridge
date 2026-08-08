import React from 'react';
import '../App.css';
import { connect } from 'react-redux';
import {saveSubmittedPaperDetails, savePaperDetails, updateGeneralInfo} from '../store/actions/solgressAction'
import PaperAPIsConnector from "../apis/PaperAPIsConnector";
import { PaperViewHelperUtil } from '../utils/PaperViewHelperUtil';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {currentURLHost} from './../constants/hostConfig';
import EducationalBridgeHeader from './../js/header/EducationalBridgeHeader';
import { generalTextSize } from '../constants/TextSizeConstants';
import RadarChart from 'react-svg-radar-chart';
import 'react-svg-radar-chart/build/css/index.css';
import { AiFillSetting } from "react-icons/ai";
import TableHead from "@mui/material/TableHead";
import {BsCircleFill} from "react-icons/bs";
import { Chart } from "react-google-charts";
import ClipLoader from "react-spinners/ClipLoader";
import UserAPIConnector from '../apis/UserAPIConnector';
import notify from '../utils/notify';
import { typography } from '../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    saveSubmittedPaperDetails: (payload) => dispatch(saveSubmittedPaperDetails(payload)),
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        submittedPaperDetails: state.solgressReducer.submittedPaperDetails,
        paperDetails: state.solgressReducer.paperDetails,
        generalInfo: state.solgressReducer.generalInfo
    };
}

class PaperSubmissionView extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeSubmittedPaperDetails = this.initializeSubmittedPaperDetails.bind(this);
    }

    initializeSubmittedPaperDetails = () => {
        const search = window.location.search;
        const paperId = new URLSearchParams(search).get('paper_submission_response_id');
        PaperAPIsConnector.getSubmittedPaperDetails(paperId).then( submittedPaperData => {
            this.props.saveSubmittedPaperDetails(submittedPaperData.data);
            this.props.savePaperDetails(PaperViewHelperUtil.normalise(submittedPaperData.data.paperDetails));
        });
    }

    getMaximumPossibleOptionsInPaper = () => {
        let maximumPossibleOptions = 0;
        for(var i=0; i<this.props.paperDetails.length; i++) {
            if(this.props.paperDetails[i].options.length > maximumPossibleOptions) {
                maximumPossibleOptions = this.props.paperDetails[i].options.length;
            }
        }
        return maximumPossibleOptions;
    }

    getQuestionsAnalysisTableHeader = () => {
        let tableHeaderCells = [];
        let maximumPossibleOptions = this.getMaximumPossibleOptionsInPaper();
        tableHeaderCells.push(<TableCell className="bg-slate-100"></TableCell>);
        tableHeaderCells.push(<TableCell className="bg-slate-100"><div className={generalTextSize + ' font-bold text-center'}>Your Response</div></TableCell>);
        for(let i=1; i<= maximumPossibleOptions; i++) {
            tableHeaderCells.push(<TableCell className="bg-slate-100"><div className={generalTextSize + ' font-bold text-center'}>{"Option " + i}</div></TableCell>);
        }
        return <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>{tableHeaderCells}</TableRow>;
    }

    getQuestionSubmissionResponse = (questionId) => {
        for(var i=0; i<this.props.submittedPaperDetails.questionSubmittedResponses.length; i++) {
            let currentQuestionSubmittedResponse = this.props.submittedPaperDetails.questionSubmittedResponses[i];
            if(currentQuestionSubmittedResponse.questionData.id === questionId) {
                return currentQuestionSubmittedResponse;
            }
        }
        return null;
    }

    getOptionNumber = (selectedOptionId, options) => {
        for(var i=0; i<options.length; i++) {
            if(options[i].id === selectedOptionId) {
                return i+1;
            }
        }
        return "N/A";
    }

    getQuestionResponseCell = (questionSubmissionResponse) => {
        if(questionSubmissionResponse.questionData.correctOptionId == null) {
            return <TableCell className="bg-slate-50"><div className={generalTextSize + ' font-bold text-center'}>N/A</div></TableCell>;
        }
        else if(questionSubmissionResponse.selectedOptionId == null) {
            return <TableCell className="bg-slate-50"><div className={generalTextSize + 'font-bold text-center'}>Skipped</div></TableCell>;
        }
        else if(questionSubmissionResponse.selectedOptionId === questionSubmissionResponse.questionData.correctOptionId) {
            return <TableCell className="bg-success-200">
                <div className={generalTextSize + ' font-bold text-center text-primary-900'}>
                    <a href={currentURLHost + "question/submission/view?response_id=" + questionSubmissionResponse.responseId}>
                        Option {this.getOptionNumber(questionSubmissionResponse.selectedOptionId, questionSubmissionResponse.questionData.options)}
                    </a>
                </div>
            </TableCell>;
        } else {
            return <TableCell className="bg-danger-200">
                <div className={generalTextSize + ' font-bold text-center text-primary-900'}>
                    <a href={currentURLHost + "question/submission/view?response_id=" + questionSubmissionResponse.responseId}>
                        Option {this.getOptionNumber(questionSubmissionResponse.selectedOptionId, questionSubmissionResponse.questionData.options)}
                    </a>
                </div>
            </TableCell>;
        }
    }

    getOptionPercentageSelectionOfQuestion = (questionId, optionId) => {
        for(var i=0; i<this.props.submittedPaperDetails.questionSubmittedResponses.length; i++) {
            let questionResponse = this.props.submittedPaperDetails.questionSubmittedResponses[i];
            if(questionResponse.questionData.id === questionId) {
                var numerator = questionResponse.optionIdToOptionResponseCount[optionId];
                var denumerator = questionResponse.totalResponses;
                var percentage = (numerator*100)/denumerator;
                if(numerator==null || denumerator==0) {
                    percentage = 0;
                }
                return percentage.toFixed(2)+"%";
            }
        }
        return "N/A";
    }

    getQuestionOptionCells = (questionDetail) => {
        let cells = [];
        for(var i=0; i<questionDetail.options.length; i++) {
            let questionOptionPercentageSelection = this.getOptionPercentageSelectionOfQuestion(questionDetail.id, questionDetail.options[i].id);
            if(questionDetail.options[i].id === questionDetail.correctOptionId) {
                cells.push(<TableCell className="bg-slate-50"><div className={generalTextSize + ' text-center text-success-600 text-bold'}>{questionOptionPercentageSelection}</div></TableCell>);
            }
            else {
                cells.push(<TableCell className="bg-slate-50"><div className={generalTextSize + ' text-center text-danger-600 '}>{questionOptionPercentageSelection}</div></TableCell>);
            }
        }
        return cells;
    }
    
    getQuestionsAnalysisTableBody = () => {
        let tableRows = [];
        for(let i=0; i<this.props.paperDetails.length; i++) {
            let questionDetail = this.props.paperDetails[i];
            let questionId = questionDetail.id;
            let questionSubmissionResponse = this.getQuestionSubmissionResponse(questionId);
            let cells = [];
            cells.push(
                <TableCell className="bg-slate-50">
                    <div className={ generalTextSize + ' font-bold text-center text-primary-800'}>
                        <a href={currentURLHost + "question/view?question_id="+questionId}>
                            Question {i+1}
                        </a>
                    </div>
                </TableCell>
            );
            if(questionSubmissionResponse == null) {
                cells.push(<TableCell className="bg-slate-50"><div className={generalTextSize + ' text-center'}>Skipped</div></TableCell>);
            } else {
                cells.push(this.getQuestionResponseCell(questionSubmissionResponse));

            }
            cells.push(this.getQuestionOptionCells(questionDetail));
            tableRows.push(<TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>{cells}</TableRow>);
        }
        return tableRows;
    }

    getPaperResponseAnalyticsTable = () => {
        return <div>
            <div className={generalTextSize + ' text-center py-2 bg-primary-50 text-gray-700'}>
                Question wise selected options and percentage of students who selected respective options
            </div>
            <Table sx={{ minWidth: 650 }} sy={{ minWidth: 650 }} aria-label="simple table" className="bg-white">
                <TableBody>
                    {this.getQuestionsAnalysisTableHeader()}
                    {this.getQuestionsAnalysisTableBody()}    
                </TableBody>
            </Table>
        </div>;
    }

    getPaperScore = () => {
        let correctQuestions = [];
        let questionResponses = this.props.submittedPaperDetails.questionSubmittedResponses;
        let incorrectQuestions = [];
        for(var i=0; i<questionResponses.length; i++) {
            if(questionResponses[i].selectedOptionId === questionResponses[i].questionData.correctOptionId) {
                correctQuestions.push(questionResponses[i].questionData.id);
            }
            else {
                incorrectQuestions.push(questionResponses[i].questionData.id);
            }
        }
        let scoreAchieved = 0;
        let subjectWiseSectionWiseQuestions = this.props.submittedPaperDetails.paperDetails.subject_wise_section_wise_questions;
        for (const [, sectionWiseQuestions] of Object.entries(subjectWiseSectionWiseQuestions)) {
            for (const [, questionsData] of Object.entries(sectionWiseQuestions)) {
                let correctMarksPerQuestion = questionsData.correct_answer_marks;
                let incorrectMarksPerQuestion = questionsData.incorrect_answer_marks;
                for( i=0; i<questionsData.question_ids.length; i++) {
                    let questionId = questionsData.question_ids[i];
                    if(correctQuestions.includes(questionId)) {
                        scoreAchieved += correctMarksPerQuestion;
                    } 
                    else if(incorrectQuestions.includes(questionId)) {
                        scoreAchieved += incorrectMarksPerQuestion;
                    }
                }
            }
        }
        return scoreAchieved;
    }

    getTotalScoreOfPaper = () => {
        let paperScore = 0;
        let subjectWiseSectionWiseQuestions = this.props.submittedPaperDetails.paperDetails.subject_wise_section_wise_questions;
        for (const [, sectionWiseQuestions] of Object.entries(subjectWiseSectionWiseQuestions)) {
            for (const [, questionsData] of Object.entries(sectionWiseQuestions)) {
                paperScore += (questionsData.correct_answer_marks*questionsData.question_ids.length);
            }
        }
        return paperScore;
    }   
    
    getTotalCorrectQuestions = () => {
        let correctQuestions = 0;
        let questionResponses = this.props.submittedPaperDetails.questionSubmittedResponses;
        for(var i=0; i<questionResponses.length; i++) {
            if(questionResponses[i].selectedOptionId === questionResponses[i].questionData.correctOptionId) {
                correctQuestions += 1;
            }
        }
        return correctQuestions;
    }

    getTotalIncorrectQuestions = () => {
        let incorrectQuestions = 0;
        let questionResponses = this.props.submittedPaperDetails.questionSubmittedResponses;
        for(var i=0; i<questionResponses.length; i++) {
            if(questionResponses[i].selectedOptionId !== questionResponses[i].questionData.correctOptionId) {
                incorrectQuestions += 1;
            }
        }
        return incorrectQuestions;
    }

    getTotalSkippedQuestions = () => {
        return this.props.paperDetails.length - this.props.submittedPaperDetails.questionSubmittedResponses.length;
    }

    getPaperScoreOverview = () => {
        return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className={typography.body}>Total Score:</span>
                <span className={typography.h1}>{this.getPaperScore()} / {this.getTotalScoreOfPaper()}</span>
            </div>
            <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    Result Awaiting
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-100">
                    {this.getTotalCorrectQuestions()} Correct
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-danger-50 text-danger-700 border border-danger-100">
                    {this.getTotalIncorrectQuestions()} Incorrect
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    {this.getTotalSkippedQuestions()} Skipped
                </span>
            </div>
        </div>;
    }

    getSubjectWiseTopicWiseImportantGraphs = () => {
        return <div></div>;
    }
    getAllTags = () => {
        let allTags=[];
        let payload= [...this.props.submittedPaperDetails.paperResponseAnalysis.candidateScoreAnalysis.tagIdToCandidateScoreAnalysis];
        const uniqueIdentifiers = [];
        for (const key in payload) {
            allTags.push(key);
        }

    }
    getTopicWiseScoreAnalysis = () => {
        let tagIdToTopicMap= new Map();
        for(let index=0;index<this.props.paperDetails.length;index++){
            let questionTagDetail = this.props.paperDetails[index].tags;
            let tagDetails ={topic:"",tagid:"",subject:""};
            for(let tagindex=0;tagindex<questionTagDetail.length;tagindex++){
                if(questionTagDetail[tagindex].tagName.startsWith("Topic : ")){
                    tagDetails.topic=questionTagDetail[tagindex].tagName.substring(8);
                    tagDetails.tagid=questionTagDetail[tagindex].id;
                }
                if(questionTagDetail[tagindex].tagName.startsWith("Subject : ")){
                    tagDetails.subject=questionTagDetail[tagindex].tagName.substring(10);
                }
            }
            tagIdToTopicMap.set(tagDetails.tagid, { topic: tagDetails.topic, subject: tagDetails.subject });
        }
        let candidatePayload= {...this.props.submittedPaperDetails.paperResponseAnalysis.candidateScoreAnalysis.tagIdToCandidateScoreAnalysis};
        let topperPayload= {...this.props.submittedPaperDetails.paperResponseAnalysis.topperScoreAnalysis.tagIdToCandidateScoreAnalysis};
        let comparedCandidatePayload={};
        if(this.props.generalInfo ==undefined || this.props.generalInfo.comparedCandidateDetails == undefined){
            comparedCandidatePayload = {...this.props.submittedPaperDetails.paperResponseAnalysis.topperScoreAnalysis.tagIdToCandidateScoreAnalysis};
            comparedCandidatePayload.comparedToName= "Topper"
        }
        else{
            comparedCandidatePayload = {...this.props.generalInfo.comparedCandidateDetails};
            comparedCandidatePayload.comparedToName= this.props.generalInfo.comparedWith;
        }
        let allTags=[];
        const scoreData = [
            ["Subject", "Your Score", comparedCandidatePayload.comparedToName+"'s score"]
        ];
        const accuracyWiseTimeSpentData = [
            ["Accuracy", "Minutes spent by you", "Minutes spent by "+comparedCandidatePayload.comparedToName],
            ["Correct Questions", 30, 45],
            ["Incorrect Questions", 20, 3],
            ["Skipped Question", 15, 17]
        ];
        const marksPerMinuteData = [
            ["Subject", "Your Marks per minute spent", comparedCandidatePayload.comparedToName+"'s marks per minute spent"],
            ["Physics: Kinematics", 1.6, 2.3],
            ["Physics: Fluid Mechanics", 2.1, 3.1],
            ["Chemistry: Chemical Reactions", 3.6, 4.1],
            ["Chemistry: Periodic Table", 4.8, 4.6],
            ["Maths: logs", 0.8, 1.2],
        ];
        for(const key in candidatePayload){
            if(tagIdToTopicMap.has(key) == true){
                let candidateTotalTimeSpent=candidatePayload[key].timeSpentOnCorrectQuestions+candidatePayload[key].timeSpentOnIncorrectQuestions;
                let comparedCandidateTotalTimeSpent=comparedCandidatePayload[key].timeSpentOnCorrectQuestions+comparedCandidatePayload[key].timeSpentOnIncorrectQuestions;
                let candidateMarksPerMinute=(candidatePayload[key].totalScore/candidateTotalTimeSpent).toFixed(2);
                let comparedCandidateMarksPerMinute =(comparedCandidatePayload[key].totalScore/comparedCandidateTotalTimeSpent).toFixed(2);
                // let topperMarksPerMinute=(topperPayload[key].totalScore/topperTotalTimeSpent).toFixed(2);
                scoreData.push([tagIdToTopicMap.get(key).subject+" : "+tagIdToTopicMap.get(key).topic,candidatePayload[key].totalScore,comparedCandidatePayload[key].totalScore]);
                marksPerMinuteData.push([tagIdToTopicMap.get(key).subject+" : "+tagIdToTopicMap.get(key).topic,candidateMarksPerMinute,comparedCandidateMarksPerMinute]);
            }
            else{
                console.log("prakasj")
            }
            // marksPerMinuteData.push(["physics : key",])
        }
          
        const scoreOptions = {
            title: "You vs Topper (Topic wise score)",
            chartArea: { width: "60%", height:"75%" },
            hAxis: {
              title: "Marks per minute",
              minValue: 0,
            },
            vAxis: {
              title: "Topics",
            },
            colors: ['#f4f700', '#73fa98']
          };
        
          
        const accuracyWiseTimeSpentOptions = {
            title: "You vs Topper (Time spent for correct and incorrect questions)",
            chartArea: { width: "60%", height:"75%" },
            hAxis: {
              title: "Total Time Spent",
              minValue: 0,
            },
            vAxis: {
              title: "Accuracy",
            },
            colors: ['#f4f700', '#73fa98']
          };
          
        const marksPerMinuteOptions = {
            title: "You vs Topper (Marks per minute spent on a topic)",
            chartArea: { width: "60%", height:"75%" },
            hAxis: {
              title: "Score",
              minValue: 0,
            },
            vAxis: {
              title: "Topics",
            },
            colors: ['#f4f700', '#73fa98']
          };
        return <div className='pb-10'>
            <div className='pb-10'>
                <Chart
                    chartType="BarChart"
                    width="100%"
                    height={(accuracyWiseTimeSpentData.length*40) + "px"}
                    data={accuracyWiseTimeSpentData}
                    options={accuracyWiseTimeSpentOptions}
                />
            </div>
            <div className='pb-10'>
                <Chart
                    chartType="BarChart"
                    width="100%"
                    height={(scoreData.length*40) + "px"}
                    data={scoreData}
                    options={scoreOptions}
                />
            </div>
            <Chart
                chartType="BarChart"
                width="100%"
                height={(marksPerMinuteData.length*40) + "px"}
                data={marksPerMinuteData}
                options={marksPerMinuteOptions}
            />
        </div>
    }
    showSelectedUserSubmissionView = async (index) => {
        let selectedUserEmailId = this.props.generalInfo.suggestedUsers[index].userId;
        let selectedUserDetails;
        // const papersSummaryData = await PaperAPIsConnector.getUserSubmmittedPapersSummary(suggestedUserEmailId).data;
        await PaperAPIsConnector.getUserSubmmittedPapersSummary(selectedUserEmailId).then(papersSummaryData=>{
            // this.props.saveUserPapersSummary(papersSummaryData.data);
            selectedUserDetails=papersSummaryData.data; 
            console.log("dj")
        });
        let currentUserSubmittedPaperId=this.props.submittedPaperDetails.paperDetails.id;
        let selectedUserPaperSubmissionId="-1";
        for(let i =0 ;i<selectedUserDetails.length;i++){
            if(selectedUserDetails[i].paperId == currentUserSubmittedPaperId){
                selectedUserPaperSubmissionId =selectedUserDetails[i].paperSubmissionId;
            }
        }
        if(selectedUserPaperSubmissionId != -1){
            PaperAPIsConnector.getSubmittedPaperDetails(selectedUserPaperSubmissionId).then( submittedPaperData => {
                console.log(9);
                let payload = {...this.props.generalInfo};
                payload.comparedWith = this.props.generalInfo.suggestedUsers[index].firstName;
                payload.comparedCandidateDetails =submittedPaperData.data.paperResponseAnalysis.candidateScoreAnalysis.tagIdToCandidateScoreAnalysis;
                this.props.updateGeneralInfo(payload);
            });
        }
        else{
            notify.info("This user has not attempted this test paper.");
        }
    }
    updateUserDetails = (event) => {
        let payload= {...this.props.generalInfo};      
        payload.searchUserText=event;
        UserAPIConnector.getSuggestedUsers(event).then(userData=>{
            payload.suggestedUsers =userData.data;
            this.props.updateGeneralInfo(payload);
        });
    }
    
    showSuggestedUsers = () => {
        let response = [];
        let suggestedUsers = this.props.generalInfo?.suggestedUsers || [];
        for (let index = 0; index < suggestedUsers.length; index++) {
            response.push(
                <div
                className={generalTextSize + " px-3 py-1 border-l border-t border-r hover:bg-gray-50 w-full bg-white"}
                onClick={() => this.showSelectedUserSubmissionView(index)}
                >
                <div className="flex flex-row w-full">
                    <div className="flex flex-row px-2 py-1">
                        <div>
                            <img
                                src={suggestedUsers[index].picture} // Assuming suggestedUsers[index].picture holds the image URL
                                alt="User Picture"
                                className="w-10 h-10 rounded-full mr-2"
                            />
                        </div>
                        <div>
                            {suggestedUsers[index].firstName}
                        </div>
                    </div>
                </div>
                </div>
            );
        }
        return <div className="flex overflow-auto flex-col w-full">{response}</div>;

    }
    getTopicWiseRadarChart = () => {
        let tagIdToTopicMap= new Map();
        let payload= {...this.props.paperDetails};
        for(let index=0;index<this.props.paperDetails.length;index++){
            let questionTagDetail = this.props.paperDetails[index].tags;
            let tagDetails ={topic:"a",tagid:"b",subject:"c"};
            for(let tagindex=0;tagindex<questionTagDetail.length;tagindex++){
                if(questionTagDetail[tagindex].tagName.startsWith("Topic : ")){
                    tagDetails.topic=questionTagDetail[tagindex].tagName.substring(8);
                    tagDetails.tagid=questionTagDetail[tagindex].id;
                }
                if(questionTagDetail[tagindex].tagName.startsWith("Subject : ")){
                    tagDetails.subject=questionTagDetail[tagindex].tagName.substring(10);
                }
            }
            tagIdToTopicMap.set(tagDetails.tagid, { topic: tagDetails.topic, subject: tagDetails.subject });
        }
        let candidatePayload= {...this.props.submittedPaperDetails.paperResponseAnalysis.candidateScoreAnalysis.tagIdToCandidateScoreAnalysis};
        let topperPayload= {...this.props.submittedPaperDetails.paperResponseAnalysis.topperScoreAnalysis.tagIdToCandidateScoreAnalysis};
        let comparedCandidatePayload={};
        if(this.props.generalInfo == undefined || this.props.generalInfo.comparedCandidateDetails ==undefined){
            comparedCandidatePayload={...this.props.submittedPaperDetails.paperResponseAnalysis.topperScoreAnalysis.tagIdToCandidateScoreAnalysis};;
            comparedCandidatePayload.comparedToName= "Topper"
        }
        else{
            comparedCandidatePayload = {...this.props.generalInfo.comparedCandidateDetails};
            comparedCandidatePayload.comparedToName= this.props.generalInfo.comparedWith;
        }
        let allTags=[];
        const data = [  {    data: {
            },
            meta: { color: '#44f744' }
          },
          {
            data: {
            },
            meta: { color: '#f4f700' }
          }
        ];
        const captions = {
        };
        
        for(const key in candidatePayload){
            if(tagIdToTopicMap.has(key) == true){
                data[0].data[tagIdToTopicMap.get(key).subject+"_"+tagIdToTopicMap.get(key).topic]=(candidatePayload[key].totalScore/candidatePayload[key].maximumScore);
                data[1].data[tagIdToTopicMap.get(key).subject+"_"+tagIdToTopicMap.get(key).topic]=(comparedCandidatePayload[key].totalScore/comparedCandidatePayload[key].maximumScore);
                captions[(tagIdToTopicMap.get(key).subject+"_"+tagIdToTopicMap.get(key).topic)]=(tagIdToTopicMap.get(key).subject+" : "+tagIdToTopicMap.get(key).topic)
            }
           
        }
        data[0].data["subject"+"_"+"topic"]=(1);
        data[1].data["subject"+"_"+"topic"]=(1);
        captions["subject"+"_"+"topic"]="physics : topic"
        return <div>
            <div className='flex justify-center text-xl font-bold bg-primary-100 py-2'>
                Performance
            </div>
            <div>
                <label>User</label>
                <input type="text"
                    value={(this.props.generalInfo ==undefined || this.props.generalInfo.searchUserText == undefined)? "":this.props.generalInfo.searchUserText}
                    onChange={(event) => this.updateUserDetails(event.target.value)}
                    placeholder="Search users paper analysis">
                </input>
                <div>
                    {this.showSuggestedUsers()}
                </div>
            </div>
            <div className='px-5 flex flex-col md:flex-row pt-3'>
                <div className='w-full flex flex-col md:flex-row'>
                    <div className='flex flex-row w-full h-fit justify-center'>
                        <Table aria-label="simple table w-fit">
                            <TableBody>
                                <TableRow className='border bg-gray-200'>
                                    <TableCell/>
                                    <TableCell>
                                        Compare your performance with 
                                    </TableCell>
                                </TableRow>
                                <TableRow className='border'>
                                    <TableCell>
                                        <input type="radio" checked/>
                                    </TableCell>
                                    <TableCell>
                                        Top Scorer of the paper
                                    </TableCell>
                                </TableRow>
                                <TableRow className='border'>
                                    <TableCell>
                                        <input type="radio"/>
                                    </TableCell>
                                    <TableCell>
                                        Top 10% scorer
                                    </TableCell>
                                </TableRow>
                                <TableRow className='border'>
                                    <TableCell>
                                        <input type="radio"/>
                                    </TableCell>
                                    <TableCell>
                                        Student : Krishna Murari
                                    </TableCell>
                                </TableRow>
                                {/* <TableRow className='border'>
                                    <TableCell>
                                        <input type="radio"/>
                                    </TableCell>
                                    <TableCell>
                                        Group Average : Vibrant (P2 Batch)
                                    </TableCell>
                                </TableRow> */}

                            </TableBody>
                        </Table>
                    </div>
                    <div className='flex w-full'/>  
                    <div className='px-2'>
                        <div className={generalTextSize + ' flex justify-left font-bold px-5 py-2'}>
                            You vs {comparedCandidatePayload.comparedToName} (Performace Radar)
                        </div>
                        
                        <RadarChart
                            captions={captions}
                            data={data}
                            size={400}
                        />
                    </div>
                    <div className='py-2 flex justify-between  h-fit w-full'>
                        <Table className='bg-white w-full '>
                            <TableRow>
                                <div className='flex flex-row w-full justify-center'>
                                    <div className='py-1'>
                                        <BsCircleFill color='yellow'/>
                                    </div>
                                    <div className={generalTextSize + ' pl-3'}>
                                        Your Performance
                                    </div>
                                </div>
                            </TableRow>
                            <TableRow>
                                <div className='flex flex-row w-full justify-center'>
                                    <div className='py-1'>
                                        <BsCircleFill color='green'/>
                                    </div>
                                    <div className={generalTextSize + ' pl-3'}>
                                        {comparedCandidatePayload.comparedToName} performance
                                    </div>
                                </div>
                            </TableRow>
                        </Table>
                    </div>
                </div>
            </div>
            {this.getTopicWiseScoreAnalysis()}
        </div>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.submittedPaperDetails === undefined || this.props.paperDetails === undefined || this.props.generalInfo === undefined) {
            this.initializeSubmittedPaperDetails();
            return <div>
                <div className='bg-gray-50 min-h-screen'>
                    <EducationalBridgeHeader/>
                    <div className='flex justify-center py-20'>
                        <ClipLoader color="#2563EB" size="60"/>
                    </div>
                </div>
            </div>;
        }
        return (
            <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader
                    updateSearchText = {this.updateSearchText}
                />
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
                    {/* {this.getPaperScoreOverview()} */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                        {this.getTopicWiseRadarChart()}
                    </div>
                </div>
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperSubmissionView);
