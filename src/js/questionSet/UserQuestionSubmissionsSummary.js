import React from 'react';
import Split from "react-split";
import { connect } from 'react-redux';
import {saveUserQuestionsSummary} from '../../store/actions/solgressAction';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import {searchTableHeaderCellCSS,clickableSearchTableBodyCellTextCSS} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';
import QuestionsReceiver from '../../apis/QuestionsReceiver';
import { JSXUtils } from '../../utils/JSXUtils';
import ClipLoader from "react-spinners/ClipLoader";
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import AdRail from '../../components/common/AdRail';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    saveUserQuestionsSummary: (payload) => dispatch(saveUserQuestionsSummary(payload))
})


const mapStateToProps = state => {
    return {
        userQuestionsSummary: state.solgressReducer.userQuestionsSummary
    };
}

class UserQuestionSubmissionsSummary extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeQuestions = this.initializeQuestions.bind(this);
    }

    initializeQuestions = async () => {

        const userDetails = window.sessionStorage.userDetails;
        let userEmail = JSON.parse(userDetails).email;
        await QuestionsReceiver.getUserSubmmittedQuestionsSummary(userEmail).then(questionsSummaryData=>{
            this.props.saveUserQuestionsSummary(questionsSummaryData.data);
        });
    }

    getQuestionsSummaryTableHeaderJSX = () => {
        return <TableRow className='bg-gray-50'>
            <TableCell className='border-b border-gray-100'>
                <p className={typography.label}>
                    Solved Questions
                </p>
            </TableCell>
            <TableCell className='border-b border-gray-100'>
                <p className={typography.label}>
                    Correctness
                </p>
            </TableCell>
        </TableRow>;
    }
   
    redirectToQuestionViewInSameTab = (questionId) => {
        window.location.href = currentURLHost + 'question/view?question_id=' + questionId; 
    }

    redirectToQuestionSubmissionViewInSameTab = (questionResponseId) => {
        window.location.href = currentURLHost + 'question/submission/view?response_id=' + questionResponseId; 
    }

    getQuestionsSummaryTableBodyRowsJSX = () => {
        let tableRows = [];
        if(this.props.userQuestionsSummary.length===0) {
            let noTableFoundRow = <TableRow>
                <TableCell className="border-0">
                    <EmptyState title="No solved questions yet" description="Questions you solve will show up here." />
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
        }
        else {
            for(let i=0; i<this.props.userQuestionsSummary.length; i++) {
                let questionSummary = this.props.userQuestionsSummary[i];
                let tableRow = <TableRow key={questionSummary.responseId} className="hover:bg-gray-50 transition-colors">
                    <TableCell className='border-b border-gray-100'>
                        <div className={clickableSearchTableBodyCellTextCSS + ' text-xs md:text-sm xl:text-lg'}
                            onClick = {()=>this.redirectToQuestionViewInSameTab(questionSummary.questionId)}
                        >
                            <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(questionSummary.questionDescription)}}></div>
                        </div>
                    </TableCell>
                    <TableCell className='border-b border-gray-100' onClick = {()=>this.redirectToQuestionSubmissionViewInSameTab(questionSummary.responseId)}>
                        <Badge variant={questionSummary.correctSubmission ? 'success' : 'danger'}>
                            {questionSummary.correctSubmission?'Correct':'Incorrect'}
                        </Badge>
                    </TableCell>
                </TableRow>;
                tableRows.push(tableRow);
            }
        }
        return tableRows;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.userQuestionsSummary === undefined){
            this.initializeQuestions();
            return <div>
                <div className='bg-gray-50 min-h-screen'>
                    <EducationalBridgeHeader/>
                    <div className='flex justify-center py-20'>
                        <ClipLoader color="#2563EB" size="60"/>
                    </div>
                </div>
            </div>
        }
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 items-start">
                <AdRail />
                <div className="flex-1 min-w-0 max-w-4xl mx-auto">
                    <div className={typography.h1 + ' pb-4'}>My Solved Questions</div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <TableContainer>
                            <Table aria-label="solved questions summary">
                                <TableHead>
                                    {this.getQuestionsSummaryTableHeaderJSX()}
                                </TableHead>
                                <TableBody>
                                    {this.getQuestionsSummaryTableBodyRowsJSX()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </div>
                <AdRail />
            </div>
        </div> 
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserQuestionSubmissionsSummary);