import React from 'react';
import TagReceiver from "../../../apis/TagReceiver";
import { connect } from 'react-redux';
import {updateNewQuestionDetails,updateGeneralInfo} from '../../../store/actions/solgressAction';
import {currentURLHost} from './../../../constants/hostConfig';
import { JSXUtils } from '../../../utils/JSXUtils';
import { generalTextSize, searchBoxInputCSS, smallerTextSize, searchSuggestionTextSize } from '../../../constants/TextSizeConstants';
import TagFilterViewLarge from '../../questionSet/TagFilter/TagFilterViewLarge';
import { tagPrefixPairMap } from '../../../constants/tagPrefixPairMap';
import Collapsible from "react-collapsible";
import {AiOutlineDownSquare} from "react-icons/ai";

const mapDispatchToProps = dispatch => ({
    updateNewQuestionDetails: (payload) => dispatch(updateNewQuestionDetails(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        newQuestionDetails: state.solgressReducer.newQuestionDetails,
        generalInfo: state.solgressReducer.generalInfo
    };
}

class NewQuestionTagComponent extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeTagDetails = this.initializeTagDetails.bind(this);
        this.activateTagSearch = this.activateTagSearch.bind(this);
        this.addNewTag = this.addNewTag.bind(this);
    }

    initializeTagDetails = () => {
        let payload = {...this.props.newQuestionDetails};
        payload.nonMandatoryTagPrefix= "Topic : ";
        payload.tagPrefixPairMap = tagPrefixPairMap;
        payload.tagPrefix = "Subject : ";
        payload.hasTagDetailsBeenInitialized = true;
        const selectedTagsByCategory=new Array(5);
        payload.selectedTagsByCategory=selectedTagsByCategory;
        this.props.updateNewQuestionDetails(payload);
        TagReceiver.getSuggestedTags('').then(tagData=>{
            let suggestedTags = [...tagData.data];
            let existingTagIds = [];
            for(let i=0; i<payload.tags.length; i++) {
                existingTagIds.push(payload.tags[i].id);
            }
            suggestedTags = suggestedTags.filter(function(tag) {return !existingTagIds.includes(tag.id)});
            payload = Object.assign({searchedTagKey: ""}, payload);
            payload = Object.assign({isSearchingForTagActive: false}, payload);
            payload = Object.assign({suggestedTags: suggestedTags}, payload);
            this.props.updateNewQuestionDetails(payload);
        });
    }

    activateTagSearch = () => {
        let payload = {...this.props.newQuestionDetails};
        if(payload.isSearchingForTagActive) {
            return;
        }
        payload.isSearchingForTagActive = true;
        this.props.updateNewQuestionDetails(payload);
    }

    deactivateTagSearch = () => {
        let payload = {...this.props.newQuestionDetails};
        payload.isSearchingForTagActive = false;
        this.props.updateNewQuestionDetails(payload);
    }

    updateSearchedTagKey = (event) => {
        let payload = {...this.props.newQuestionDetails};
        payload.searchedTagKey = event.target.value;
        this.props.updateNewQuestionDetails(payload);
        TagReceiver.getSuggestedTags(event.target.value).then(tagData=>{
            let payload = {...this.props.newQuestionDetails};

            let suggestedTags = [...tagData.data];
            let existingTagIds = [];
            for(let i=0; i<payload.tags.length; i++) {
                existingTagIds.push(payload.tags[i].id);
            }
            suggestedTags = suggestedTags.filter(function(tag) {return !existingTagIds.includes(tag.id)});
            payload.suggestedTags = suggestedTags;
            // payload = Object.assign({suggestedTags: suggestedTags}, payload);   
            this.props.updateNewQuestionDetails(payload);
        });
    }

    addNewTag = (index) => {
        let payload = {...this.props.newQuestionDetails};
        let tags = [...payload.tags];
        let suggestedTags = [...this.props.newQuestionDetails.suggestedTags];
        tags.push(suggestedTags[index]);
        let tagId = suggestedTags[index].id;
        suggestedTags = suggestedTags.filter(function(tag) { return tag.id !== tagId});
        payload.tags = tags;
        payload.isSearchingForTagActive = false;
        payload.suggestedTags = suggestedTags;
        this.props.updateNewQuestionDetails(payload);
    }

    removeTag = (tagId) => {
        let payload = {...this.props.newQuestionDetails};
        let tags = [...payload.tags];
        let suggestedTags = [...payload.suggestedTags];
        suggestedTags.push(tags.filter(function(tag) {return tag.id === tagId})[0]);
        tags = tags.filter(function(tag) {return tag.id !== tagId});
        payload.tags = tags;
        payload.suggestedTags = suggestedTags;
        this.props.updateNewQuestionDetails(payload);
    }

    showSuggestedTags = () => {
        if (this.props.newQuestionDetails.isSearchingForTagActive === false) {
            return;
        }
        let response = [];
        let suggestedTags = [...this.props.newQuestionDetails.suggestedTags];
        for(let index=0; index<suggestedTags.length; index++) {
            response.push(
                <div className={generalTextSize + " py-1 border border-slate-200 hover:bg-gray-50 w-full"}  onClick={()=>this.addNewTag(index)} >
                    <b>+ </b>
                    {suggestedTags[index].tagName}
                </div>
            );
        }
        response.push(
            <button className={" my-1 transition-colors rounded border border-gray-300 py-2 bg-white text-gray-700 hover:bg-gray-50 " + generalTextSize + " focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"}
                onClick={() => window.open(currentURLHost + 'tags/new')}>
                <p className={generalTextSize + " px-2 ..."}>
                    Request New Tag
                </p>
            </button>
        );
        return response;
    }

    getTagFlexScrollableHeightCSSClass = () => {
        let numberOfSuggestedTags = this.props.newQuestionDetails.suggestedTags.length;
        if (numberOfSuggestedTags === 0) {
            return "h-20";
        }
        else if (numberOfSuggestedTags <= 1 ) {
            return "h-40";
        }
        else if (numberOfSuggestedTags <=3 ) {
            return "h-60";
        }
        return "h-72";
    }

    showSelectedTags = () => {
        let response = [];
        for (let i = 0; i < 5; i++) {
            response.push([]);
        }
        for(let index=0;index<5;index++){
           response[index].push(
                <div>
                    {this.props.newQuestionDetails.tagPrefixPairMap[index].prefix}
                </div>
            )
        }
        if(this.props.newQuestionDetails.tags.length === 0) {
            return <div className={smallerTextSize + " text-danger-500 text-justify"}>
                No tags selected. Please add atleast one subject name
            </div>
        }
        this.props.newQuestionDetails.tags.forEach(element => {
            for(let index=0;index<5;index++){
                if(element.tagName.startsWith(this.props.newQuestionDetails.tagPrefixPairMap[index]["prefix"])){
                    let prefixLength= this.props.newQuestionDetails.tagPrefixPairMap[index]["prefix"].length;
                    response[index].push(
                        <div className="flex flex-row ...">
                            <div className="py-2 ">{JSXUtils.getTagViewJSX(element.tagName.substr(prefixLength))}</div>
                            <div className="px-1 pr-3" onClick={()=>this.removeTag(element.id)}>
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
                        <div  className='py-2'>
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

    getTagDetailsJSX = (fixedIndex) => {
        let triggerContent =  <div className={'flex flex-row w-full border px-3 py-2'}>
            <div className={ generalTextSize + " w-full "}>
                {this.props.newQuestionDetails.tagPrefixPairMap[fixedIndex].inputPlaceholder}
            </div>
            <div className='flex justify-end'>
                <AiOutlineDownSquare size={25}/>
            </div>
        </div>

        let content = <div className='flex w-full ...'>
                <div className='flex flex-col w-full px-20'>
                    <div>
                        <input
                            type="text"  
                            className = { searchBoxInputCSS + "w-full focus:outline-none rounded py-2 px-2 border"}
                            placeholder="Search here ..."
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

    updateTagPrefix = (event) => {
        let payload = {...this.props.newQuestionDetails};
        payload.nonMandatoryTagPrefix = event.target.value;
        this.props.updateNewQuestionDetails(payload);
    }

    updateTagDetails = (event, tagPrefix) => {
        let payload = {...this.props.newQuestionDetails};
        payload.tagPlaceholder = event.target.value;
        payload.tagPrefix= tagPrefix; // (updating redux here in case of by defualt tag prefix value as)
        // if(payload.tagPrefix == "Subject : "){
        //     payload.tagPrefix ="Topic : ";
        //     tagPrefix ="Topic : ";
        // }
        this.props.updateNewQuestionDetails(payload);
        let prefixValue=(tagPrefix+event.target.value);
        TagReceiver.getSuggestedTags((prefixValue)).then(tagData=>{
            let payload = {...this.props.newQuestionDetails};
            let suggestedTags = [...tagData.data];
            payload.suggestedTags = suggestedTags;
            this.props.updateNewQuestionDetails(payload);
        });
    }

    showMandatorySuggestedTags = () =>{
        console.log("djjjjjjjjjj")
        if (this.props.newQuestionDetails.tagPrefix=="Subject : ") {
            return this.showSuggestedTag("Subject : ");
        }
        return <div/>
    }

    showNonMandatorySuggestedTags = () => {
        if (!(this.props.newQuestionDetails.tagPrefix=="Subject : ")) {
            return this.showSuggestedTag(this.props.newQuestionDetails.nonMandatoryTagPrefix);
        }
        return <div/>
    }

    showSuggestedTag = (tagPrefix ) => {
        let response = [];
        let suggestedTags=this.props.newQuestionDetails.suggestedTags;
        // if(mandatory == false) tagPrefix
        for(let index=0; index<suggestedTags.length; index++) {
            if(suggestedTags[index].tagName.startsWith(tagPrefix)){
                response.push(
                    <div className={generalTextSize + " py-1 border-l border-t border-r hover:bg-gray-50 w-full "}  onClick={()=>this.addNewTag(index)} >
                        <div className='flex flex-row w-full'>
                            <div className='px-2 w-full'>{suggestedTags[index].tagName}</div>
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
    isASelectedTag = (tagId) => {
        let selectedTags=[...this.props.generalInfo.selectedTags];
        for(let index=0;index<selectedTags.length;index++){
            if(selectedTags[index].id == tagId){
                return true;
            }
        }
        return false;
    }

    render() {
        if(this.props.newQuestionDetails === undefined || this.props.newQuestionDetails.suggestedTags === undefined) {
            if(this.props.newQuestionDetails.hasTagDetailsBeenInitialized !== true) {
                this.initializeTagDetails();
            }
            return <div/>;
        }
        return (
            <div className="flex flex-row placeholder:w-full pb-2">
                <div className='w-1/2 flex-col'>
                <div className='py-2'>
                        <div className='py-1 bg-slate-100 text-justify px-6 rounded w-fit'>
                            Mandatory Tags
                        </div>
                    </div>
                    <div className='flex flex-row'>
                        <div className='px-2 md:px-6'>
                            Subject :
                        </div>
                        <div className='flex flex-col'>
                            <div>
                                <input
                                    type="text"  
                                    className = { searchBoxInputCSS + smallerTextSize + " w-full focus:outline-none rounded py-1 px-2 border"}
                                    placeholder="Search here ..."
                                    // value = {this.props.newChannelDetails.channelName}  
                                    onChange = {(event) => this.updateTagDetails(event, "Subject : ")}  
                                />
                            </div>
                            {this.showMandatorySuggestedTags()}
                        </div>
                    </div>
                    <div className='py-2'>
                        <div className='py-1 bg-slate-100 text-justify px-6 rounded w-fit'>
                            Non Mandatory Tags
                        </div>
                    </div>
                    <div className='flex flex-row'>
                        <div className='px-1 md:pl-6 md:px-1 py-1'>
                            <select className={generalTextSize + " w-full border bg-white rounded px-1 py-1 outline-none w-fit"}
                                // value={this.props.newTagDetails.tagPrefix}
                                onChange={(event => this.updateTagPrefix(event))}
                            >
                                <option  value="Topic : " className={generalTextSize + " px-1 "}> Topic </option>
                                <option  value="Created By : " className={generalTextSize + " px-1 "}> Author </option>
                                <option  value="Exam Name : " className={generalTextSize + " px-1 "}> Exam </option>
                            </select>
                        </div>
                        <div className='flex flex-col py-1'>
                            <div>
                                <input
                                    type="text"  
                                    className = { searchBoxInputCSS + smallerTextSize + " w-full rounded py-1 px-2 border"}
                                    placeholder="Search here ..."
                                    onChange = {(event) => this.updateTagDetails(event, this.props.newQuestionDetails.nonMandatoryTagPrefix)}  
                                />
                            </div>
                            {this.showNonMandatorySuggestedTags()}
                        </div>
                    </div>
                    {/* {this.getTagDetailsJSX(0)}
                    {this.getTagDetailsJSX(1)}
                    {this.getTagDetailsJSX(2)}
                    {this.getTagDetailsJSX(3)}
                    {this.getTagDetailsJSX(4)} */}
                </div>
                <div className='px-2 py-2 md:px-6 md:py-4 w-full h-full rounded-xl'>
                    <div className='flex-col px-4 py-1 md:px-6 md:py-4  w-1/2 bg-slate-100 w-full h-full rounded-xl'>
                        <div className={'text-justify font-bold ' + smallerTextSize + " text-primary-500"}>
                            Mapped Tags
                        </div>
                        {this.showSelectedTags()}
                    </div>
                </div>
            </div> 
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewQuestionTagComponent);
