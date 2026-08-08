import React from 'react';
import { connect } from 'react-redux'
import {updateNewPaperDetails, saveQuestionSet} from "../../../store/actions/solgressAction";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import Split from "react-split";
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import {MathUtils} from "../../../utils/MathUtils";
import {PaperSubmissionUtil} from "../../../utils/PaperSubmissionUtil";
import QuestionSelectionConfigurationBox from './QuestionSelectionConfigurationBox';
import PaperCreationHelpSectionComponent from './PaperCreationHelpSectionComponent';
import NewPaperPreview from './NewPaperPreview';
import NewPaperTagComponent from "./NewPaperTagComponent";
import { currentURLHost } from '../../../constants/hostConfig';
import {generalTextSize} from './../../../constants/TextSizeConstants';
import EducationalBridgeHeader from '../../header/EducationalBridgeHeader';
import {FcNext} from 'react-icons/fc';
import {BsArrowRight, BsArrowLeft} from 'react-icons/bs';
import Button from '../../../components/common/Button';

const mapDispatchToProps = dispatch => ({
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload)),
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload)),
})


const mapStateToProps = state => {
    return {
        newPaperDetails: state.solgressReducer.newPaperDetails,
        questionSet: state.solgressReducer.questionSet
    };
}


class NewPaperPortal extends React.Component {

    constructor(props) {
        super(props);
        this.initializeNewPaperDetails = this.initializeNewPaperDetails.bind(this);
        this.getConfigurationSectionJSX = this.getConfigurationSectionJSX.bind(this);
    }

    initializeNewPaperDetails = () => {
        let payload = {
            "currentTab" : 'TEST_SETTING',
            "numberOfQuestions":1,
            "paperName" : "Sample Test Paper",
            "allottedPaperTime":180,
            "containsMoreThanOneSubject":"false",
            "containsMoreThanOneSectionPerSubject":"false",
            "numberOfSubjects" : 1,
            "selectedQuestionIds" : [],
            "subjectNames" : ["Test Subject"],
            "subjectWiseNumberOfSections" : [1],
            "subjectWiseSectionNames": [["Section 1"]],
            "subjectWiseSectionPositiveMarks": [[3]],
            "subjectWiseSectionNegativeMarks": [[-1]],
            "subjectWiseSectionWiseNumberOfQuestions": [[0]],
            "currentSubjectIndex": 0,
            "currentSectionIndex": 0,
            "previewStyle": 'MINIMISED_VIEW',
            "currentPage": 1,
            "tags": []
        };
        this.props.updateNewPaperDetails(payload);
    }

    updateCurrentTab = (tabName) => {
        let payload = {...this.props.newPaperDetails};
        payload.currentTab = tabName;
        this.props.updateNewPaperDetails(payload);

        if(tabName === 'REVIEW_AND_PUBLISH' || tabName === 'QUESTION_SELECTION_SELECTED_QUESTION') {
            QuestionsReceiver.getQuestionsByQuestionIds(this.props.newPaperDetails.selectedQuestionIds).then(questionsData=>{
                let payload = {...this.props.questionSet};
                payload.questions = questionsData.data;
                this.props.saveQuestionSet(payload);
            });
        } else {
            QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey, [], [], this.props.currentPage).then(questionsData=>{
                let payload = {...this.props.questionSet};
                payload.questions = this.normalise(questionsData.data);
                this.props.saveQuestionSet(payload);
            });
        }
    }

    normalise = (questionSet) => {
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
        questionSet = questionSet.filter(function(question){
            return !blockedQuestionIds.includes(question.id);
        });
        return questionSet;
    }

    getHeaderJSX = () => {
        let stateName = "";
        if(this.props.newPaperDetails.currentTab=='TEST_SETTING'){
            stateName = " Paper Settings "
        }
        else if (this.props.newPaperDetails.currentTab=='QUESTION_SELECTION' || this.props.newPaperDetails.currentTab=='QUESTION_SELECTION_SELECTED_QUESTION') {
            stateName = " Questions Selection "
        }
        else if ( this.props.newPaperDetails.currentTab=='QUESTION_SELECTION_SELECTED_QUESTION') {
            stateName = " Questions Selection (Selected Questions)"
        }
        else {
            stateName = " Preview/Publish "
        }
        let settingColor = (this.props.newPaperDetails.currentTab=='TEST_SETTING')?"bg-success-100":"bg-warning-50";
        let questionSelectionColor = (this.props.newPaperDetails.currentTab=='QUESTION_SELECTION' || this.props.newPaperDetails.currentTab=='QUESTION_SELECTION_SELECTED_QUESTION')?"bg-success-100":"bg-warning-50";
        let reviewAndPublishTabColor = (this.props.newPaperDetails.currentTab=='REVIEW_AND_PUBLISH')?"bg-success-100":"bg-warning-50";
        let percentageCompleted = 0;
        if(this.props.newPaperDetails.currentTab=='TEST_SETTING'){
            percentageCompleted = 16;
            settingColor = "bg-success-100";
            questionSelectionColor = "bg-warning-50";
            reviewAndPublishTabColor = "bg-warning-50"
        }
        else if (this.props.newPaperDetails.currentTab=='QUESTION_SELECTION' || this.props.newPaperDetails.currentTab=='QUESTION_SELECTION_SELECTED_QUESTION') {
            percentageCompleted = 50;
            settingColor = "bg-success-50";
            questionSelectionColor = "bg-success-100";
            reviewAndPublishTabColor = "bg-warning-50"
        }
        else {
            percentageCompleted = 83;
            settingColor = "bg-success-50";
            questionSelectionColor = "bg-success-50";
            reviewAndPublishTabColor = "bg-success-100"
        }
        return  <div>
            <div className="flex items-center justify-between w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                    className="flex flex-col lg:flex-row w-full items-start lg:items-center">
                    <div className={"w-full lg:w-1/3 py-3 px-4 cursor-pointer " + settingColor } onClick={()=>this.updateCurrentTab('TEST_SETTING')}>
                        <div className={generalTextSize}>
                            {(this.props.newPaperDetails.currentTab=='TEST_SETTING')?<b>Paper Settings</b>:'Test Settings'}
                        </div>
                    </div>
                    <div className='flex flex-row items-center px-1 text-gray-400'  onClick={()=>this.updateCurrentTab('QUESTION_SELECTION')}>
                        <FcNext/>
                    </div>
                    <div className={"w-full lg:w-1/3 py-3 px-4 cursor-pointer " + questionSelectionColor } onClick={()=>this.updateCurrentTab('QUESTION_SELECTION')}>
                        <p className={generalTextSize}>
                            {
                                (this.props.newPaperDetails.currentTab=='QUESTION_SELECTION' 
                                    || this.props.newPaperDetails.currentTab== 'QUESTION_SELECTION_SELECTED_QUESTION')
                                    ?(this.props.newPaperDetails.currentTab== 'QUESTION_SELECTION_SELECTED_QUESTION'?<b>Selected Questions</b>:<b>Questions Selection</b>)
                                    :'Questions Selection'}
                        </p>
                    </div>
                    <div className='flex flex-row items-center px-1 text-gray-400'  onClick={()=>this.updateCurrentTab('REVIEW_AND_PUBLISH')}>
                        <FcNext/>
                    </div>
                    <div
                        className={"w-full lg:w-1/3 py-3 px-4 cursor-pointer " + reviewAndPublishTabColor} onClick={()=>this.updateCurrentTab('REVIEW_AND_PUBLISH')}>
                        <p className={generalTextSize}>
                            {(this.props.newPaperDetails.currentTab=='REVIEW_AND_PUBLISH')?<b>Preview and publish</b>:'Preview and publish'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    }

    getNumberofSubjectsInputJSX = () => {
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'false') {
            return;
        }
        return <div className="flex flex-row ... px-5 py-5">
            <div>
                <div className= { generalTextSize + " leading-tight text-gray-800  py-2" }>
                    Number of Subjects :
                </div>
            </div>
            <input autoComplete="off"
                      className={generalTextSize + " resize mx-2 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700    bg-white font-normal w-64 h-10 flex items-center pl-3 border-gray-300 rounded border shadow"}
                      value = {this.props.newPaperDetails.numberOfSubjects}
                      placeholder="Placeholder"
                      onChange={(event)=>this.updateNumberOfSubjects(event)}
            />
        </div>;
    }

    getSubjectNamesJSX = () => {
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'false') {
            return;
        }
        let response = [];
        response.push(
            <div>
                <div className={ generalTextSize + " leading-tight text-gray-800  py-2"}>
                    Name of Subjects :
                </div>
            </div>
        );
        for(let index = 0; index <this.props.newPaperDetails.numberOfSubjects; index++ ) {
            response.push(
                <input id="email" autoComplete="off"
                       className={generalTextSize + " resize mx-2 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700    bg-white font-normal w-3/12 flex items-center pl-3 border-gray-300 rounded border shadow"}
                       placeholder="Subject Name e.g Maths"
                       value={this.props.newPaperDetails.subjectNames[index]}
                       onChange={(event)=>this.updateNameOfSubject(event, index)}
                />
            );
        }
        return <div className="flex flex-row flex-col... px-5 py-5">{response}</div>;
    }

    getSubjectWiseSectionWiseNumberOfQuestionsInput = (subjectIndex) => {
        let response = [];
        for(let index =0; index < this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; index++) {
            response.push(
                <input id="email" autoComplete="off"
                       className={generalTextSize + " text-gray-600 resize  focus:outline-none  focus:ring-primary-700    bg-white font-normal w-64 h-10 w-28 flex items-center pl-3 border-gray-300 rounded border shadow"}
                       placeholder="Number of Questions"
                       value = {this.props.newPaperDetails.subjectWiseSectionWiseNumberOfQuestions[subjectIndex][index]}
                       onChange={(event)=>this.updateSectionWiseNumberOfQuestions(event, subjectIndex, index)}
                />
            );
        }
        return response;
    }

    getTotalNumberOfQuestionsInSubject = (subjectIndex) => {
        let totalNumberOfQuestions = 0;
        for(let sectionIndex=0; sectionIndex<this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; sectionIndex++) {
            totalNumberOfQuestions += this.props.newPaperDetails.subjectWiseSectionWiseNumberOfQuestions[subjectIndex][sectionIndex];
        }
        return totalNumberOfQuestions;
    }

    getSubjectWiseNumberOfSectionsTableHeaderRow = () => {
        let totalNumberOfQuestions = 0;
        for(let subjectIndex=0; subjectIndex < this.props.newPaperDetails.numberOfSubjects; subjectIndex++) {
            for(let sectionIndex=0; sectionIndex < this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; sectionIndex++) {
                totalNumberOfQuestions += this.props.newPaperDetails.subjectWiseSectionWiseNumberOfQuestions[subjectIndex][sectionIndex];
            }
        }
        let tableCells = [];
        // Subject row
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'true') {
            tableCells.push(<TableCell>
                <div className={generalTextSize}><b>Subject</b></div>
            </TableCell>);
        }
        if(this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            tableCells.push(<TableCell><div className={generalTextSize}><b>Number of Sections</b></div></TableCell>);
        }
        if(this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            tableCells.push(<TableCell><div className={generalTextSize}><b>Name of Sections</b></div></TableCell>);
        }
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'true'
            || this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            tableCells.push(<TableCell>
                <div className={generalTextSize}><b>No. of Questions( {totalNumberOfQuestions} )</b></div>
            </TableCell>);
        }
        if(!(this.props.newPaperDetails.containsMoreThanOneSubject == 'true'
            && this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'false'))
        {
            tableCells.push(<TableCell>
                <div className={generalTextSize}><b>Total Questions ( {totalNumberOfQuestions} )</b></div>
            </TableCell>);
        }
        return <TableRow>
            {tableCells}
        </TableRow>;
    }

    getSubjectwiseSectionConfigurationJSX = (subjectIndex) => {
        let response = [];
        // Subject row
        if (this.props.newPaperDetails.containsMoreThanOneSubject === 'true') {
            response.push(<TableCell scope="row">
                <div className={generalTextSize + " leading-tight text-gray-800  py-2"}>
                    {this.props.newPaperDetails.subjectNames[subjectIndex]}
                </div>
            </TableCell>);
        }
        // number of sections
        if(this.props.newPaperDetails.containsMoreThanOneSectionPerSubject === 'true') {
            response.push(<TableCell><textarea id="email" autoComplete="off"
                                                className={generalTextSize + " resize mx-2 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700  bg-white font-normal w-64 h-10 w-20 flex items-center pl-3  border-gray-300 rounded border shadow"}
                                                value={this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]}
                                                placeholder={"Number of sections in " + this.props.newPaperDetails.subjectNames[subjectIndex]}
                                                onChange={(event) => this.updateNumberOfSubjectSections(event, subjectIndex)}
                    /></TableCell>);

        }
        // name of sections
        if(this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            let nameOfSectionsResponse = [];
            for(let index =0; index < this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; index++) {
                nameOfSectionsResponse.push(
                    <textarea id="email" autoComplete="off"
                              className={generalTextSize + " resize mx-2 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700 bg-white font-normal w-64 h-10 flex items-center pl-3 border-gray-300 rounded border shadow"}
                              placeholder={"Name of section " + (index+1) + " in " + this.props.newPaperDetails.subjectNames[subjectIndex]}
                              value = {this.props.newPaperDetails.subjectWiseSectionNames[subjectIndex][index]}
                              onChange={(event)=>this.updateSectionName(event, subjectIndex, index)}
                    />
                );
            };
            response.push(<TableCell>{nameOfSectionsResponse}</TableCell>);
        }
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'true'
            || this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            response.push(<TableCell>{this.getSubjectWiseSectionWiseNumberOfQuestionsInput(subjectIndex)}</TableCell>);
        }
        if(!(this.props.newPaperDetails.containsMoreThanOneSubject == 'true'
            && this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'false')) {
            response.push(<TableCell>
                <div className={generalTextSize + " leading-tight text-gray-800  py-2"}>
                    {MathUtils.parserNumber(this.getTotalNumberOfQuestionsInSubject(subjectIndex))}
                </div>
            </TableCell>);
        }
        return response;
    }

    getSubjectWiseNumberOfSectionsTableHeaderRowForMarkingSystem = () => {
        let tableCells = [];
        // Subject row
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'true') {
            tableCells.push(<TableCell>
                <div className={generalTextSize}><b>Subject</b></div>
            </TableCell>);
        }
        // number of sections
        if(this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            tableCells.push(<TableCell><div className={generalTextSize}><b>Name of Sections</b></div></TableCell>);
        }
        // marking type
        tableCells.push(<TableCell><div className={generalTextSize}><b>Marking Type</b></div></TableCell>);
        // Marking style
        tableCells.push(<TableCell><div className={generalTextSize}><b>Marking Style(+X, -Y)</b></div></TableCell>);
        return <TableRow>
            {tableCells}
        </TableRow>;
    }

    getSubjectwiseSectionConfigurationForMarkingSystemJSX = (subjectIndex) => {
        let response = [];
        // Subject row
        if (this.props.newPaperDetails.containsMoreThanOneSubject == 'true') {
            response.push(<TableCell scope="row">
                <div className={generalTextSize + " leading-tight text-gray-800  py-2"}>
                    {this.props.newPaperDetails.subjectNames[subjectIndex]}
                </div>
            </TableCell>);
        }
        // number of sections
        if(this.props.newPaperDetails.containsMoreThanOneSectionPerSubject == 'true') {
            let nameOfSectionsResponse = [];
            for(let index =0; index < this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; index++) {
                nameOfSectionsResponse.push(
                    <div className={generalTextSize + " leading-tight text-gray-800  py-2"}>
                        {this.props.newPaperDetails.subjectWiseSectionNames[subjectIndex][index]}
                    </div>
                );
            };
            response.push(<TableCell>{nameOfSectionsResponse}</TableCell>);
        }
        // ... marking type
        let markingTypeResponse = [];
        for(let index =0; index < this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; index++) {
            markingTypeResponse.push(
                <div>
                    <select className={generalTextSize + " w-fit px-2 border bg-white rounded py-3 outline-none " }>
                        <option className={"py-1 " + generalTextSize } value="PARTIAL_MARKING_NOT_ALLOWED">Partial Marking : Not Allowed</option>
                    </select>
                </div>
            );
        };
        response.push(<TableCell>{markingTypeResponse}</TableCell>);
        // marking style
        let markingStyleResponse = [];
        for(let sectionIndex =0; sectionIndex < this.props.newPaperDetails.subjectWiseNumberOfSections[subjectIndex]; sectionIndex++) {
            markingStyleResponse.push(
                <div className= "flex flex-row">
                    <input type="number"
                           className={generalTextSize + " bg-success-200 px-1 py-2 border-2 text-center w-16 font-bold  items-center "}
                           name="custom-input-number"
                           min = "1"
                           value={this.props.newPaperDetails.subjectWiseSectionPositiveMarks[subjectIndex][sectionIndex]}
                           onChange={(event)=>this.updateSectionPositiveMarkingScheme(event, subjectIndex, sectionIndex)}
                    />
                    <input type="number"
                           className={generalTextSize + " bg-danger-200 px-1 py-2 border-2 text-center w-16 font-bold  items-center "}
                           name="custom-input-number"
                           max = "0"
                           value={this.props.newPaperDetails.subjectWiseSectionNegativeMarks[subjectIndex][sectionIndex]}
                           onChange={(event)=>this.updateSectionNegativeMarkingScheme(event, subjectIndex, sectionIndex)}
                    />
                </div>
            );
        };
        response.push(<TableCell>{markingStyleResponse}</TableCell>);
        return response;
    }

    getSubjectwiseNumberOfSectionsJSX = () => {
        let tableRows = [];
        for(let index = 0; index < this.props.newPaperDetails.numberOfSubjects; index++) {
            if(this.props.newPaperDetails.subjectNames[index]=='') {
                continue;
            }
            tableRows.push(
                <TableRow
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                    {this.getSubjectwiseSectionConfigurationJSX(index)}
                </TableRow>
            );
        }
        if(tableRows.length === 0 ) {
            return <div/>
        }
        return  <Table aria-label="simple table" className="bg-slate-50">
            <TableBody>
                {this.getSubjectWiseNumberOfSectionsTableHeaderRow()}
                {tableRows}
            </TableBody>
        </Table>;
    }

    getMarkingSystemConfigurationJSX = () => {
        let tableRows = [];
        for(let index = 0; index < this.props.newPaperDetails.numberOfSubjects; index++) {
            if(this.props.newPaperDetails.subjectNames[index]=='') {
                continue;
            }
            tableRows.push(
                <TableRow
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                    {this.getSubjectwiseSectionConfigurationForMarkingSystemJSX(index)}
                </TableRow>
            );
        }
        if(tableRows.length == 0 ) {
            return <div/>
        }
        return  <Table aria-label="simple table" className="bg-slate-50">
            <TableBody>
                {this.getSubjectWiseNumberOfSectionsTableHeaderRowForMarkingSystem()}
                {tableRows}
            </TableBody>
        </Table>;
    }

    updateNumberOfSubjects = (event) => {
        if(isNaN(event.target.value) || MathUtils.parserNumber(event.target.value)< 0) {
            return;
        }
        let payload = {...this.props.newPaperDetails};
        payload.numberOfSubjects = MathUtils.parserNumber(event.target.value);
        let subjectNames = [...payload.subjectNames];
        if(payload.numberOfSubjects < payload.subjectNames.length) {
            payload.subjectNames = subjectNames;
            this.props.updateNewPaperDetails(payload);
            return;
        }
        let subjectWiseNumberOfSections = [...payload.subjectWiseNumberOfSections];
        let subjectWiseSectionNames = [...payload.subjectWiseSectionNames];
        let subjectWiseSectionPositiveMarks = [...payload.subjectWiseSectionPositiveMarks];
        let subjectWiseSectionNegativeMarks = [...payload.subjectWiseSectionNegativeMarks];
        let subjectWiseSectionWiseNumberOfQuestions = [...payload.subjectWiseSectionWiseNumberOfQuestions];
        for(let index=payload.subjectNames.length; index <= payload.numberOfSubjects; index++) {
            subjectNames.push('Test Subject' + index);
            subjectWiseNumberOfSections.push(1);
            subjectWiseSectionNames.push(['Section 1']);
            subjectWiseSectionWiseNumberOfQuestions.push([0]);
            subjectWiseSectionPositiveMarks.push([3]);
            subjectWiseSectionNegativeMarks.push([-1])
        }
        payload.subjectNames = subjectNames;
        payload.subjectWiseNumberOfSections = subjectWiseNumberOfSections;
        payload.subjectWiseSectionNames = subjectWiseSectionNames;
        payload.subjectWiseSectionWiseNumberOfQuestions = subjectWiseSectionWiseNumberOfQuestions;
        payload.subjectWiseSectionPositiveMarks = subjectWiseSectionPositiveMarks;
        payload.subjectWiseSectionNegativeMarks = subjectWiseSectionNegativeMarks;
        this.props.updateNewPaperDetails(payload);
    }

    updateNumberOfQuestions = (expectedNumberOfQuestions) => {
        let payload = {...this.props.newPaperDetails};
        let numberOfQuestions = MathUtils.parserNumber(expectedNumberOfQuestions);
        if(numberOfQuestions>=0) {
            let subjectWiseSectionWiseNumberOfQuestions = [...payload.subjectWiseSectionWiseNumberOfQuestions];
            let targetSubjectSectionWiseNumberOfQuestions = [...subjectWiseSectionWiseNumberOfQuestions[0]];
            targetSubjectSectionWiseNumberOfQuestions[0] = MathUtils.parserNumber(numberOfQuestions);
            subjectWiseSectionWiseNumberOfQuestions[0] = targetSubjectSectionWiseNumberOfQuestions;
            payload.subjectWiseSectionWiseNumberOfQuestions = subjectWiseSectionWiseNumberOfQuestions;
            payload.numberOfQuestions = numberOfQuestions;
            this.props.updateNewPaperDetails(payload);
        }
    }

    updatePaperName = (paperName) => {
        let payload = {...this.props.newPaperDetails};
        payload.paperName = paperName;
        this.props.updateNewPaperDetails(payload);
    }

    updateAllottedPaperTime = (allottedPaperTime) => {
        let payload = {...this.props.newPaperDetails};
        payload.allottedPaperTime = allottedPaperTime;
        this.props.updateNewPaperDetails(payload);
    }

    updateContainsMoreThanOneSubject = (event) => {
        let payload = {...this.props.newPaperDetails};
        payload.containsMoreThanOneSubject = event.target.value;
        if(event.target.value=='false') {
            payload.numberOfSubjects = 1;
        }
        this.props.updateNewPaperDetails(payload);
    }

    updateContainsMoreThanOneSectionPerSubject = (event) => {
        let payload = {...this.props.newPaperDetails};
        payload.containsMoreThanOneSectionPerSubject = event.target.value;
        if(event.target.value=='false') {
            let subjectWiseNumberOfSections = [...payload.subjectWiseNumberOfSections];
            for(let index = 0; index < subjectWiseNumberOfSections.length; index++) {
                subjectWiseNumberOfSections[index] = 1;
            }
            payload.subjectWiseNumberOfSections = subjectWiseNumberOfSections;
        }
        this.props.updateNewPaperDetails(payload);
    }

    updateNameOfSubject = (event, index) => {
        let payload = {...this.props.newPaperDetails};
        let subjectNames = [... payload.subjectNames];
        subjectNames[index] = event.target.value;
        payload.subjectNames = subjectNames;
        this.props.updateNewPaperDetails(payload);
    }

    updateNumberOfSubjectSections = (event, index) => {
        let payload = {...this.props.newPaperDetails};
        let subjectWiseNumberOfSections = [... payload.subjectWiseNumberOfSections];
        let numberOfSections = MathUtils.parserNumber(event.target.value);
        if(numberOfSections<0) {
            return;
        }
        let subjectWiseSectionNames = [...payload.subjectWiseSectionNames];
        let subjectWiseSectionPositiveMarks = [...payload.subjectWiseSectionPositiveMarks];
        let subjectWiseSectionNegativeMarks = [...payload.subjectWiseSectionNegativeMarks];
        let subjectWiseSectionWiseNumberOfQuestions = [...payload.subjectWiseSectionWiseNumberOfQuestions];
        for(let i = subjectWiseSectionNames[index].length; i < numberOfSections; i++) {
            let targetSubjectWiseSectionNames = [...subjectWiseSectionNames[index]]
            targetSubjectWiseSectionNames.push('Section Name')
            subjectWiseSectionNames[index] = targetSubjectWiseSectionNames;
            let targetSubjectWiseSectionWiseNumberOfQuestions = [...subjectWiseSectionWiseNumberOfQuestions[index]];
            targetSubjectWiseSectionWiseNumberOfQuestions.push(0);
            subjectWiseSectionWiseNumberOfQuestions[index] = targetSubjectWiseSectionWiseNumberOfQuestions;
            let targetSubjectWiseSectionPositiveMarks = [...subjectWiseSectionPositiveMarks[index]];
            targetSubjectWiseSectionPositiveMarks.push(3);
            subjectWiseSectionPositiveMarks[index] = targetSubjectWiseSectionPositiveMarks;
            let targetSubjectWiseSectionNegativeMarks = [...subjectWiseSectionNegativeMarks[index]];
            targetSubjectWiseSectionNegativeMarks.push(-1);
            subjectWiseSectionNegativeMarks[index] = targetSubjectWiseSectionNegativeMarks;
        }
        payload.subjectWiseSectionNames = subjectWiseSectionNames;
        payload.subjectWiseSectionWiseNumberOfQuestions = subjectWiseSectionWiseNumberOfQuestions;
        payload.subjectWiseSectionPositiveMarks = subjectWiseSectionPositiveMarks;
        payload.subjectWiseSectionNegativeMarks = subjectWiseSectionNegativeMarks;
        subjectWiseNumberOfSections[index] = numberOfSections;
        payload.subjectWiseNumberOfSections = subjectWiseNumberOfSections;
        this.props.updateNewPaperDetails(payload);
    }

    updateSectionName = (event, subjectIndex, sectionIndex) => {
        let payload = {...this.props.newPaperDetails};
        let subjectWiseSectionNames = [...payload.subjectWiseSectionNames];
        let targetSubjectSectionNames = [...subjectWiseSectionNames[subjectIndex]];
        targetSubjectSectionNames[sectionIndex] = event.target.value;
        subjectWiseSectionNames[subjectIndex] = targetSubjectSectionNames;
        payload.subjectWiseSectionNames = subjectWiseSectionNames;
        this.props.updateNewPaperDetails(payload);
    }

    updateSectionWiseNumberOfQuestions = (event, subjectIndex, sectionIndex) => {
        if(isNaN(event.target.value) || MathUtils.parserNumber(event.target.value)< 0) {
            return;
        }
        let payload = {...this.props.newPaperDetails};
        let subjectWiseSectionWiseNumberOfQuestions = [...payload.subjectWiseSectionWiseNumberOfQuestions];
        let targetSubjectSectionWiseNumberOfQuestions = [...subjectWiseSectionWiseNumberOfQuestions[subjectIndex]];
        targetSubjectSectionWiseNumberOfQuestions[sectionIndex] = MathUtils.parserNumber(event.target.value);
        subjectWiseSectionWiseNumberOfQuestions[subjectIndex] = targetSubjectSectionWiseNumberOfQuestions;
        payload.subjectWiseSectionWiseNumberOfQuestions = subjectWiseSectionWiseNumberOfQuestions;
        let numberOfQuestions = 0;
        for(let subjectIndex=0; subjectIndex < payload.numberOfSubjects; subjectIndex++) {
            for(let sectionIndex=0; sectionIndex < payload.subjectWiseNumberOfSections[subjectIndex]; sectionIndex++) {
                numberOfQuestions += payload.subjectWiseSectionWiseNumberOfQuestions[subjectIndex][sectionIndex];
            }
        }
        payload.numberOfQuestions = numberOfQuestions;
        this.props.updateNewPaperDetails(payload);
    }

    updateSectionPositiveMarkingScheme = (event, subjectIndex, sectionIndex) => {
        let payload = {...this.props.newPaperDetails};
        let subjectWiseSectionPositiveMarks = [...payload.subjectWiseSectionPositiveMarks];
        let targetSubjectSectionPositiveMarks = [...subjectWiseSectionPositiveMarks[subjectIndex]];
        targetSubjectSectionPositiveMarks[sectionIndex] = MathUtils.parserNumber(event.target.value);
        subjectWiseSectionPositiveMarks[subjectIndex] = targetSubjectSectionPositiveMarks;
        payload.subjectWiseSectionPositiveMarks = subjectWiseSectionPositiveMarks;
        this.props.updateNewPaperDetails(payload);
    }

    updateSectionNegativeMarkingScheme = (event, subjectIndex, sectionIndex) => {
        let payload = {...this.props.newPaperDetails};
        let subjectWiseSectionNegativeMarks = [...payload.subjectWiseSectionNegativeMarks];
        let targetSubjectSectionNegativeMarks = [...subjectWiseSectionNegativeMarks[subjectIndex]];
        targetSubjectSectionNegativeMarks[sectionIndex] = MathUtils.parserNumber(event.target.value);
        subjectWiseSectionNegativeMarks[subjectIndex] = targetSubjectSectionNegativeMarks;
        payload.subjectWiseSectionNegativeMarks = subjectWiseSectionNegativeMarks;
        this.props.updateNewPaperDetails(payload);
    }

    getSubjectNameAndNumberOfSectionsInputJSX = () => {
        if(this.props.newPaperDetails.containsMoreThanOneSubject == 'true'){
            return <div>
                {this.getNumberofSubjectsInputJSX()}
                {this.getSubjectNamesJSX()}
            </div>;
        }
        return <div/>;
    }

    geTestDetailsConfiguration = () => {
        return <div className="overflow-y-auto ...">
            <div className={"w-full lg:w-1/3 py-3 bg-gray-100" }>
                <p className={generalTextSize}>
                    <b>Part A : Configure Basic Details</b>
                </p>
            </div>
            <div className="flex flex-row ... px-5 py-1">
                <div>
                    <div className={generalTextSize + " leading-tight text-gray-800  py-1"}>
                        Name of Paper
                    </div>
                </div>
                <input autoComplete="off"
                    className={generalTextSize +" resize mx-2 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700  bg-white font-normal h-10 flex items-center pl-3 border-gray-300 rounded border shadow"}
                    placeholder="Name of paper"
                    value = {this.props.newPaperDetails.paperName}
                    onChange={(event)=>this.updatePaperName(event.target.value)}
                />
            </div>
            <div className="flex flex-row ... px-5 py-1">
                <div>
                    <div className={generalTextSize + " leading-tight text-gray-800 py-1 pr-2"}>
                        Allotted Paper Time (in minutes)
                    </div>
                </div>
                <input autoComplete="off"
                    className={generalTextSize + " text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700    bg-white font-normal py-2 flex items-center pl-3  border-gray-300 rounded border shadow"}
                    placeholder="Maximum allotted time"
                    value = {this.props.newPaperDetails.allottedPaperTime}
                    onChange={(event)=>this.updateAllottedPaperTime(event.target.value)}
                />
            </div>
            <div className="flex flex-row ... px-5 py-1">
                <div>
                    <div className={generalTextSize + " leading-tight text-gray-800  py-2"}>
                        Number of Questions 
                    </div>
                </div>
                { (this.props.newPaperDetails.containsMoreThanOneSubject === 'false')
                    ?<input autoComplete="off"
                        className={generalTextSize + " resize mx-2 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700    bg-white font-normal w-64 h-10 flex items-center pl-3 border-gray-300 rounded border shadow"}
                        placeholder="Number of questions in test"
                        value = {this.props.newPaperDetails.numberOfQuestions}
                        onChange={(event)=>this.updateNumberOfQuestions(event.target.value)}
                    />
                    :<input autoComplete="off"
                        className={generalTextSize + " resize mx-2 bg-gray-200 text-gray-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700    bg-white font-normal w-64 h-10 flex items-center pl-3 border-gray-300 rounded border shadow"}
                        placeholder="Number of questions in test"
                        value = {this.props.newPaperDetails.numberOfQuestions}
                        onChange={(event)=>this.updateNumberOfQuestions(event.target.value)}
                        disabled
                    />
                }
            </div>
            <div className="flex flex-row ... px-5 py-1">
                <div className='pr-2'>
                    <div className={generalTextSize + " leading-tight text-gray-800  py-2"}>
                        More than one subject ?
                    </div>
                </div>
                <select className={generalTextSize + " w-fit border bg-white rounded px-3 py-2 outline-none w-20"}
                    value={this.props.newPaperDetails.containsMoreThanOneSubject}
                    onChange={(event => this.updateContainsMoreThanOneSubject(event))}
                >
                    <option className={"py-1 " + generalTextSize} value="false">No</option>
                    <option className={"py-1 " + generalTextSize} value="true">Yes</option>
                </select>
            </div>
            {/* Disabling for some time to hide complexity */}
            {/* <div className="flex flex-row ... px-5 py-5">
                <div>
                    <div className="text-lg leading-tight text-gray-800  py-2">
                        More than one section per subject ? :
                    </div>
                </div>
                <select className="w-full border bg-white rounded px-5 py-2 outline-none w-20" onChange={(event => this.updateContainsMoreThanOneSectionPerSubject(event))}>
                    <option className="py-1" value="false">No</option>
                    <option className="py-1" value="true">Yes</option>
                </select>
            </div> */}
            {this.getSubjectNameAndNumberOfSectionsInputJSX()}
            <div className={"w-full lg:w-1/3 py-3 bg-gray-100" }>
                <p className={generalTextSize}>
                    <b>Part B : Configure question grouping</b>
                </p>
            </div>
            <div className="flex  flex-row... px-5 py-5">
                {this.getSubjectwiseNumberOfSectionsJSX()}
            </div>
            <div className={"w-full lg:w-1/3 py-3 bg-gray-100" }>
                <p className={generalTextSize}>
                    <b>Part C : Configure marking system</b>
                </p>
            </div>
            <div className="flex  flex-row... px-5 py-5">
                {this.getMarkingSystemConfigurationJSX()}
            </div>
            <div className={"w-full lg:w-1/3 py-3 bg-gray-100" }>
                <p className={generalTextSize}>
                    <b>Part D : Paper Tags</b>
                </p>
            </div>
            <div className="flex  flex-row... px-5 py-5">
                <NewPaperTagComponent/>
            </div>
        </div>;
    }

    getQuestionFilteringJSX = () => {
        return  <div class="container flex px-4 py-4 sm:px-6 lg:px-8">
                                <input 
                                    type="text" 
                                    class="resize  bg-gray-200 h-10 w-7/12 pr-8 pl-5 rounded z-0 focus:shadow focus:outline-none" 
                                    placeholder="Search questions or options"
                                    // value = {this.props.newQuestionDetails.searchedTagKey}
                                    // onChange={(event)=>this.updateSearchedTagKey(event)}
                                    // onClick = {this.activateTagSearch}
                                />
                </div>
    }

    getConfigurationSectionJSX = () => {
        if(this.props.newPaperDetails === undefined) {
            return <div>not yet initialized.</div>;
        }
        if(this.props.newPaperDetails.currentTab === 'TEST_SETTING') {
            return this.geTestDetailsConfiguration();
        }
        if(this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION' || this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION_SELECTED_QUESTION') {
            return <QuestionSelectionConfigurationBox
                        showSelectedQuestions = {this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION_SELECTED_QUESTION'} />
        }
        if(this.props.newPaperDetails.currentTab === 'REVIEW_AND_PUBLISH') {
            return <NewPaperPreview/>
        }
        return <div> I'M CONFIGURING</div>;
    }

    moveToNextQuestion = () => {
        if(this.props.newPaperDetails.currentTab === 'TEST_SETTING') {
            this.updateCurrentTab('QUESTION_SELECTION')
        }
        if(this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION' || this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION_SELECTED_QUESTION') {
            this.updateCurrentTab('REVIEW_AND_PUBLISH')
        }
    }

    moveToPreviousQuestion = () => {
        if(this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION' || this.props.newPaperDetails.currentTab === 'QUESTION_SELECTION_SELECTED_QUESTION') {
            this.updateCurrentTab('TEST_SETTING')
        }
        if(this.props.newPaperDetails.currentTab === 'REVIEW_AND_PUBLISH') {
            this.updateCurrentTab('QUESTION_SELECTION')
        }
    }

    showQuestionPagingSection = () => {
        return <div>
            <div className="flex items-center justify-center py-4 px-4 md:px-10 bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
                <div className="w-full flex items-center justify-between">
                    <div className='flex grow'>
                        <div className='flex flex-row justify-center w-full'>
                            <button className="flex items-center py-1 px-3 text-primary-600 hover:text-primary-800 transition-colors" onClick={this.moveToPreviousQuestion}>
                                <BsArrowLeft size={18}/>
                                <span className={generalTextSize + " ml-1 font-medium"}>
                                    Save and Previous
                                </span>
                            </button>
                            <button className="flex items-center py-1 px-3 text-primary-600 hover:text-primary-800 transition-colors" onClick={this.moveToNextQuestion}>
                                <span className={generalTextSize + " font-medium mr-1"}>
                                    Save and Next
                                </span>
                                <BsArrowRight size={18}/>
                            </button>
                        </div>
                    </div>
                    <Button variant="primary" onClick={() => this.submitPaper()}>
                        Submit Paper
                    </Button>
                </div>
            </div>
        </div>;
    }

    submitPaper = async () => {
        await PaperSubmissionUtil.submitPaper(this.props.newPaperDetails);
        window.sessionStorage.setItem("createdByMe",  true);
        window.location.href = currentURLHost + "papers";
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.newPaperDetails===undefined || Object.keys(this.props.newPaperDetails).length === 0) {
            this.initializeNewPaperDetails();
            return <div/>;
        }
        return (
            <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div className="flex flex-col md:flex-row px-4 md:px-6 py-6 gap-4">
                    <div className="w-full md:w-80 xl:w-96 bg-white rounded-xl shadow-sm border border-gray-100">
                        <PaperCreationHelpSectionComponent/>
                    </div>
                    <div className='grow'>
                        {this.getHeaderJSX()}
                        <div className="mt-4">
                            {this.getConfigurationSectionJSX()}
                        </div>
                        {this.showQuestionPagingSection()}
                    </div>
                </div>
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewPaperPortal);
