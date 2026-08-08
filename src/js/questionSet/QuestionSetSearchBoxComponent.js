import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet} from '../../store/actions/solgressAction';
import QuestionsReceiver from "../../apis/QuestionsReceiver";
import TagReceiver from '../../apis/TagReceiver';
import ChannelReceiver from '../../apis/ChannelReceiver';
import {searchBoxCSS, buttonBesideSearchBoxCSS, searchSuggestionTextSize, generalTextSize} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';
import TagFilterViewLarge from './TagFilter/TagFilterViewLarge';

const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet
    };
}

class QuestionSetSearchBoxComponent extends React.Component {

    updateSearchedTagKey = (event) => {
        let payload = {...this.props.questionSet};
        payload.isTagSearchActive = true;
        payload.isChannelSearchActive = false;
        this.props.saveQuestionSet(payload);
        TagReceiver.getSuggestedTags(event.target.value).then(tagData=>{
            let payload = {...this.props.questionSet};

            let suggestedTags = [...tagData.data];
            let existingTagIds = [];
            for(let i=0; i<payload.tags.length; i++) {
                existingTagIds.push(payload.tags[i].id);
            }
            suggestedTags = suggestedTags.filter(function(tag) {return !existingTagIds.includes(tag.id)});
            payload.suggestedTags = suggestedTags; 
            this.props.saveQuestionSet(payload);
        });
    }

    addNewTag = (index) => {
        let payload = {...this.props.questionSet};
        let tags = [...payload.tags];
        let suggestedTags = [...payload.suggestedTags];
        tags.push(suggestedTags[index]);
        let tagId = suggestedTags[index].id;
        suggestedTags = suggestedTags.filter(function(tag) { return tag.id !== tagId});
        payload.tags = tags;
        payload.suggestedTags = suggestedTags;
        payload.isTagSearchActive = false;
        let tagIds = [];
        tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        let channelIds = [];
        this.props.questionSet.channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey,tagIds, channelIds).then(questionsData=>{
            payload.questions = questionsData.data;
            this.props.saveQuestionSet(payload);
        });
    }

    showSuggestedTags = () => {
        if(this.props.questionSet.isTagSearchActive===false) {
            return <div/>;
        }
        let response = [];
        let suggestedTags = [...this.props.questionSet.suggestedTags];
        for(let index=0; index<suggestedTags.length; index++) {
            response.push(
                        <div className= {searchSuggestionTextSize + "z-50 py-1 border border-slate-200 hover:bg-gray-50 w-full"}  onClick={()=>this.addNewTag(index)} >
                            <b>+ </b>
                            {suggestedTags[index].tagName}
                        </div>
            );
        }
        return response;
    }

    updateSearchedChannelKey = (event) => {
        let payload = {...this.props.questionSet};
        payload.isChannelSearchActive = true;
        this.props.saveQuestionSet(payload);
        ChannelReceiver.getSuggestedChannels(event.target.value).then(channelData=>{
            let payload = {...this.props.questionSet};

            let suggestedChannels = [...channelData.data];
            let existingChannelIds = [];
            for(let i=0; i<payload.channels.length; i++) {
                existingChannelIds.push(payload.channels[i].id);
            }
            suggestedChannels = suggestedChannels.filter(function(channel) {return !existingChannelIds.includes(channel.id)});
            payload.suggestedChannels = suggestedChannels;
            // payload = Object.assign({suggestedChannels: suggestedChannels}, payload);   
            this.props.saveQuestionSet(payload);
        });
    }

    addNewChannel = (index) => {
        let payload = {...this.props.questionSet};
        let channels = [...payload.channels];
        let suggestedChannels = [...payload.suggestedChannels];
        channels.push(suggestedChannels[index]);
        let channelId = suggestedChannels[index].id;
        suggestedChannels = suggestedChannels.filter(function(channel) { return channel.id !== channelId});
        payload.channels = channels;
        payload.suggestedChannels = suggestedChannels;
        payload.isChannelSearchActive = false;
        let channelIds = [];
        channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        let tagIds = [];
        this.props.questionSet.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        QuestionsReceiver.getAllFilteredQuestions(this.props.questionSet.searchedKey, tagIds, channelIds).then(questionsData=>{
            payload.questions = questionsData.data;
            this.props.saveQuestionSet(payload);
        });
    }

    showSuggestedChannels = () => {
        if(this.props.questionSet.isChannelSearchActive===false) {
            return <div/>;
        }
        let response = [];
        let suggestedChannels = [...this.props.questionSet.suggestedChannels];
        for(let index=0; index<suggestedChannels.length; index++) {
            response.push(
                        <div className="text-xl py-1 border border-slate-200 hover:bg-gray-50 w-full"  onClick={()=>this.addNewChannel(index)} >
                            <b>+ </b>
                            {suggestedChannels[index].channelName}
                        </div>
            );
        }
        return response;
    }

    deactivateSearch = () => {
        let payload = {...this.props.questionSet};
        payload.isChannelSearchActive = false;
        payload.isTagSearchActive = false;
        this.props.saveQuestionSet(payload);
    }

    activateSearch = () => {
        if(this.props.questionSet.searchCriteria === 'SEARCH_AND_ADD_TAGS') {
            this.activateTagSearch();
        }
        else if(this.props.questionSet.searchCriteria === 'SEARCH_AND_ADD_CHANNELS') {
            this.activateChannelSearch();
        }
    }

    activateTagSearch = () => {
        let payload = {...this.props.questionSet};
        payload.isTagSearchActive = true;
        payload.isChannelSearchActive = false;
        this.props.saveQuestionSet(payload);
    }

    activateChannelSearch = () => {
        let payload = {...this.props.questionSet};
        payload.isChannelSearchActive = true;
        payload.isTagSearchActive = false;
        this.props.saveQuestionSet(payload);
    }

    updateQuestionSearchedKey = (searchedKey) => {
        let tagIds = [];
        this.props.questionSet.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        let channelIds = [];
        QuestionsReceiver.getAllFilteredQuestions(searchedKey, tagIds, channelIds).then(questionsData=>{
            let payload = {...this.props.questionSet};
            payload.questions = questionsData.data;
            payload.searchedKey = searchedKey;
            this.props.saveQuestionSet(payload);
        });
    }

    showSearchSuggestions = () => {
        if(this.props.questionSet.isTagSearchActive === true) {
            return this.showSuggestedTags();
        } 
        else if(this.props.questionSet.isChannelSearchActive === true) {
            return this.showSuggestedChannels();
        }
    }

    updateSearchedKey = (event) => {
         if(this.props.questionSet.searchCriteria === 'SEARCH_AND_ADD_TAGS') {
            this.updateSearchedTagKey(event);
        }
        else {
            this.updateQuestionSearchedKey(event.target.value);
        } 
    }

    updateSearchCriteria = (event) => {
        let payload = {...this.props.questionSet};
        payload.searchCriteria = event.target.value;
        this.props.saveQuestionSet(payload);
        this.updateQuestionSearchedKey("");
    }

    getSearchBoxJSX = () => {
        return <div class=" px-w-full flex flex-col sm:flex-row flex-nowrap sm:flex-wrap xl:flex-nowrap justify-center items-center py-1 lg:py-2 px-1 lg:px-5">
            <div className='flex flex-col relative sm:w-8/12 md:w-9/12 xl:w-7/12 2xl:6/12 px-3'
                onMouseLeave={()=>this.deactivateSearch()} onMouseEnter={()=>this.activateSearch()}
            >
                <input 
                    type="text" 
                    className = {searchBoxCSS + " px-4"}
                    placeholder="Search here ..."
                    onChange={(event)=>this.updateSearchedKey(event)}
                />
                <div className='w-full'>
                    <div className='flex absolute flex-col w-full bg-gray-100'>
                        {this.showSearchSuggestions()}
                    </div>
                </div>
            </div>
            <div>
                <button className={buttonBesideSearchBoxCSS}
                    onClick={() => window.location.href = currentURLHost + 'question/upsert'}
                >
                    <p className={generalTextSize + " font-semi-bold ..."}>
                        Add New Question
                    </p>
                </button>
            </div>
        </div>;
    }

    getTagButton = (tagName, tagPrefix) => {
        return <div className='pr-3'>
            <select className={generalTextSize + " border bg-white rounded py-2 outline-none px-3"}
            // value={this.props.paperSet.searchCriteria}
            onChange={(event => this.updateSearchCriteria(event))}
        >
            <input></input>
            <option className={"py-1 " + generalTextSize } value={tagName}>{tagName}</option>
            {/* <option className="py-1 text-xs lg:text-sm xl:text-md" value="SEARCH_AND_ADD_CHANNELS" disabled>Filter By Channels</option> */}
        </select>
        </div>
    }

    render() {
        return <div className = "w-full x">
            {this.getSearchBoxJSX()}
            <TagFilterViewLarge/>
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionSetSearchBoxComponent);
