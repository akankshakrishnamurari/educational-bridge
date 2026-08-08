import React from 'react';
import { connect } from 'react-redux'
import {updateNewPaperDetails, savePaperDetails} from "../../../store/actions/solgressAction";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { BsEyeFill } from "react-icons/bs";
import Collapsible from "react-collapsible";
import SingleSelectMCQPreview from "../previews/SingleSelectMCQPreview";
import {JSXUtils} from "../../../utils/JSXUtils";

const mapDispatchToProps = dispatch => ({
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload)),
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload))
})

const mapStateToProps = state => {
    return {
        newPaperDetails: state.solgressReducer.newPaperDetails,
        paperDetails: state.solgressReducer.paperDetails,
        questionSet: state.solgressReducer.questionSet
    };
}

class NewPaperPreview extends React.Component {

    getQuestionsTableHeaderJSX = (subjectName) => {
        let questionHeaderText = 'Questions';
        if (this.props.newPaperDetails.containsMoreThanOneSubject === "true") {
            questionHeaderText += " for ";
            questionHeaderText += subjectName;
        }
        return <TableRow className = 'bg-gray-100'>
            <TableCell className='border border-slate-300'>
                <p className="text-base sm:text-lg md:text-md xl:text-xl text-left font-bold flex justify-center ...">
                    Q. No
                </p>
            </TableCell>
            <TableCell className='border border-slate-300'>
                <p className="text-base sm:text-lg md:text-md xl:text-xl  text-left font-bold flex justify-center ...">
                    View
                </p>
            </TableCell>
            <TableCell className='border border-slate-300'>
                <p className="text-base sm:text-lg md:text-md xl:text-xl  text-left font-bold pl-10 ...">
                    {questionHeaderText}
                </p>
            </TableCell>
            <TableCell className='border border-slate-300'>
                <p className="text-base sm:text-lg md:text-md xl:text-xl  text-left font-bold flex justify-center ...">
                    Marks
                </p>
            </TableCell>
        </TableRow>;
    }

    getQuestionMinimisedPreviewJSX = (questionId) => {
        let response = <div>Some error occured. Question not found</div>;
        this.props.questionSet.questions.questions.forEach((question) => {
            let questionText =  question.description;
            if(questionText.length > 175) {
                questionText = questionText.substring(0,175) + "...";
            }
            if(question.id === questionId) {
                response = <div className='text-xs sm:text-base md:text-lg xl:text-xl py-2 px-5'>
                    <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(questionText)}}></div>
                </div>;
            }
        });
        return response;
    }

    getQuestionFromQuestionId = (questionId) => {
        let response = {};
        this.props.questionSet.questions.questions.forEach((question) => {
            let questionText =  question.description;
            if(questionText.length > 175) {
                questionText = questionText.substring(0,175) + "...";
            }
            if(question.id === questionId) {
                response = question;
            }
        });
        return response;
    }

    getMarksCell = () => {
        return <div>
            <div className='flex flex-row justify-center items-center hover:bg-slate-100 py-2...'>
                <div className='bg-success-500 px-3 py-2'>+{3}</div>
                <div className = 'px-1 py-2'>,</div>
                <div className='bg-danger-500 px-3 py-2 '>{-1}</div>
            </div>
        </div>
    }

    getExpandedPreview = () => {
        // if(this.props.newPaperDetails.containsMoreThanOneSubject === 'false') {
            // return <div>I contain more than one subject's question preview</div>
        // } 
        // else {
            let response = [];
            if(this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions===undefined) {
                return response;
            }
            let index = 0;
            for (var subjectName in this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions) {
                let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[index][0];
                let questionsPreview = [];
                this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName]
                    .forEach((questionId, index) => {
                        let tiggerContent = <div className='flex flex-row ...'>
                            <div className='text-xl bg-gray-300 rounded py-2 px-5'>Q {index+1}</div>
                            {this.getQuestionMinimisedPreviewJSX(questionId)}
                        </div>;
                        let question = this.getQuestionFromQuestionId(questionId);
                        let collapsibleQuestionView = <Collapsible 
                                trigger={tiggerContent}
                                className = "border-b-2 border-primary-200 Collapsible__trigger">
                                <div className='border-2 border-success-200 px-24 '>
                                    <SingleSelectMCQPreview
                                        questionText = {question.description}
                                        options = {JSXUtils.buildMCQOptionsPreviewData(question.options, question.options.length)}
                                        needCompletePreview = {false}
                                    />
                                </div>
                            </Collapsible>;
                        questionsPreview.push(collapsibleQuestionView);
                });
                response.push(
                    <Collapsible 
                        trigger={<div className = 'bg-slate-200 text-2xl py-3'>{subjectName + " Overview"}</div>}
                        open = {true}
                    >
                        {questionsPreview}
                    </Collapsible>
                );
                response.push(<div className='py-3'></div>);
                index += 1;
            }
            return response;
        // }
    }

    getMinimisedPreview = () => {
        // if(this.props.newPaperDetails.containsMoreThanOneSubject === 'false') {
            // return <div>I contain more than one subject's question preview</div>
        // } 
        // else {
            let response = [];
            if(this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions===undefined) {
                return response;
            }
            let index = 0;
            for (var subjectName in this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions) {
                let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[index][0];
                let questionsBodyRows = [];
                this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName]
                    .forEach((questionId, index) => {
                        let questionRow = <TableRow>
                            <TableCell className='border border-slate-300 flex justify-center ...'>
                                <div className='text-xs sm:text-base md:text-lg xl:text-xl flex justify-center ...' >
                                    {index+1}
                                </div>
                            </TableCell>
                            <TableCell className='border border-slate-300 flex justify-center ...'>
                                <div className='flex justify-center ...' >
                                    <BsEyeFill className='px-1 py-1 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10' color = {'blue'}/>
                                </div>
                            </TableCell>
                            <TableCell className = 'border border-slate-200  flex justify-center '>
                                {this.getQuestionMinimisedPreviewJSX(questionId)}
                            </TableCell>
                            <TableCell>
                                {this.getMarksCell(subjectName)}
                            </TableCell>
                        </TableRow>;
                        questionsBodyRows.push(questionRow);
                });
                let questionsTable = <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        {this.getQuestionsTableHeaderJSX(subjectName)}
                    </TableHead>
                    <TableBody>
                        {questionsBodyRows}
                    </TableBody>
                </Table>;
                response.push(<div className = 'bg-slate-200 text-base sm:text-lg md:text-md xl:text-xl py-3'>{(subjectName =='Test Subject'?'Paper':subjectName) + " Overview"}</div>);
                response.push(questionsTable);
                response.push(<div className='py-3'></div>);
                index += 1;
            }
            return response;
        // }
    }

    getPreviewDetails = () => {
        let previewStyle = this.props.newPaperDetails.previewStyle;
        if(previewStyle === 'MINIMISED_VIEW') {
            return this.getMinimisedPreview();
        }
        else if (previewStyle === 'EXPAND_ALL_QUESTIONS') {
            return this.getExpandedPreview();
        } else if (previewStyle === 'EXAM_VIEW') {

        }
        return;
    }

    updatePreviewStyle = (event) => {
        let payload = {...this.props.newPaperDetails};
        payload.previewStyle = event.target.value;
        this.props.updateNewPaperDetails(payload);
    }

    getPreviewHeader = () => {
        return <div className='py-3 flex justify-center items-center'>
            <div className='flex flex-row ...'>
                <div className='text-base sm:text-lg md:text-md xl:text-xl py-2 px-3 w-full bg-gray-100'>
                    View Style : 
                </div>
                <select className="w-fit border bg-white rounded px-3" 
                    value = {this.props.newPaperDetails.previewStyle}
                    onChange = {(event) => {this.updatePreviewStyle(event)}}
                >
                    <option className=" px-3 text-xs sm:text-base md:text-lg xl:text-xl flex justify-center" value="MINIMISED_VIEW">Minimised View</option>
                    <option className="py-2 text-xs sm:text-base md:text-lg xl:text-xl px-3 flex justify-center" value="EXPAND_ALL_QUESTIONS">Detailed Question View</option>
                    <option className="py-2 text-xs sm:text-base md:text-lg xl:text-xl px-3 flex justify-center" value="EXAM_VIEW" disabled>Exam View</option>
                </select>
            </div>
        </div>
    } 

    render() {
        return <div className='overflow-y-auto max-h-[49rem] ...'>
            {this.getPreviewHeader()}
            {this.getPreviewDetails()}
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewPaperPreview);
