import React from 'react';
import { connect } from 'react-redux';
import {updateChannelDetails} from '../../store/actions/solgressAction';
import ChannelReceiver from '../../apis/ChannelReceiver';
import {currentURLHost} from './../../constants/hostConfig';
import EmptyState from '../../components/common/EmptyState';
import PageCard from '../../components/common/Card';
import Button from '../../components/common/Button';
import { typography } from '../../constants/designTokens';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import AdRail from '../../components/common/AdRail';


const mapDispatchToProps = dispatch => ({
    updateChannelDetails: (payload) => dispatch(updateChannelDetails(payload))
})


const mapStateToProps = state => {
    return {
        channelDetails: state.solgressReducer.channelDetails
    };
}


class ChannelHome extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeChannelDetails = this.initializeChannelDetails.bind(this);
    }

    initializeChannelDetails = () => {
        ChannelReceiver.getAllChannelsSummary().then(channelData=>{
            let payload = {...this.props.channelDetails};
            payload.suggestedChannels = channelData.data;
            payload.isChannelSearchActive = false;
            this.props.updateChannelDetails(payload);
        });
    }

    updateSearchedKey = (event) => {
        let searchedKey = event.target.value;
        ChannelReceiver.getSuggestedChannels(searchedKey).then(channelData=>{
            let payload = {...this.props.channelDetails};
            payload.suggestedChannels = channelData.data;
            payload.searchedKey = searchedKey;
            payload.isChannelSearchActive = true;
            this.props.updateChannelDetails(payload);
        });
    }

    updateSelectedChannel = (channelDetail) => {
        let payload = {...this.props.channelDetails};
        payload.selectedChannel = channelDetail;
        payload.isChannelSearchActive =  false;
        this.props.updateChannelDetails(payload);   
    }

    getSuggestedChannelsJSX = () => {
        if(this.props.channelDetails.isChannelSearchActive === false) {
            return;
        }
        let items = [];
        this.props.channelDetails.suggestedChannels.forEach((channelDetail) => {
            items.push(
                <div key={channelDetail.id} className='px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer'
                    onClick={() => this.updateSelectedChannel(channelDetail)}>
                    {channelDetail.channelName}
                </div>
            )
        });
        return items;
    }

    deactivateTagSearch = () => {
        let payload = {...this.props.channelDetails};
        payload.isChannelSearchActive = false;
        this.props.updateChannelDetails(payload);
    }

    activateTagSearch = () => {
        let payload = {...this.props.channelDetails};
        payload.isChannelSearchActive = true;
        this.props.updateChannelDetails(payload);
    }

    createNewChannel = () => {
        window.open(currentURLHost + 'channel/new')
    }

    getChannelSearchBox = () => {
        return <div className='flex flex-row items-center gap-3'>
            <div className="flex-1 min-w-0 max-w-xl">
                {this.getSearchBoxJSX()}
            </div>
            <Button variant="primary" onClick={() => this.createNewChannel()}>
                Create New Channel
            </Button>
        </div>;
    }

    getSearchBoxJSX = () => {
        return <div onMouseLeave={()=>this.deactivateTagSearch()} onMouseEnter={()=>this.activateTagSearch()}>
            <div className="relative w-full">
                <input 
                    type="text" 
                    className="bg-white border border-gray-300 h-11 w-full px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Search channels..."
                    onChange={(event)=>this.updateSearchedKey(event)}
                />
                <div className='absolute w-full z-30 bg-white border border-gray-100 rounded-lg shadow-lg mt-1 overflow-hidden'>
                    {this.getSuggestedChannelsJSX()}
                </div>
            </div>
        </div>; 
    }

    // Compact inline toggle. This used to occupy a whole resizable sidebar pane.
    getHelpSectionEnablingBox = () => {
        return <label className="inline-flex items-center gap-2 h-9 px-3 shrink-0 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
                type="checkbox"
                className="accent-primary-600 w-4 h-4"
                onChange = {(event) => this.updateHelpSectionEnabling(event)}
            />
            Show help
        </label>;
    }

    getChannelNameBox = () => {
        let channelName = 'Select a channel';
        if (this.props.channelDetails.selectedChannel !== undefined && 
            this.props.channelDetails.selectedChannel.channelName !== undefined) {
            channelName = this.props.channelDetails.selectedChannel.channelName;
        }
        return <div className={typography.h1 + " px-6 py-3"}>
            {channelName}
        </div>;
    }

    getChannelDetailHeadersJSX = () => {
        if (this.props.channelDetails.selectedChannel === undefined) {
            return <div/>;
        }
        const tabClass = "px-6 py-3 text-sm font-semibold text-gray-600 hover:text-primary-700 cursor-pointer transition-colors";
        return <div className="flex bg-white border-b border-gray-100 px-2">
            <div className={tabClass}
                onClick={() => window.location.href = currentURLHost + "questions?channel_id="+this.props.channelDetails.selectedChannel.id}>Questions</div>
            <div className={tabClass}
                onClick={() => window.location.href = currentURLHost + "channels"}>Channels</div>
            <div className={tabClass}>Papers</div>
        </div>;
    }

    getChannelDetailsJSXBox = () => {
        if (this.props.channelDetails.selectedChannel === undefined) {
            return (
                <EmptyState
                    title="Select a channel"
                    description="Choose a channel from the list above, or search for one, to see its questions and papers."
                />
            );
        }
        const channel = this.props.channelDetails.selectedChannel;
        return (
            <PageCard className="mx-6">
                <div className={typography.h3}>{channel.channelName}</div>
                {channel.channelDescription &&
                    <div className={typography.caption + ' mt-1'}>{channel.channelDescription}</div>
                }
            </PageCard>
        );
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.channelDetails === undefined) {
            this.initializeChannelDetails();
            return <div/>;
        }
        {/* Was a react-split 20/80 layout whose entire 20% draggable pane held a
            single "Enable Help Section" checkbox, and the page rendered with no
            header at all - so /channels was a navigation dead end. Now on the same
            shell as every other page: header, ad rails pinned to the container
            edges, single content column. */}
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 items-start">
                <AdRail />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <h1 className={typography.h1}>Channels</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Browse questions grouped by channel.
                            </p>
                        </div>
                        {this.getHelpSectionEnablingBox()}
                    </div>
                    <div className="mt-6">
                        {this.getChannelSearchBox()}
                    </div>
                    <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
                        {this.getChannelNameBox()}
                        {this.getChannelDetailHeadersJSX()}
                        {this.getChannelDetailsJSXBox()}
                    </div>
                </div>
                <AdRail />
            </div>
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelHome);
