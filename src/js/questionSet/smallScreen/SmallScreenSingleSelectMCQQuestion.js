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
import { tagPrefixPairMap } from '../../../constants/tagPrefixPairMap';
import { typography } from '../../../constants/designTokens';

class SmallScreenSingleSelectMCQQuestion extends React.Component {

    selectOption = (optionNumber) => {
        this.props.updateQuestionAnswer(this.props.questionDetails.id, this.props.questionDetails.options[optionNumber-1].id);
    }

    renderOption = (optionName, text, bgColor, isOptionSelected) => {
        return <button className="w-full text-left px-3 py-3 transition-colors text-gray-800"
            onClick= {() => this.selectOption(optionName)}
        >
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
        let optionsJSX = [];
        let isQuestionPreviewPage = this.props.submittedQuestionDetails != null ;
        this.props.questionDetails.options.forEach((option, index) => {
            let isOptionSelected = this.props.selectedOptionId == option.id;
            let isQuestionCorrect = (isQuestionPreviewPage && this.props.selectedOptionId == this.props.questionDetails.correctOptionId);
            let rowBgClass = '';
            if (isQuestionPreviewPage && isOptionSelected) {
                rowBgClass = isQuestionCorrect ? 'bg-success-50' : 'bg-danger-50';
            } else if (!isQuestionPreviewPage && isOptionSelected) {
                rowBgClass = 'bg-primary-50';
            }
            // question is selected.
            optionsJSX.push(
                <TableRow key={option.id} className='border-b border-gray-100'>
                    <StyledTableCell className={rowBgClass}>
                        {this.renderOption(index+1, option.text, null, isOptionSelected)}
                    </StyledTableCell>
                    <StyledTableCell>
                        <div className='flex flex-col justify-start'>
                            {this.showAccuracy(index)}
                            {isQuestionPreviewPage&&option.id==this.props.questionDetails.correctOptionId?<div className={typography.caption + ' pl-2 text-success-700 font-semibold'}>Correct</div>:""}
                            {isQuestionPreviewPage && isOptionSelected && option.id!=this.props.questionDetails.correctOptionId?<div className={typography.caption + ' pl-2 text-danger-600 font-semibold'}>Incorrect</div>:""}
                        </div>
                    </StyledTableCell>
                </TableRow>
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

        return <div>
            <Table><TableBody>{optionsJSX}</TableBody></Table>
            {/* {isQuestionPreviewPage?
                <div className='w-full'>
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
            } */}
        </div>
    }

    showSelectedTags = () => {
        let response = [];
        for (let i = 0; i < 5; i++) {
            response.push([]);
        }
        for(let index=0;index<5;index++){
           response[index].push(
                <div>
                    {tagPrefixPairMap[index].prefix}
                </div>
            )
        }
        if(this.props.questionDetails.tags.length === 0) {
            return;
        }
        this.props.questionDetails.tags.forEach(element => {
            for(let index=0;index<5;index++){
                if(element.tagName.startsWith(tagPrefixPairMap[index]["prefix"])){
                    let prefixLength=tagPrefixPairMap[index]["prefix"].length;
                    response[index].push(
                        <div className="flex flex-row ...">
                            <div className="py-2 ">{JSXUtils.getTagViewJSX(element.tagName.substr(prefixLength))}</div>
                        </div>
                    );
                    break;
                }
            }
        });
        for(let index=0;index<5;index++){
            if(response[index].length==1){
                response[index]=[];
            }
            else{
                response[index]=(
                    <div class="flex flex-row whitespace-nowrap">
                        <div >
                           {response[index][0]}     
                        </div>
                        <div className="flex flex-row px-4">
                            {response[index].slice(1).map((element, j) => (
                            <div key={j} >
                                <div>
                                     {element}
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                )
            }
        }
        return response;
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

    getAdditionalPreview = () => {
        let solutionSectiontiggerContent = <div className='flex flex-row items-center w-full bg-gray-50 px-3 py-3 rounded-t-lg'>
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
                        <div className='px-3 md:px-6 py-3 bg-success-50 flex justify-center'>
                            <span className={typography.body + ' font-medium'}>
                                Correct option is: option {this.props.questionDetails.correctOption + 1}
                            </span>
                        </div>
                        <div className='px-3 md:px-6 py-4 border-t border-gray-100'>
                            <div className={typography.body} dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.questionDetails.answerDescription)}}></div>
                        </div>
                    </Collapsible>
                </div>
    }

    render() {
        if(this.props.questionDetails.isEditingQuestion==undefined){}
        else{
            return(
                <div>
                    <div className={typography.h2 + " px-3 py-4"}>
                        <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.questionDetails.questionDescription)}}></div>
                    </div>
                    {this.getOptionsView()}
                    {this.getAdditionalPreview()}
                    <div className='flex flex-col px-3 py-2'>
                        <div className={typography.caption}>
                            Applied tags: 
                        </div>
                        <div>
                            {this.showSelectedTags()}
                        </div>
                    </div>
                    
                </div>
            )
        }
        return (
            <div>
                <div className={typography.h2 + " px-3 py-4"}>
                    <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.questionDetails.description)}}></div>
                </div>
                <div className='w-full'>
                    {this.getOptionsView()}
                </div>
            </div>
        );
    }

}

export default SmallScreenSingleSelectMCQQuestion;
