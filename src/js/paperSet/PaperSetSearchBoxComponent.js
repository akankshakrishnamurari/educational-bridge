import React from 'react';
import { connect } from 'react-redux';
import {savePaperSet} from '../../store/actions/solgressAction';
import PaperAPIsConnector from '../../apis/PaperAPIsConnector';
import TagReceiver from '../../apis/TagReceiver';
import ChannelReceiver from '../../apis/ChannelReceiver';
import {searchBoxCSS, buttonBesideSearchBoxCSS, searchSuggestionTextSize, generalTextSize} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';

const mapDispatchToProps = dispatch => ({
    savePaperSet: (payload) => dispatch(savePaperSet(payload))
})


const mapStateToProps = state => {
    return {
        paperSet: state.solgressReducer.paperSet
    };
}

class PaperSetSearchBoxComponent extends React.Component {

    updateSearchedTagKey = (event) => {
        let payload = {...this.props.paperSet};
        payload.isTagSearchActive = true;
        payload.isChannelSearchActive = false;
        this.props.savePaperSet(payload);
        TagReceiver.getSuggestedTags(event.target.value).then(tagData=>{
            let payload = {...this.props.paperSet};

            let suggestedTags = [...tagData.data];
            let existingTagIds = [];
            for(let i=0; i<payload.tags.length; i++) {
                existingTagIds.push(payload.tags[i].id);
            }
            suggestedTags = suggestedTags.filter(function(tag) {return !existingTagIds.includes(tag.id)});
            payload.suggestedTags = suggestedTags; 
            this.props.savePaperSet(payload);
        });
    }

    addNewTag = (index) => {
        let payload = {...this.props.paperSet};
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
        this.props.paperSet.channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        PaperAPIsConnector.getAllFilteredPapers(this.props.paperSet.searchedKey,tagIds, channelIds).then(papersData=>{
            payload.papers = papersData.data;
            this.props.savePaperSet(payload);
        });
    }

    showSuggestedTags = () => {
        if(this.props.paperSet.isTagSearchActive===false) {
            return <div/>;
        }
        let response = [];
        let suggestedTags = [...this.props.paperSet.suggestedTags];
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
        let payload = {...this.props.paperSet};
        payload.isChannelSearchActive = true;
        this.props.savePaperSet(payload);
        ChannelReceiver.getSuggestedChannels(event.target.value).then(channelData=>{
            let payload = {...this.props.paperSet};

            let suggestedChannels = [...channelData.data];
            let existingChannelIds = [];
            for(let i=0; i<payload.channels.length; i++) {
                existingChannelIds.push(payload.channels[i].id);
            }
            suggestedChannels = suggestedChannels.filter(function(channel) {return !existingChannelIds.includes(channel.id)});
            payload.suggestedChannels = suggestedChannels;
            // payload = Object.assign({suggestedChannels: suggestedChannels}, payload);   
            this.props.savePaperSet(payload);
        });
    }

    addNewChannel = (index) => {
        let payload = {...this.props.paperSet};
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
        this.props.paperSet.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        PaperAPIsConnector.getAllFilteredPapers(this.props.paperSet.searchedKey, tagIds, channelIds).then(papersData=>{
            payload.papers = papersData.data;
            this.props.savePaperSet(payload);
        });
    }

    showSuggestedChannels = () => {
        if(this.props.paperSet.isChannelSearchActive===false) {
            return <div/>;
        }
        let response = [];
        let suggestedChannels = [...this.props.paperSet.suggestedChannels];
        for(let index=0; index<suggestedChannels.length; index++) {
            response.push(
                        <div className={generalTextSize + " py-1 border border-slate-200 hover:bg-gray-50 w-full"}  onClick={()=>this.addNewChannel(index)} >
                            <b>+ </b>
                            {suggestedChannels[index].channelName}
                        </div>
            );
        }
        return response;
    }

    deactivateSearch = () => {
        let payload = {...this.props.paperSet};
        payload.isChannelSearchActive = false;
        payload.isTagSearchActive = false;
        this.props.savePaperSet(payload);
    }

    activateSearch = () => {
        if(this.props.paperSet.searchCriteria === 'SEARCH_AND_ADD_TAGS') {
            this.activateTagSearch();
        }
        else if(this.props.paperSet.searchCriteria === 'SEARCH_AND_ADD_CHANNELS') {
            this.activateChannelSearch();
        }
    }

    activateTagSearch = () => {
        let payload = {...this.props.paperSet};
        payload.isTagSearchActive = true;
        payload.isChannelSearchActive = false;
        this.props.savePaperSet(payload);
    }

    activateChannelSearch = () => {
        let payload = {...this.props.paperSet};
        payload.isChannelSearchActive = true;
        payload.isTagSearchActive = false;
        this.props.savePaperSet(payload);
    }

    updatePaperSearchedKey = (searchedKey) => {
        let tagIds = [];
        this.props.paperSet.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        let channelIds = [];
        this.props.paperSet.channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        PaperAPIsConnector.getAllFilteredPapers(searchedKey, tagIds, channelIds).then(papersData => {
            let payload = {...this.props.paperSet};
            payload.papers = papersData.data;
            payload.searchedKey = searchedKey;
            this.props.savePaperSet(payload);
        });
    }

    showSearchSuggestions = () => {
        if(this.props.paperSet.isTagSearchActive === true) {
            return this.showSuggestedTags();
        } 
        else if(this.props.paperSet.isChannelSearchActive === true) {
            return this.showSuggestedChannels();
        }
    }

    updateSearchedKey = (event) => {
        if(this.props.paperSet.searchCriteria === 'SEARCH_BY_PAPER_NAME') {
            this.updatePaperSearchedKey(event.target.value);
        } 
        else if(this.props.paperSet.searchCriteria === 'SEARCH_AND_ADD_TAGS') {
            this.updateSearchedTagKey(event);
        }
        else if(this.props.paperSet.searchCriteria === 'SEARCH_AND_ADD_CHANNELS') {
            // this.updateQuestionSearchedKey(event);
        }
    }

    updateSearchCriteria = (event) => {
        let payload = {...this.props.paperSet};
        payload.searchCriteria = event.target.value;
        this.props.savePaperSet(payload);
        this.updatePaperSearchedKey("");
    }

    getSearchBoxJSX = () => {
        return <div class="w-full flex flex-col sm:flex-row flex-nowrap sm:flex-wrap xl:flex-nowrap justify-center items-center py-1 lg:py-2 px-1 lg:px-5">
            <div>
                <select className={generalTextSize + " border bg-white rounded py-2 outline-none "}
                    value={this.props.paperSet.searchCriteria}
                    onChange={(event => this.updateSearchCriteria(event))}
                >
                    <option className={"py-1 " + generalTextSize } value="SEARCH_BY_PAPER_NAME">Search By Paper Name</option>
                    <option className={"py-1 " + generalTextSize } value="SEARCH_AND_ADD_TAGS">Add Tags Filter</option>
                    {/* <option className="py-1 text-xs lg:text-sm xl:text-md" value="SEARCH_AND_ADD_CHANNELS" disabled>Filter By Channels</option> */}
                </select>
            </div>
            <div className='flex flex-col relative sm:w-8/12 md:w-9/12 xl:w-7/12 2xl:6/12'
                onMouseLeave={()=>this.deactivateSearch()} onMouseEnter={()=>this.activateSearch()}
            >
                {/* <input 
                    type="text" 
                    className = {searchBoxCSS}
                    placeholder="Search here ..."
                    onChange={(event)=>this.updateSearchedKey(event)}
                /> */}
                <div className='w-full'>
                    <div className='flex absolute flex-col w-full bg-gray-100'>
                        {this.showSearchSuggestions()}
                    </div>
                </div>
            </div>
            <div>
                <button className={buttonBesideSearchBoxCSS}
                    onClick={() => window.location.href = currentURLHost + 'paper/new'}
                >
                    <p className={generalTextSize + " font-semi-bold ..."}>
                        Add new Paper
                    </p>
                </button>
            </div>
        </div>;
    }

    render() {
        return <div className = "w-full">
            {/* <div className="bg-gray-50">
                <div className="flex flex-col items-center pt-4 ">
                    <div className="flex flex-row ...">
                        <div>
                            <h4 className="px-5  py-2 text-base leading-tight text-gray-800 ">
                                Tag:
                            </h4>
                        </div>
                        <div class=" flex justify-center items-center pr-4 pb-5">
                            <div class="relative" onMouseLeave={()=>this.deactivateSearch()} onMouseEnter={()=>this.activateTagSearch()}>
                                <input 
                                    type="text" 
                                    class="resize  bg-gray-200 h-10 w-full pr-8 pl-3 rounded z-0 focus:shadow focus:outline-none" 
                                    placeholder="Search and add channels..."
                                    onChange={(event)=>this.updateSearchedTagKey(event)}
                                />
                                <div className='absolute w-full z-30 bg-white border boarder-black'>
                                    {this.showSuggestedTags()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50">
                <div className="flex flex-col items-center pt-4 ">
                    <div className="flex flex-row ...">
                        <div>
                            <h4 className="px-6  py-2 text-base leading-tight text-gray-800 ">
                                Channel:
                            </h4>
                        </div>
                        <div class=" flex justify-center items-center pr-4 pb-5">
                            <div class="relative" onMouseLeave={()=>this.deactivateSearch()} onMouseEnter={()=>this.activateChannelSearch()}>
                                <input 
                                    type="text" 
                                    class="resize  bg-gray-200 h-10 w-full pr-8 pl-3 rounded z-0 focus:shadow focus:outline-none" 
                                    placeholder="Search channels..."
                                    onChange={(event)=>this.updateSearchedChannelKey(event)}
                                />
                                <div className='absolute w-full z-40 bg-white border boarder-black'>
                                    {this.showSuggestedChannels()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
            {this.getSearchBoxJSX()}
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperSetSearchBoxComponent);
