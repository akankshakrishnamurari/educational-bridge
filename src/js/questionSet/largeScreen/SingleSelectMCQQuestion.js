import React from 'react';
import '../../../App.css';
import {JSXUtils} from "../../../utils/JSXUtils";
import {generalTextSize} from '../../../constants/TextSizeConstants';
import Collapsible from "react-collapsible";
import {AiOutlineDownSquare} from "react-icons/ai";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { styled } from '@mui/system';
import { Chart } from "react-google-charts";
import SmallScreenSingleSelectMCQQuestion from '../smallScreen/SmallScreenSingleSelectMCQQuestion';
import { typography } from '../../../constants/designTokens';

class SingleSelectMCQQuestion extends React.Component {

    selectOption = (optionNumber) => {
        this.props.updateQuestionAnswer(this.props.questionDetails.id, this.props.questionDetails.options[optionNumber-1].id);
    }

    renderOption = (optionName, text, bgColor, isOptionSelected) => {
        return <button className="w-full text-left px-3 py-3 transition-colors text-gray-800">
            <div className="flex flex-row items-center w-full">
                <input type="radio" checked={isOptionSelected} readOnly className="accent-primary-600 w-4 h-4"/>
                <div className={typography.label + " px-3"}>{optionName}</div>
                <div className={typography.body}>
                    <span dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(text)}}></span>
                </div>
            </div>
        </button>
    }

    showAccuracy = (i) => {
        if(this.props.needCompletePreview === undefined || this.props.needCompletePreview == false) {
            return <div></div>
        }
        let totalResponseCount = this.props.totalResponseCount;
        let optionResponsePercentage =
                (this.props.optionIdToOptionResponseCount[this.props.options[i].optionId]*100)/(totalResponseCount);
        return <div className='pl-3 py-1'>{isNaN(optionResponsePercentage)?"0%":optionResponsePercentage.toFixed(2) + "%"}</div>
    }

    getOptionsView = () => {
        const StyledTableCell = styled(TableCell)({
            padding: 0,
          });
        const StyledTableRow = styled(TableRow)({
            padding: 0,
          });
        let optionsJSX = [];
        let isQuestionPreviewPage = this.props.submittedQuestionDetails != null ;
        this.props.questionDetails.options.forEach((option, index) => {
            let isOptionSelected = this.props.selectedOptionId == option.id;
            let isQuestionCorrect = (isQuestionPreviewPage && this.props.selectedOptionId == this.props.questionDetails.correctOptionId);
            let rowBgClass = 'hover:bg-primary-50/50';
            if (isQuestionPreviewPage && isOptionSelected) {
                rowBgClass = isQuestionCorrect ? 'bg-success-50' : 'bg-danger-50';
            } else if (!isQuestionPreviewPage && isOptionSelected) {
                rowBgClass = 'bg-primary-50';
            }
            // question is selected.
            optionsJSX.push(
                <StyledTableRow key={option.id}>
                    <div className={"flex w-full justify-start rounded-lg border border-gray-100 mb-1 transition-colors " + rowBgClass} onClick= {() => this.selectOption(index+1)}>
                        {this.renderOption(index+1, option.text, null, isOptionSelected)}
                    </div>
                    <StyledTableCell>
                        <div className='flex justify-start items-center'>
                            {this.showAccuracy(index)}
                            {isQuestionPreviewPage&&option.id==this.props.questionDetails.correctOptionId?<div className={typography.caption + ' pl-2 text-success-700 font-semibold'}>Correct</div>:""}
                            {isQuestionPreviewPage && isOptionSelected && option.id!=this.props.questionDetails.correctOptionId?<div className={typography.caption + ' pl-2 text-danger-600 font-semibold'}>Incorrect</div>:""}
                        </div>
                    </StyledTableCell>
                </StyledTableRow>
            );
        });

     const data = [
        ["Option", "Accuracy", { role: "style" }],
        ["Option 1", 22.94, "red"], // RGB value
        ["Option 2", 39.49, "green"], // English color name
        ["Option 3", 31.3, "red"],
        ["Option 4", 1.45, "red"], // CSS-style declaration
        ["Option 5", 3.45, "red"], // CSS-style declaration
    ];
  
    const options = {
        bars: "horizontal",
      };

        return <div className='flex flex-row'>
            <Table><TableBody>{optionsJSX}</TableBody></Table>
            {isQuestionPreviewPage?
                <div className='w-5/12'>
                    <Chart className=''
                        chartType="ColumnChart"
                        width="w-full"
                        height="h-full"
                        data={data}
                        options={options}
                    />
                    <div className={generalTextSize + " py-1"}>
                        Percentage of students vs option selection
                    </div>
                </div>
               :<div/> 
            }
        </div>
    }

    showSelectedTags = () =>{
        let response=[];
        let tags=[]
        tags= [...this.props.questionDetails.tags];
        for(let i=0;i<tags.length;i++){
            response.push(
                <div className="flex flex-row" key={tags[i].id || i}>
                    <div className="py-1">{JSXUtils.getTagViewJSX(tags[i].tagName)}</div>
                </div>
            )
        }
        let solutionSectiontiggerContent = <div className='flex flex-row items-center w-full bg-gray-50 px-4 py-3 rounded-t-lg'>
            <div className={typography.h3 + " w-full"}>
                Tags on Question
            </div>
            <div className='flex justify-end text-gray-400'>
                <AiOutlineDownSquare size={20}/>
            </div>
        </div>
        return response.length == 0 ? <div/> : <div>
            <Collapsible 
                trigger={solutionSectiontiggerContent}
                className = "border border-gray-100 rounded-lg mt-3 Collapsible__trigger">
                <div className='bg-white px-4 py-3'>
                    {response}
                </div>
            </Collapsible>
        </div>
    }

    getAnswerpreview = () =>{
        if(this.props.questionDetails.answerDescription == undefined){
            return <div>
                answer ::
            </div>
        }
        else{
            return <div>
                <div className="bg-success-600">
                    answer:: 
                </div>
                <div>
                    {this.props.questionDetails.answerDescription}
                </div>
                
            </div>
        }
    }

    getAnswerDescriptionJSX = () => {
        if(this.props.questionDetails.answerDescription == null || this.props.questionDetails.answerDescription< 2) {
            return <div className='px-4 md:px-8 py-4 border-t border-gray-100'>
                <p className={typography.caption}>
                    Answer description is not yet updated by the problem author.
                </p>
            </div>;
        }
        return <div className='px-4 md:px-8 py-4 border-t border-gray-100'>
            <div className={typography.body} dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.answerDescription)}}></div>
        </div>
    }

    getAdditionalPreview = () => {
        let solutionSectiontiggerContent = <div className='flex flex-row items-center w-full bg-gray-50 px-4 py-3 rounded-t-lg'>
            <div className={typography.h3 + " w-full"}>
                Solution Section
            </div>
            <div className='flex justify-end text-gray-400'>
                <AiOutlineDownSquare size={20}/>
            </div>
        </div>
        return <div>
                    <Collapsible 
                        trigger={solutionSectiontiggerContent}
                        className = "border border-gray-100 rounded-lg mt-3 Collapsible__trigger">
                        <div className='px-4 md:px-8 py-3 bg-success-50 flex justify-center'>
                            <span className={typography.body + ' font-medium'}>
                                Correct option is: option {this.props.questionDetails.correctOptions[0] + 1}
                            </span>
                        </div>
                        {this.getAnswerDescriptionJSX()}
                    </Collapsible>
                </div>
    }

    render() {
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
            return <SmallScreenSingleSelectMCQQuestion
                questionDetails = {this.props.questionDetails}
                selectedOptionId = {this.props.selectedOptionId}
                updateQuestionAnswer = {this.props.updateQuestionAnswer}
                selectedOptionBackgroundColor ={this.props.selectedOptionBackgroundColor}
                needCompletePreview = {this.props.needCompletePreview}
                optionIdToOptionResponseCount = {this.props.optionIdToOptionResponseCount}
                totalResponseCount = {this.props.totalResponseCount}
                submittedQuestionDetails = {this.props.submittedQuestionDetails}
                options = {this.props.options}
            />
        }
        if(this.props.questionDetails.isEditingQuestion==undefined){}
        else{
            return(
                <div>
                    <div className={typography.h2 + " px-4 md:px-6 py-4"}>
                        <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.questionDetails.questionDescription)}}></div>
                    </div>
                    {this.getOptionsView()}
                    {this.getAdditionalPreview()}
                    {this.showSelectedTags()}
                    
                </div>
            )
        }
        return (
            <div>
                <div className={typography.h2 + " pb-4"}>
                    <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.questionDetails.description)}}></div>
                </div>
                <div className='w-full'>
                    {this.getOptionsView()}
                </div>
            </div>
        );
    }

}

export default SingleSelectMCQQuestion;
