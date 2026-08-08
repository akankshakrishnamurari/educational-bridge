import React from 'react';
import { connect } from 'react-redux';
import {updateNewQuestionDetails} from '../../../store/actions/solgressAction';
import ChannelReceiver from "../../../apis/ChannelReceiver";
import {currentURLHost} from './../../../constants/hostConfig';


const mapDispatchToProps = dispatch => ({
    updateNewQuestionDetails: (payload) => dispatch(updateNewQuestionDetails(payload))
})


const mapStateToProps = state => {
    return {
        newQuestionDetails: state.solgressReducer.newQuestionDetails
    };
}

class NewQuestionChannelComponent extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeChannelDetails = this.initializeChannelDetails.bind(this);
        this.activateChannelSearch = this.activateChannelSearch.bind(this);
        this.addNewChannel = this.addNewChannel.bind(this);
    }

    initializeChannelDetails = () => {
        let payload = {...this.props.newQuestionDetails};
        payload.hasChannelDetailsBeenInitialized = true;
        this.props.updateNewQuestionDetails(payload);
        ChannelReceiver.getSuggestedChannels('').then(channelData=>{
            let suggestedChannels = [...channelData.data];
            let existingChannelIds = [];
            for(let i=0; i<payload.channels.length; i++) {
                existingChannelIds.push(payload.channels[i].id);
            }
            suggestedChannels = suggestedChannels.filter(function(channel) {return !existingChannelIds.includes(channel.id)});
            payload = Object.assign({searchedChannelKey: ""}, payload);
            payload = Object.assign({isSearchingForChannelActive: false}, payload);
            payload = Object.assign({suggestedChannels: suggestedChannels}, payload);
            this.props.updateNewQuestionDetails(payload);
        });
    }

    activateChannelSearch = () => {
        let payload = {...this.props.newQuestionDetails};
        if(payload.isSearchingForChannelActive) {
            return;
        }
        payload.isSearchingForChannelActive = true;
        this.props.updateNewQuestionDetails(payload);
    }

    deactivateChannelSearch = () => {
        let payload = {...this.props.newQuestionDetails};
        payload.isSearchingForChannelActive = false;
        this.props.updateNewQuestionDetails(payload);
    }

    updateSearchedChannelKey = (event) => {
        let payload = {...this.props.newQuestionDetails};
        payload.searchedChannelKey = event.target.value;
        this.props.updateNewQuestionDetails(payload);
        ChannelReceiver.getSuggestedChannels(event.target.value).then(channelData=>{
            let payload = {...this.props.newQuestionDetails};

            let suggestedChannels = [...channelData.data];
            let existingChannelIds = [];
            for(let i=0; i<payload.channels.length; i++) {
                existingChannelIds.push(payload.channels[i].id);
            }
            suggestedChannels = suggestedChannels.filter(function(channel) {return !existingChannelIds.includes(channel.id)});
            payload.suggestedChannels = suggestedChannels;
            payload.selectedChannel = undefined;
            this.props.updateNewQuestionDetails(payload);
        });
    }

    addNewChannel = (index) => {
        let payload = {...this.props.newQuestionDetails};
        let suggestedChannels = [...this.props.newQuestionDetails.suggestedChannels];
        payload.selectedChannel = suggestedChannels[index];
        payload.searchedChannelKey = payload.selectedChannel.channelName;
        payload.isSearchingForChannelActive = false;
        this.props.updateNewQuestionDetails(payload);
    }

    showSuggestedChannels = () => {
        let response = [];
        let suggestedChannels = [...this.props.newQuestionDetails.suggestedChannels];
        for(let index=0; index<suggestedChannels.length; index++) {
            response.push(
                <div className="text-xl py-1 border border-slate-200 hover:bg-gray-50 w-full"  onClick={()=>this.addNewChannel(index)} >
                    <b>+ </b>
                    {suggestedChannels[index].channelName}
                </div>
            );
        }
        response.push( 
            <button className=" my-1 transition-colors rounded border border-gray-300 py-2 text-xs bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => window.open(currentURLHost + 'channel/new')}
            >
                <p className="text-lg px-2">
                    Create New Channel
                </p>
            </button>
        );
        return response;
    }

    getChannelFlexScrollableHeightCSSClass = () => {
        let numberOfSuggestedChannels = this.props.newQuestionDetails.suggestedChannels.length;
        if (numberOfSuggestedChannels === 0) {
            return "h-20";
        }
        else if (numberOfSuggestedChannels <= 1 ) {
            return "h-40";
        }
        else if (numberOfSuggestedChannels <=3 ) {
            return "h-60";
        }
        return "h-72";
    }

    render() {
        if(this.props.newQuestionDetails === undefined || this.props.newQuestionDetails.suggestedChannels === undefined) {
            if(this.props.newQuestionDetails.hasChannelDetailsBeenInitialized !== true) {
                this.initializeChannelDetails();
            }
            return <div/>;
        }
        return (
            <div className="w-full pb-6">
                <div className="flex flex-col pt-4 ">
                    <div className="flex lg:flex-row justify-start">
                        {/* <div className='w-2/12'>
                            <p className="px-2 py-3 text-base leading-tight text-gray-800 ">
                                Channel :
                            </p>
                        </div> */}
                        {/* <div className="w-6/12" onMouseLeave={()=>this.deactivateChannelSearch()} onMouseEnter={()=>this.activateChannelSearch()}>
                            <input 
                                type="text" 
                                className=" bg-gray-200 h-10 w-full pr-8 pl-5 rounded z-0 focus:shadow focus:outline-none" 
                                placeholder="Search and add channels..."
                                value = {
                                    (this.props.newQuestionDetails.selectedChannel===undefined)
                                        ?this.props.newQuestionDetails.searchedChannelKey
                                        :this.props.newQuestionDetails.selectedChannel.channelName
                                }
                                onChange={(event)=>this.updateSearchedChannelKey(event)}
                                onClick = {this.activateChannelSearch}
                            />
                            {this.props.newQuestionDetails.isSearchingForChannelActive?
                                 this.showSuggestedChannels()
                                :<div/>
                            }
                        </div> */}
                    </div>
                </div>
            </div> 
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewQuestionChannelComponent);
