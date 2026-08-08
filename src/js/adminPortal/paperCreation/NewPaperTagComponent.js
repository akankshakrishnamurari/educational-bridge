import React from 'react';
import TagReceiver from "../../../apis/TagReceiver";
import { connect } from 'react-redux';
import {updateNewPaperDetails, saveQuestionSet} from "../../../store/actions/solgressAction";
import {currentURLHost} from './../../../constants/hostConfig';
import { JSXUtils } from '../../../utils/JSXUtils';
import { generalTextSize } from '../../../constants/TextSizeConstants';

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

class NewPaperTagComponent extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeTagDetails = this.initializeTagDetails.bind(this);
        this.activateTagSearch = this.activateTagSearch.bind(this);
        this.addNewTag = this.addNewTag.bind(this);
    }

    initializeTagDetails = async () => {
        let payload = {...this.props.newPaperDetails};
        payload.hasTagDetailsBeenInitialized = true;
        this.props.updateNewPaperDetails(payload);
        await TagReceiver.getSuggestedTags('').then(tagData=>{
            let suggestedTags = [...tagData.data];
            let existingTagIds = [];
            for(let i=0; i<payload.tags.length; i++) {
                existingTagIds.push(payload.tags[i].id);
            }
            suggestedTags = suggestedTags.filter(function(tag) {return !existingTagIds.includes(tag.id)});
            payload = Object.assign({searchedTagKey: ""}, payload);
            payload = Object.assign({isSearchingForTagActive: false}, payload);
            payload = Object.assign({suggestedTags: suggestedTags}, payload);
            this.props.updateNewPaperDetails(payload);
        });
    }

    activateTagSearch = () => {
        let payload = {...this.props.newPaperDetails};
        if(payload.isSearchingForTagActive) {
            return;
        }
        payload.isSearchingForTagActive = true;
        this.props.updateNewPaperDetails(payload);
    }

    deactivateTagSearch = () => {
        let payload = {...this.props.newPaperDetails};
        payload.isSearchingForTagActive = false;
        this.props.updateNewPaperDetails(payload);
    }

    updateSearchedTagKey = (event) => {
        let payload = {...this.props.newPaperDetails};
        payload.searchedTagKey = event.target.value;
        this.props.updateNewPaperDetails(payload);
        TagReceiver.getSuggestedTags(event.target.value).then(tagData=>{
            let payload = {...this.props.newPaperDetails};

            let suggestedTags = [...tagData.data];
            let existingTagIds = [];
            for(let i=0; i<payload.tags.length; i++) {
                existingTagIds.push(payload.tags[i].id);
            }
            suggestedTags = suggestedTags.filter(function(tag) {return !existingTagIds.includes(tag.id)});
            payload.suggestedTags = suggestedTags;
            // payload = Object.assign({suggestedTags: suggestedTags}, payload);   
            this.props.updateNewPaperDetails(payload);
        });
    }

    addNewTag = (index) => {
        let payload = {...this.props.newPaperDetails};
        let tags = [...payload.tags];
        let suggestedTags = [...this.props.newPaperDetails.suggestedTags];
        tags.push(suggestedTags[index]);
        let tagId = suggestedTags[index].id;
        suggestedTags = suggestedTags.filter(function(tag) { return tag.id !== tagId});
        payload.tags = tags;
        payload.isSearchingForTagActive = false;
        payload.suggestedTags = suggestedTags;
        this.props.updateNewPaperDetails(payload);
    }

    removeTag = (tagId) => {
        let payload = {...this.props.newPaperDetails};
        let tags = [...payload.tags];
        let suggestedTags = [...payload.suggestedTags];
        suggestedTags.push(tags.filter(function(tag) {return tag.id === tagId})[0]);
        tags = tags.filter(function(tag) {return tag.id !== tagId});
        payload.tags = tags;
        payload.suggestedTags = suggestedTags;
        this.props.updateNewPaperDetails(payload);
    }

    showSuggestedTags = () => {
        if (this.props.newPaperDetails.isSearchingForTagActive === false) {
            return;
        }
        let response = [];
        let suggestedTags = [...this.props.newPaperDetails.suggestedTags];
        for(let index=0; index<suggestedTags.length; index++) {
            response.push(
                <div className={generalTextSize + " py-1 border bg-slate-100 hover:bg-gray-50 w-full z-50"}  onClick={()=>this.addNewTag(index)} >
                    <b>+ </b>
                    {suggestedTags[index].tagName}
                </div>
            );
        }
        response.push(
            <button className={" my-1 transition-colors rounded border border-gray-300 py-2 bg-white text-gray-700 hover:bg-gray-50 " + generalTextSize  + " focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"}
                onClick={() => window.open(currentURLHost + 'tags/new')}>
                <p className={generalTextSize + " px-2 ..."}>
                    Request New Tag
                </p>
            </button>
        );
        return response;
    }

    getTagFlexScrollableHeightCSSClass = () => {
        let numberOfSuggestedTags = this.props.newPaperDetails.suggestedTags.length;
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
        if(this.props.newPaperDetails.tags.length === 0) {
            return;
        }
        response.push(<div>
            <div className={"px-6  py-2 " + generalTextSize + " leading-tight text-gray-800 "}>
                Applied Tags :
            </div>
        </div>
        );
        this.props.newPaperDetails.tags.forEach(element => {
            response.push(
                <div className="flex flex-row ...">
                    <div className="py-2 ">{JSXUtils.getTagViewJSX(element.tagName)}</div>
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
        });
        return response;
    }

    render() {
        if(this.props.newPaperDetails === undefined || this.props.newPaperDetails.suggestedTags === undefined) {
            if(this.props.newPaperDetails.hasTagDetailsBeenInitialized !== true) {
                this.initializeTagDetails();
            }
            return <div/>;
        }
        return (
            <div className="w-full pb-2">
                <div className="flex flex-row ...">
                    {this.showSelectedTags()}
                </div>
                {/* <div className="bg-gray-50">
                    <div className="flex flex-col pt-4 ">
                        <div className="flex flex-row ...">
                            <div>
                                <p className="px-6  py-2 text-base leading-tight text-gray-800 ">
                                    Tags:
                                </p>
                            </div>
                            <div class=" flex justify-center items-center">
                                <div class="relative" onMouseLeave={()=>this.deactivateTagSearch()} onMouseEnter={()=>this.activateTagSearch()}>
                                    <input 
                                        type="text" 
                                        class="resize  bg-gray-200 h-10 w-full pr-8 pl-5 rounded z-0 focus:shadow focus:outline-none" 
                                        placeholder="Search and add tags..."
                                        onChange={(event)=>this.updateSearchedTagKey(event)}
                                    />
                                    <div className='absolute w-full z-50 bg-white border boarder-black'>
                                        {this.showSuggestedTags()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}
                <div className="flex flex-col pt-2 ">
                    <div className="flex lg:flex-row justify-start">
                        <div className='px-5'>
                            <p className={generalTextSize + " py-3 leading-tight text-gray-800 "}>
                                Tags :
                            </p>
                        </div>
                        <div class="w-full md:w-4/12" onMouseLeave={()=>this.deactivateTagSearch()} onMouseEnter={()=>this.activateTagSearch()}>
                            <input 
                                type="text" 
                                class=" bg-white h-10 w-full pr-8 pl-5 rounded z-0 focus:shadow focus:outline-none border border-slate-300" 
                                placeholder="Search and add tags..."
                                value = {
                                        this.props.newPaperDetails.searchedTagKey
                                }
                                onChange={(event)=>this.updateSearchedTagKey(event)}
                                onClick = {this.activateTagSearch}
                            />
                                {this.showSuggestedTags()}
                        </div>
                    </div>
                </div>
            </div> 
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewPaperTagComponent);
