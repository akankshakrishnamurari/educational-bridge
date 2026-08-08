import React from 'react';
import { connect } from 'react-redux'
import {updateNewPaperDetails, savePaperDetails, saveQuestionSet} from "../../../store/actions/solgressAction";
import {AiOutlineEdit}  from "react-icons/ai";
import { BsEyeFill } from "react-icons/bs";
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import { generalTextSize } from '../../../constants/TextSizeConstants';

const mapDispatchToProps = dispatch => ({
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload)),
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload)),
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload))
})


const mapStateToProps = state => {
    return {
        newPaperDetails: state.solgressReducer.newPaperDetails,
        paperDetails: state.solgressReducer.paperDetails,
        questionSet: state.solgressReducer.questionSet
    };
}

class PaperCreationHelpSectionComponent extends React.Component {

    moveCurrentSectionToQuestionSelection = (subjectIndex) => {
        let payload = {...this.props.newPaperDetails};
        payload.currentTab = 'QUESTION_SELECTION';
        payload.currentSubjectIndex = subjectIndex;
        this.props.updateNewPaperDetails(payload);
        QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey, [], []).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = this.normalise(questionsData.data, subjectIndex);
            this.props.saveQuestionSet(payload);
        });
    }

    moveCurrentSectionToQuestionSelectionSelectedQuestions = (subjectIndex) => {
        let payload = {...this.props.newPaperDetails};
        payload.currentTab = 'QUESTION_SELECTION_SELECTED_QUESTION';
        payload.currentSubjectIndex = subjectIndex;
        QuestionsReceiver.getQuestionsByQuestionIds(this.props.newPaperDetails.selectedQuestionIds).then(questionsData=>{
            let questionPayload = {...this.props.questionSet};
            questionPayload.questions = this.normalise(questionsData.data, subjectIndex);
            this.props.saveQuestionSet(questionPayload);
            this.props.updateNewPaperDetails(payload);
        });
    }
    
    normalise = (questionSet, subjectIndex) => {
        let selectedQuestionIds = [...this.props.newPaperDetails.selectedQuestionIds];
        let subjectName = this.props.newPaperDetails.subjectNames[subjectIndex];
        let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[subjectIndex][this.props.newPaperDetails.currentSectionIndex];
        let questionIdsSelectedForSubjectWiseSection = (this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions === undefined
                                                        || this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName] === undefined
                                                        || this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName] === undefined
                                                    )? []
                                                    : this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName];
        let blockedQuestionIds = selectedQuestionIds.filter(function(selectedQuestionId) {
            return !questionIdsSelectedForSubjectWiseSection.includes(selectedQuestionId);
        });
        questionSet = questionSet.questions.filter(function(question){
            return !blockedQuestionIds.includes(question.id);
        });
        return {"questions":questionSet};
    }

    onlyOverallPaperConfigurationOverviewJSX = () => {
        let numberOfQuestions = this.props.newPaperDetails.numberOfQuestions;
        let positiveMarksPerQuestion = this.props.newPaperDetails.subjectWiseSectionPositiveMarks[0][0];
        let maximumPossibleMarks = numberOfQuestions * positiveMarksPerQuestion;
        return <div className='border-2 border-black '>
            <div className={generalTextSize + ' font-medium py-2 bg-primary-200 border-1 border-black '}> Paper Overview</div>
            <div className={generalTextSize + ' bg-white divide-y divide-primary-200'}>
                <div className='flex flex-row justify-center items-center hover:bg-slate-100 ...'>
                    <div className='py-2' >Qs. Added : {this.props.newPaperDetails.selectedQuestionIds.length}/{numberOfQuestions}</div>
                    <div className='' onClick={()=> this.moveCurrentSectionToQuestionSelection(0)}>
                        <AiOutlineEdit className='px-2 py-2 w-10 h-10 '/>
                    </div>
                    <div className='' onClick={()=> this.moveCurrentSectionToQuestionSelectionSelectedQuestions(0)}>
                        <BsEyeFill color = {'blue'} className='px-2 py-2 w-10 h-10 '/>
                    </div>
                </div>
                <div className='flex flex-row justify-center items-center hover:bg-slate-100 py-2...'>
                    <div className='px-1 py-2'>Marks : </div>
                    <div className='bg-success-500 px-3 py-2'>+{positiveMarksPerQuestion}</div>
                    <div className = 'px-1 py-2'>,</div>
                    <div className='bg-danger-500 px-3 py-2 '>{this.props.newPaperDetails.subjectWiseSectionNegativeMarks[0][0]}</div>
                </div>
                <div className='py-2 hover:bg-slate-100' >Maximum Marks : {maximumPossibleMarks}</div>
                <div className='py-2 hover:bg-slate-100' > Time : 100 minutes</div>
            </div>
        </div>;
    }

    getSubjectwiseConfigurationOverviewJSX = () => {
        let subjectWiseOverviews = [];
        let maximumPaperMarks = 0;
        for(let index=0; index<this.props.newPaperDetails.numberOfSubjects; index++) {
            let selectedNumberOfQuestions = 0;
            let subjectName = this.props.newPaperDetails.subjectNames[index];
            let numberOfQuestions = this.props.newPaperDetails.subjectWiseSectionWiseNumberOfQuestions[index][0];
            let positiveMarksPerQuestion = this.props.newPaperDetails.subjectWiseSectionPositiveMarks[index][0];
            let maximumPossibleMarks = numberOfQuestions * positiveMarksPerQuestion;
            maximumPaperMarks += maximumPossibleMarks;
            let sectionName = this.props.newPaperDetails.subjectWiseSectionNames[index][0];
            if(this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions !== undefined &&
                this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName] !== undefined) {
                selectedNumberOfQuestions = this.props.newPaperDetails.subjectWiseSectionWiseSelectedQuestions[subjectName][sectionName].length;
            }
            let subjectWiseOverview = <div className='flex flex-row justify-center items-center  divide-x divide-primary-400'>
            <div className={generalTextSize + ' bg-white h-max w-fit px-3 py-2 font-normal'}>{this.props.newPaperDetails.subjectNames[index]}</div>
                <div className={generalTextSize + ' bg-white divide-y divide-primary-200 w-full'}>
                    <div className='flex flex-row justify-center items-center hover:bg-slate-100 ...'>
                        <div className='py-2' >Qs. Added : {selectedNumberOfQuestions}/{numberOfQuestions}</div>
                        <div className='' onClick={()=> this.moveCurrentSectionToQuestionSelection(index)}>
                            <AiOutlineEdit className='px-2 py-2 w-10 h-10 '/>
                        </div>
                        <div className='' onClick={()=> this.moveCurrentSectionToQuestionSelectionSelectedQuestions(index)}>
                            <BsEyeFill color = {'blue'} className='px-2 py-2 w-10 h-10 '/>
                        </div>
                    </div>
                    <div className='flex flex-row justify-center items-center hover:bg-slate-100 py-2...'>
                        <div className='px-1 py-2'>Marks : </div>
                        <div className='bg-success-500 px-3 py-2'>+{positiveMarksPerQuestion}</div>
                        <div className = 'px-1 py-2'>,</div>
                        <div className='bg-danger-500 px-3 py-2 '>{this.props.newPaperDetails.subjectWiseSectionNegativeMarks[0][0]}</div>
                    </div>
                    <div className='py-2 hover:bg-slate-100' >Maximum Marks : {maximumPossibleMarks}</div>
                </div>
            </div>;
            subjectWiseOverviews.push(subjectWiseOverview);
        }
        let overallPaperOverview = <div className='bg-slate-100'>
            <div className={generalTextSize + ' px-1 py-1 font-medium'}> Total Questions : {this.props.newPaperDetails.numberOfQuestions}</div>
            <div className={generalTextSize + ' px-1 py-1 font-medium'}> Allotted Time: 100 mins</div>
            <div className={generalTextSize + ' px-1 py-1 font-medium'}> Maximum Marks: {maximumPaperMarks}</div>
        </div>;
        return <div className='border-2 border-black divide-y divide-black bg-white'>
                <div className={generalTextSize + ' font-medium py-2 bg-primary-200 border-1 border-black '}> Paper Overview</div>
                {overallPaperOverview}
                {subjectWiseOverviews}
        </div>;
    }

    getPaperConfigurationOverview = () => {
        if(this.props.newPaperDetails.containsMoreThanOneSubject === 'false' 
            && this.props.newPaperDetails.containsMoreThanOneSectionPerSubject === 'false'
        ) {
            return this.onlyOverallPaperConfigurationOverviewJSX();
        } else if (this.props.newPaperDetails.containsMoreThanOneSectionPerSubject === 'false') {
            return this.getSubjectwiseConfigurationOverviewJSX();
        }
        return <div>yo boy</div>;
    }

    render() {
        return <div>
            {this.getPaperConfigurationOverview()}
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperCreationHelpSectionComponent);
