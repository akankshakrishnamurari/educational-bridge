import React from 'react';
import { connect } from 'react-redux'
import {updateNewPaperDetails, saveQuestionSet} from "../../../store/actions/solgressAction";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
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
import ClipLoader from "react-spinners/ClipLoader";
import notify from '../../../utils/notify';
import Button from '../../../components/common/Button';
import Stepper from '../../../components/common/Stepper';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import StatTile from '../../../components/common/StatTile';
import FormField from '../../../components/common/FormField';
import { typography, layout } from '../../../constants/designTokens';

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
        this.state = { isConfirmingPublish: false, isPublishing: false };
        this.initializeNewPaperDetails = this.initializeNewPaperDetails.bind(this);
        this.getConfigurationSectionJSX = this.getConfigurationSectionJSX.bind(this);
    }

    initializeNewPaperDetails = () => {
        // Defaults were "Sample Test Paper" and "Test Subject", which shipped
        // straight through to published papers whenever an author did not think to
        // overwrite them. The name now starts empty and is required before
        // publishing; the subject falls back to a neutral "Section 1" grouping.
        let payload = {
            "currentTab" : 'TEST_SETTING',
            "numberOfQuestions":1,
            "paperName" : "",
            "allottedPaperTime":180,
            "containsMoreThanOneSubject":"false",
            "containsMoreThanOneSectionPerSubject":"false",
            "numberOfSubjects" : 1,
            "selectedQuestionIds" : [],
            "subjectNames" : ["General"],
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

    // Canonical step order. The old header inferred position from a chain of
    // string comparisons in four places and carried a dead `stateName` variable
    // plus an unrendered `percentageCompleted`.
    static STEPS = [
        { key: 'TEST_SETTING', label: 'Paper settings', hint: 'Name, timing, marking' },
        { key: 'QUESTION_SELECTION', label: 'Choose questions', hint: 'Pick from the bank' },
        { key: 'REVIEW_AND_PUBLISH', label: 'Review and publish', hint: 'Check, then publish' },
    ];

    getStepKey = () => {
        // The selected-questions view is a sub-view of question selection, not a
        // fourth step, so it maps onto the same stepper position.
        const tab = this.props.newPaperDetails.currentTab;
        return tab === 'QUESTION_SELECTION_SELECTED_QUESTION' ? 'QUESTION_SELECTION' : tab;
    }

    getHeaderJSX = () => {
        return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            <Stepper
                steps={NewPaperPortal.STEPS}
                currentKey={this.getStepKey()}
                onSelect={this.updateCurrentTab}
            />
        </div>;
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
            // Was 'Test Subject' + index.
            subjectNames.push('Subject ' + (index + 1));
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

    // Section heading. Replaces the "Part A / Part B / Part C / Part D" grey bars,
    // which were each rendered at `lg:w-1/3` width so they ran a third of the way
    // across the page and looked like truncated tabs.
    sectionHeading = (title, description) => (
        <div className="mb-4">
            <h2 className={typography.h3}>{title}</h2>
            {description &&
                <p className="mt-1 text-xs text-gray-500 leading-relaxed max-w-prose">{description}</p>
            }
        </div>
    )

    geTestDetailsConfiguration = () => {
        const details = this.props.newPaperDetails;
        const isMultiSubject = details.containsMoreThanOneSubject === 'true';
        return <div className="flex flex-col gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                {this.sectionHeading('Basics', 'How the paper is presented to learners and how long they get.')}
                <div className="grid sm:grid-cols-2 gap-5">
                    <FormField label="Paper name" required className="sm:col-span-2">
                        {(fieldProps) => (
                            <input
                                {...fieldProps}
                                autoComplete="off"
                                placeholder="e.g. JEE Main 2024 Full Mock 1"
                                value={details.paperName}
                                onChange={(event)=>this.updatePaperName(event.target.value)}
                            />
                        )}
                    </FormField>
                    <FormField label="Time allowed" help="In minutes.">
                        {(fieldProps) => (
                            <input
                                {...fieldProps}
                                type="number"
                                min="1"
                                autoComplete="off"
                                placeholder="180"
                                value={details.allottedPaperTime}
                                onChange={(event)=>this.updateAllottedPaperTime(event.target.value)}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Questions"
                        help={isMultiSubject
                            ? 'Totalled from the sections below.'
                            : 'How many questions this paper should contain.'}
                    >
                        {(fieldProps) => (
                            <input
                                {...fieldProps}
                                type="number"
                                min="0"
                                autoComplete="off"
                                placeholder="30"
                                value={details.numberOfQuestions}
                                onChange={(event)=>this.updateNumberOfQuestions(event.target.value)}
                                disabled={isMultiSubject}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Multiple subjects"
                        help="Turn on for a paper split across subjects, like Physics, Chemistry and Maths."
                        className="sm:col-span-2"
                    >
                        {(fieldProps) => (
                            <select
                                {...fieldProps}
                                className={fieldProps.className + ' w-auto'}
                                value={details.containsMoreThanOneSubject}
                                onChange={(event => this.updateContainsMoreThanOneSubject(event))}
                            >
                                <option value="false">No, one subject</option>
                                <option value="true">Yes, several subjects</option>
                            </select>
                        )}
                    </FormField>
                </div>
                {isMultiSubject &&
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        {this.getSubjectNameAndNumberOfSectionsInputJSX()}
                    </div>
                }
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                {this.sectionHeading('Structure', 'How many questions sit in each section.')}
                {this.getSubjectwiseNumberOfSectionsJSX()}
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                {this.sectionHeading('Marking', 'Marks awarded for a correct answer and deducted for a wrong one.')}
                {this.getMarkingSystemConfigurationJSX()}
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                {this.sectionHeading('Tags', 'Help learners find this paper.')}
                <NewPaperTagComponent/>
            </section>
        </div>;
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

    /**
     * Wizard navigation, pinned to the viewport.
     *
     * Publish is now available ONLY on the final step. Previously "Submit Paper"
     * sat beside Back/Next on every step, so a paper could be published from step
     * one with no questions selected and no name -- and it would then appear in the
     * public papers list.
     */
    getWizardBarJSX = () => {
        const stepKey = this.getStepKey();
        const stepIndex = NewPaperPortal.STEPS.findIndex((step) => step.key === stepKey);
        const isFirst = stepIndex <= 0;
        const isLast = stepIndex >= NewPaperPortal.STEPS.length - 1;
        const selectedCount = (this.props.newPaperDetails.selectedQuestionIds || []).length;

        return <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
            <div className={layout.container + ' py-3 flex items-center justify-between gap-3'}>
                <Button variant="secondary" onClick={this.moveToPreviousQuestion} disabled={isFirst}>
                    <span aria-hidden="true">&larr;</span>
                    <span className="hidden sm:inline">Back</span>
                </Button>
                <p className="text-xs sm:text-sm text-gray-500 tabular-nums text-center min-w-0 truncate">
                    {selectedCount} {selectedCount === 1 ? 'question' : 'questions'} selected
                </p>
                {isLast
                    ? <Button
                        variant="primary"
                        onClick={() => this.setState({ isConfirmingPublish: true })}
                        disabled={this.state.isPublishing === true}
                    >
                        Publish paper
                    </Button>
                    : <Button variant="primary" onClick={this.moveToNextQuestion}>
                        <span className="hidden sm:inline">Next</span>
                        <span aria-hidden="true">&rarr;</span>
                    </Button>
                }
            </div>
        </div>;
    }

    /** Blocking problems that would produce an unusable published paper. */
    getPublishBlockers = () => {
        const details = this.props.newPaperDetails;
        const blockers = [];
        if (!details.paperName || details.paperName.trim().length === 0) {
            blockers.push('The paper needs a name.');
        }
        if ((details.selectedQuestionIds || []).length === 0) {
            blockers.push('No questions have been selected.');
        }
        if (!(Number(details.allottedPaperTime) > 0)) {
            blockers.push('Set how long learners get, in minutes.');
        }
        return blockers;
    }

    getPublishDialogJSX = () => {
        if (this.state.isConfirmingPublish !== true) {
            return null;
        }
        const details = this.props.newPaperDetails;
        const blockers = this.getPublishBlockers();
        const selectedCount = (details.selectedQuestionIds || []).length;

        if (blockers.length > 0) {
            return <ConfirmDialog
                title="Not ready to publish"
                description="These need attention first."
                confirmLabel="Back to editing"
                cancelLabel="Close"
                onConfirm={() => this.setState({ isConfirmingPublish: false })}
                onCancel={() => this.setState({ isConfirmingPublish: false })}
            >
                <ul className="flex flex-col gap-1 list-disc list-inside">
                    {blockers.map((blocker) => (
                        <li key={blocker} className="text-sm text-danger-700">{blocker}</li>
                    ))}
                </ul>
            </ConfirmDialog>;
        }

        return <ConfirmDialog
            title="Publish this paper?"
            description="It becomes available to every learner on the platform."
            confirmLabel="Publish"
            cancelLabel="Keep editing"
            isBusy={this.state.isPublishing === true}
            onCancel={() => this.setState({ isConfirmingPublish: false })}
            onConfirm={this.submitPaper}
        >
            <dl className="grid grid-cols-2 gap-2">
                <StatTile label="Questions" value={selectedCount} />
                <StatTile label="Time" value={details.allottedPaperTime + ' min'} />
            </dl>
        </ConfirmDialog>;
    }

    submitPaper = async () => {
        this.setState({ isPublishing: true });
        try {
            await PaperSubmissionUtil.submitPaper(this.props.newPaperDetails);
            window.sessionStorage.setItem("createdByMe",  true);
            window.location.href = currentURLHost + "papers";
        } catch (err) {
            notify.error('Could not publish the paper. Please try again.');
            this.setState({ isPublishing: false, isConfirmingPublish: false });
        }
    }

    componentDidMount() {
        // Was called from render(), which dispatched a redux update mid-render on
        // first paint.
        if(this.props.newPaperDetails===undefined || Object.keys(this.props.newPaperDetails).length === 0) {
            this.initializeNewPaperDetails();
        }
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.newPaperDetails===undefined || Object.keys(this.props.newPaperDetails).length === 0) {
            return <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>;
        }
        return (
            <div className="bg-gray-50 min-h-screen pb-24">
                <EducationalBridgeHeader/>
                <div className={layout.container + ' py-6'}>
                    <a
                        href={currentURLHost + 'papers'}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <span aria-hidden="true">&larr;</span>
                        All papers
                    </a>
                    <h1 className={typography.h1 + ' mt-3'}>Build a paper</h1>
                    <p className="mt-1 text-sm text-gray-500 max-w-2xl">
                        Assemble a timed paper from questions in the bank. Learners get a full
                        score report with a topic breakdown when they finish.
                    </p>

                    <div className="mt-6">
                        {this.getHeaderJSX()}
                    </div>

                    {/* The help panel used to occupy a permanent 384px column on the
                        left of every step, pushing the actual work into a narrow
                        remainder. It now sits below the content where it is available
                        without competing with the form. */}
                    <div className="mt-5">
                        {this.getConfigurationSectionJSX()}
                    </div>
                    <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100">
                        <PaperCreationHelpSectionComponent/>
                    </div>
                </div>
                {this.getWizardBarJSX()}
                {this.getPublishDialogJSX()}
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewPaperPortal);
