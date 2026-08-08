import React from 'react';
import { connect } from 'react-redux';

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import {currentURLHost} from './../../constants/hostConfig';
import { JSXUtils } from '../../utils/JSXUtils';
import {MiscUtils} from '../../utils/MiscUtils'



const mapStateToProps = state => {
    return {
        paperSet: state.solgressReducer.paperSet
    };
}

class PaperSetTableView extends React.Component {

    redirectToQuestionSubmissionViewInSameTab = (paperId) => {
        window.location.href = currentURLHost + 'paper/view?paper_id=' + paperId + '&paper_instance_id='+ MiscUtils.generateUUID(); 
    }

    getPapersTableBodyRowsJSX = () => {
        let tableRows = [];
        this.props.paperSet.papers.forEach((paper, index) => {
            let newRow = <TableRow className="hover:bg-slate-100">
                <TableCell>
                    <div className="flex flex-row ...">
                        <div>
                            <p className="text-xs sm:text-base md:text-lg xl:text-xl  text-left text-primary-700 hover:text-primary-900 hover:underline hover:underline-offset-2 ..."
                                onClick = {()=>this.redirectToQuestionSubmissionViewInSameTab(paper.id)}
                            >
                                <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(paper.paper_name)}}></div>
                            </p>
                        </div>
                    </div>
                </TableCell>
                {/* <TableCell className='border border-slate-300'>
                    <p className="text-xm text-left flex justify-center ...">
                        N/A
                    </p>
                </TableCell> */}
                {/* <TableCell className='border border-slate-300 flex justify-center ...'>
                    <div className='flex justify-center ...'>
                        <BsFillPencilFill size={20} color ={'darkblue'} 
                            // onClick={()=>this.openQuestionEditingViewInNewTab(question.id)}
                        />
                    </div>
                </TableCell> */}
            </TableRow>;
            tableRows.push(newRow);
        });
        return tableRows;
    }

    getPapersTableHeaderJSX = () => {
        return <TableRow className = 'bg-gray-100'>
            <TableCell className='border border-slate-300'>
                <p className="text-xs sm:text-base md:text-lg xl:text-xl  font-bold pl-10 ...">
                    Available Papers
                </p>
            </TableCell>
            {/* <TableCell className='border border-slate-300'>
                <p className="text-xl text-left font-bold flex justify-center ...">
                    Rating
                </p>
            </TableCell> */}
            {/* <TableCell className='border border-slate-300'>
                <p className="text-xl text-left font-bold flex justify-center...">
                    Edit
                </p>
            </TableCell> */}
        </TableRow>;
    }

    render() {
        return <div className="flex flex-row">
            <div className = 'w-1/12 lg:w-2/12'></div>
            <div className='w-10/12 lg:w-8/12'>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            {this.getPapersTableHeaderJSX()}
                        </TableHead>
                        <TableBody>
                            {this.getPapersTableBodyRowsJSX()}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <div className = 'w-1/12 lg:w-2/12'></div>
        </div>;
    }

}

export default connect(mapStateToProps)(PaperSetTableView);
