import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet, savePaperSet, updateGeneralInfo} from '../../../store/actions/solgressAction';
import { generalTextSize, searchBoxInputCSS } from '../../../constants/TextSizeConstants';
import TagReceiver from '../../../apis/TagReceiver';
import QuestionsReceiver from '../../../apis/QuestionsReceiver';
import Collapsible from "react-collapsible";
import {AiOutlineDownSquare} from "react-icons/ai";
import { object } from 'prop-types';
import { JSXUtils } from '../../../utils/JSXUtils';


const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload)),
    savePaperSet: (payload) => dispatch(savePaperSet(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet,
        paperSet: state.solgressReducer.paperSet,
        generalInfo: state.solgressReducer.generalInfo
    };
}

class TagsFilterViewSmall extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }
    appliedFilterQuestions = () =>{
        let selectedTags=[];
        let temporarySelectedTags=this.props.generalInfo.temporarySelectedTags;
        let selectedTagIds=[];
        for(let index=0;index<temporarySelectedTags.length;index++){
            selectedTags.push(temporarySelectedTags[index]);
            let length=selectedTagIds.push(temporarySelectedTags[index].id);
        }
        let channelIds=[];
        let searchedKey="";
        QuestionsReceiver.getAllFilteredQuestions(searchedKey, selectedTagIds, channelIds).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = questionsData.data;
            payload.searchedKey = searchedKey;
            this.props.saveQuestionSet(payload);
        });
        let payload ={...this.props.generalInfo};
        payload.temporarySelectedTags=[];
        payload.selectedTags= selectedTags;
        payload.isTagFilterViewActive=false;
        this.props.updateGeneralInfo(payload);
    }
    
    addNewTag = (index) => {
        let payload = {...this.props.generalInfo};
        if(this.isASelectedTag(payload.suggestedTags[index].id)){
            let array=[];
            if(payload.temporarySelectedTags.length ==0){
                array=[];
            }
            else{
                array= payload.temporarySelectedTags;
            }
            if(array.length == 1){
                array=[];
            }
            else{
                
                var new_array=[];
                for(let index1=0;index1<array.length;index1++){
                    if(array[index1].id != payload.suggestedTags[index].id){
                        let x=new_array.push(array[index1]);
                    }
                }
                array=new_array;
            }
            payload.temporarySelectedTags= array;

        }
        else{ 
            if(this.props.generalInfo.temporarySelectedTags === undefined){
                let temporarySelectedTags =[];
                let length=temporarySelectedTags.push(payload.suggestedTags[index]);
                payload.temporarySelectedTags=temporarySelectedTags;
            }
            else{
                let temporarySelectedTags = [...payload.temporarySelectedTags];
                let length=temporarySelectedTags.push(payload.suggestedTags[index]);
                payload.temporarySelectedTags=temporarySelectedTags;
            }
            payload.authorTag=payload.suggestedTags[index].tagName;
            let prefix="Created By : ";
            let authorname=payload.authorTag;
            authorname= authorname.slice(prefix.length);
            payload.authorTag=authorname;
        }
        this.props.updateGeneralInfo(payload);
    }
    
    isASelectedTag = (tagId) => {
        let temporarySelectedTags=[...this.props.generalInfo.temporarySelectedTags];
        for(let index=0;index<temporarySelectedTags.length;index++){
            if(temporarySelectedTags[index].id == tagId){
                return true;
            }
        }
        return false;
    }

    removeSelectedAppliedTag = (tagId) => {
        let updatedTemporaryTags=[];
        let temporarySelectedTags=this.props.generalInfo.temporarySelectedTags;
        let payload ={...this.props.generalInfo};
        for(let x=0; x<temporarySelectedTags.length;x++) {
            if(tagId!=temporarySelectedTags[x].id){
                updatedTemporaryTags.push(temporarySelectedTags[x]);   
            }
        }
        payload.temporarySelectedTags = updatedTemporaryTags;
        let updatedSelectedTags=[];
        let selectedTags=this.props.generalInfo.selectedTags;
        for(let x=0; x<selectedTags.length;x++) {
            if(tagId!=selectedTags[x].id){
                updatedSelectedTags.push(selectedTags[x]);   
            }
        }
        payload.selectedTags = updatedSelectedTags;
        this.props.updateGeneralInfo(payload);
    }

    showSelectedTags = () => {
        if (this.props.generalInfo == undefined || this.props.generalInfo.temporarySelectedTags == undefined || this.props.generalInfo.temporarySelectedTags.length == 0) {
            return <div></div>;
        }
        let response = [];
        response.push(<div>
            <div className={"px-6  py-2 " + generalTextSize + " leading-tight text-gray-800 "}>
                Applied Tags :
            </div>
        </div>
        );
        let payload= this.props.generalInfo;
        let temporarySelectedTags = [...this.props.generalInfo.temporarySelectedTags];
        for(let index=0; index<temporarySelectedTags.length; index++) {
            if(this.isASelectedTag(temporarySelectedTags[index].id) ){
                    response.push(
                        // <div className={generalTextSize + " py-1 border border-slate-200 hover:bg-gray-50 w-full" } onClick={()=> this.removeSelectedAppliedTag(index)} >
                        //     <b>+ </b>
                        //     {temporarySelectedTags[index].tagName}
                        // </div>
                        <div className="flex flex-row">
                            <div className="py-2 ">{JSXUtils.getTagViewJSX(temporarySelectedTags[index].tagName)}</div>
                            <div className="px-1 pr-3" onClick={()=>this.removeSelectedAppliedTag(temporarySelectedTags[index].id)}>
                                <div className={"flex my-2 transition-colors rounded bg-gray-100 border border-gray-300 py-2 text-gray-600 " + generalTextSize + " hover:bg-danger-50 hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="8"
                                            fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd"
                                                d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                                            <path fill-rule="evenodd"
                                                d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/>
                                        </svg>
                                </div>
                            </div>
                        </div>
                    );
                        
            }
        }
        return response;
    }

    showSuggestedTag = (fixedIndex) => {
        let response = [];
        let suggestedTags=this.props.generalInfo.suggestedTags;
        for(let index=0; index<suggestedTags.length; index++) {
            if(suggestedTags[index].tagName.startsWith(this.props.generalInfo.tagPrefixPairMap[fixedIndex]["prefix"])){
                response.push(
                    <div className={generalTextSize + " py-1 border-l border-t border-r hover:bg-gray-50 w-full "}  onClick={()=>this.addNewTag(index)} >
                        <div className='flex flex-row w-full'>
                            <div className='px-2 py-1'>{suggestedTags[index].tagName}</div>
                            <div className='flex grow justify-end w-full pr-2 py-1'>
                                {
                                    this.isASelectedTag(suggestedTags[index].id)
                                        ?<input type='checkbox' checked className='w-4 h-4'></input>
                                        :<input type='checkbox' className='w-4 h-4'></input>
                                }
                            </div>
                        </div>
                    </div>
                    
                );
            }
        }
        return <div className='flex overflow-auto flex-col w-full '>{response}</div>
    }

    updateTagDetails = (event,fixedIndex) => {
        let payload = {...this.props.generalInfo};
        let tagPlaceholder=payload.tagPrefixPairMap[fixedIndex]["tag"];
        payload.tagPlaceholder = event.target.value;
        let random1= "prefix";
        let prefixValue =payload.tagPrefixPairMap[fixedIndex].prefix;
        this.props.updateGeneralInfo(payload);
        prefixValue=(prefixValue+event.target.value);
        TagReceiver.getSuggestedTags((prefixValue)).then(tagData=>{
            let payload = {...this.props.generalInfo};
            let suggestedTags = [...tagData.data];
            payload.suggestedTags = suggestedTags;
            this.props.updateGeneralInfo(payload);
        });
    }
    
    getTagDetailsJSX = (fixedIndex) => {
        let triggerContent =  <div className={'flex flex-row w-full border px-3 py-2'}>
            <div className={ generalTextSize + " w-full "}>
                {this.props.generalInfo.tagPrefixPairMap[fixedIndex].inputPlaceholder}
            </div>
            <div className='flex justify-end'>
                <AiOutlineDownSquare size={25}/>
            </div>
        </div>

        let content = <div className='flex w-full'>
                <div className='flex flex-col w-full px-20'>
                    <div>
                        <input
                            type="text"  
                            className = { searchBoxInputCSS + "w-full focus:outline-none rounded py-2 px-2 border"}
                            placeholder="Search filters"
                            // value = {this.props.newChannelDetails.channelName}  
                            onChange = {(event) => this.updateTagDetails(event,fixedIndex)}  
                        />
                    </div>
                    {this.showSuggestedTag(fixedIndex)}
                </div>
            </div>;
        return <Collapsible 
            trigger={triggerContent}
            className = "border-b-2 Collapsible__trigger">
            {content}
        </Collapsible>
    }

    initializeGeneralInfo = () => {
        let tagPrefixPairMap=[];
        tagPrefixPairMap = [
            { prefix: "Created By : ", tag: "authorTag" , inputPlaceholder: "Author Name" ,searchPlaceholder:"Search Authors"},
            { prefix: "Subject : ",    tag: "SubjectTag", inputPlaceholder: "Subject Name" ,searchPlaceholder:"Search Subjects"},
            { prefix: "Topic : ",    tag: "TopicTag", inputPlaceholder: "Topic Name" ,searchPlaceholder:"Search Topics"},
            { prefix: "Exam Name : ",    tag: "ExamTag", inputPlaceholder: "Exam Name" ,searchPlaceholder:"Search exams"},
            { prefix: "",    tag: "otherTag", inputPlaceholder: "other tags" ,searchPlaceholder:"Search other tags"}

        ];
        if(this.props.generalInfo ==  undefined){
            let payload={...this.props.generalInfo};
            payload.temporarySelectedTags=[];
            payload.suggestedTags=[];
            payload.tagPrefixPairMap = tagPrefixPairMap;
            this.props.updateGeneralInfo(payload);
        }
        else{
            let payload ={...this.props.generalInfo};
            if(this.props.generalInfo.tagPrefixPairMap == undefined) payload.tagPrefixPairMap = tagPrefixPairMap;
            if(this.props.generalInfo.temporarySelectedTags ==undefined)  payload.temporarySelectedTags=[];
            if(this.props.generalInfo.suggestedTags ==undefined) payload.suggestedTags=[];
            this.props.updateGeneralInfo(payload);
        }
    }

    updateExistingTags = () => {
        let payload = {...this.props.generalInfo};
        payload.temporarySelectedTags = [...payload.selectedTags];
        this.props.updateGeneralInfo(payload);
    } 

    render() {
        if(this.props.generalInfo == undefined || this.props.generalInfo.tagPrefixPairMap == undefined || this.props.generalInfo.temporarySelectedTags ==undefined ) {
            {this.initializeGeneralInfo()};
            return <div></div>;
        }
        if(this.props.generalInfo.temporarySelectedTags.length==0 && this.props.generalInfo.selectedTags.length!=0){
            this.updateExistingTags();
            return <div/>
        }
        return <div className='flex flex-col h-screen overflow-y-auto '>
            {this.getTagDetailsJSX(0)}
            {this.getTagDetailsJSX(1)}
            {this.getTagDetailsJSX(2)}
            {this.getTagDetailsJSX(3)}
            {this.getTagDetailsJSX(4)}
            {/* {this.getTopicNameJSX(3)}
            {this.getExamNameJSX(4)}
            {this.getOtherNamesJSX(5)} */}
            {this.showSelectedTags()}
            <div className='flex justify-center py-2 '>
                <button className={generalTextSize + " flex items-center cursor-pointer bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"} onClick={this.appliedFilterQuestions}>
                    Show Result
                </button>
            </div>
            <div>.</div>
            <div>.</div>
        </div>
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TagsFilterViewSmall);
