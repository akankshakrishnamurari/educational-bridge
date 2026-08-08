import React from 'react';
import Split from "react-split";
import { connect } from 'react-redux';
import {saveUserPapersSummary} from '../../store/actions/solgressAction';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import {searchTableHeaderCellCSS,clickableSearchTableBodyCellTextCSS,nonClickableSearchTableBodyCellTextCSS} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';
import ClipLoader from "react-spinners/ClipLoader";
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import AdRail from '../../components/common/AdRail';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    saveUserPapersSummary: (payload) => dispatch(saveUserPapersSummary(payload))
})


const mapStateToProps = state => {
    return {
        userPapersSummary: state.solgressReducer.userPapersSummary
    };
}

class UserPaperSubmissionsSummary extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializePapers = this.initializePapers.bind(this);
    }

    initializePapers = async () => {

        const userDetails = window.sessionStorage.userDetails;
        let userEmail = JSON.parse(userDetails).email;
        await PaperAPIsConnector.getUserSubmmittedPapersSummary(userEmail).then(papersSummaryData=>{
            this.props.saveUserPapersSummary(papersSummaryData.data);
        });
    }

    getPapersSummaryTableHeaderJSX = () => {
        return <TableRow className='bg-gray-50'>
            <TableCell className='border-b border-gray-100'>
                <p className={typography.label}>
                    Papers 
                </p>
            </TableCell>
            <TableCell className='border-b border-gray-100'>
                <p className={typography.label}>
                    Submission Date
                </p>
            </TableCell>
            <TableCell className='border-b border-gray-100'>
                <p className={typography.label}>
                    Status
                </p>
            </TableCell>
        </TableRow>;
    }
   
    redirectToPaperSubmissionViewInSameTab = (paperId, paperSubmissionId, isPaperSubmissionBlocked) => {
        if(isPaperSubmissionBlocked) {
            window.location.href = currentURLHost + 'paper/submission/view?paper_submission_response_id=' + paperSubmissionId;
        } 
        else {
            window.location.href = currentURLHost + 'paper/view?paper_id=' + paperId + '&paper_instance_id=' + paperSubmissionId;
        }
    }

    getPapersSummaryTableBodyRowsJSX = () => {
        let tableRows = [];
        if(this.props.userPapersSummary.length===0) {
            let noTableFoundRow = <TableRow>
                <TableCell className="border-0">
                    <EmptyState title="No solved or ongoing papers" description="Papers you attempt will show up here." />
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
        }
        else {
            for(let i=0; i<this.props.userPapersSummary.length; i++) {
                let paperSummary = this.props.userPapersSummary[i];
                let tableRow = <TableRow key={paperSummary.paperSubmissionId} className="hover:bg-gray-50 transition-colors">
                    <TableCell className='border-b border-gray-100'>
                        <div className={clickableSearchTableBodyCellTextCSS + ' text-xs md:text-sm xl:text-lg'}
                            onClick = {()=>this.redirectToPaperSubmissionViewInSameTab(paperSummary.paperId, paperSummary.paperSubmissionId,paperSummary.paperSubmissionBlocked)}
                        >
                            {paperSummary.paperName}
                        </div>
                    </TableCell>
                    <TableCell className='border-b border-gray-100'>
                        <div className={nonClickableSearchTableBodyCellTextCSS}>
                            {new Date(parseInt(paperSummary.submissionDate)).toLocaleDateString('en-GB', { day: '2-digit',month: 'short', year: 'numeric'}).replace(/ /g, '-')}
                        </div>
                    </TableCell>
                    <TableCell className='border-b border-gray-100'>
                        <Badge variant={paperSummary.paperSubmissionBlocked ? 'success' : 'warning'}>
                            {paperSummary.paperSubmissionBlocked?'Submitted':'Ongoing'}
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
        if(this.props.userPapersSummary === undefined){
            this.initializePapers();
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
                    <div className={typography.h1 + ' pb-4'}>My Papers</div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <TableContainer>
                            <Table aria-label="papers summary">
                                <TableHead>
                                    {this.getPapersSummaryTableHeaderJSX()}
                                </TableHead>
                                <TableBody>
                                    {this.getPapersSummaryTableBodyRowsJSX()}
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

export default connect(mapStateToProps, mapDispatchToProps)(UserPaperSubmissionsSummary);