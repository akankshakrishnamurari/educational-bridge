import React from 'react';
import { connect } from 'react-redux';
import {updateChannelDetails} from '../../store/actions/solgressAction';
import ChannelReceiver from '../../apis/ChannelReceiver';
import {currentURLHost} from './../../constants/hostConfig';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Footer from '../../components/common/Footer';
import ClipLoader from "react-spinners/ClipLoader";
import { typography, layout } from '../../constants/designTokens';
import { accent } from '../../constants/accents';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import { AiOutlineSearch } from "react-icons/ai";

// Channel directory.
//
// THE PAGE DID NOT BROWSE ANYTHING
// --------------------------------
// `getAllChannelsSummary()` loaded every channel on mount, but the list was
// rendered by `getSuggestedChannelsJSX()` which returned early unless
// `isChannelSearchActive === true` -- and mount set that flag to false. So the
// browse page showed an empty box, and the only way to see a channel was to hover
// the search field, which also made it unreachable on touch. Selecting one then
// replaced the list with a card containing just the channel's name.
//
// It is now a directory: every channel visible immediately, filtered in place by a
// real (typed, not hovered) search, each one linking straight to its questions.
//
// WHAT THE DATA SUPPORTS
// ----------------------
// `/channels/summary` returns ONLY `{ id, channelName }` -- ChannelService's
// builder sets nothing else. No description, no question count, no creator. So no
// counts are shown, because there are none to show. The accent stripe is derived
// from the channel name so the grid is scannable and channels stay visually
// recognisable between visits, which is the most differentiation the payload
// allows honestly.

// Deterministic accent per channel. Written as a fixed list because Tailwind
// resolves classes by scanning source text, so the keys must appear literally.
const ACCENT_KEYS = ['primary', 'success', 'warning', 'danger', 'gray'];

const accentForName = (name) => {
    if (typeof name !== 'string' || name.length === 0) {
        return ACCENT_KEYS[0];
    }
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) % 100000;
    }
    return ACCENT_KEYS[hash % ACCENT_KEYS.length];
};

const initialsFor = (name) => {
    if (typeof name !== 'string' || name.trim().length === 0) {
        return '?';
    }
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
};

class ChannelHome extends React.Component {

    constructor(props) {
        super(props)
        this.state = { query: '', hasRequested: false };
    }

    componentDidMount() {
        this.initializeChannelDetails();
    }

    initializeChannelDetails = () => {
        if (this.state.hasRequested) {
            return;
        }
        this.setState({ hasRequested: true });
        ChannelReceiver.getAllChannelsSummary().then(channelData=>{
            let payload = {...this.props.channelDetails};
            payload.allChannels = (channelData && Array.isArray(channelData.data)) ? channelData.data : [];
            this.props.updateChannelDetails(payload);
        });
    }

    /**
     * Filtering happens client-side against the already-loaded list.
     *
     * The previous implementation issued a `suggestion/channels` request on every
     * keystroke. The full set is already in memory from mount, so filtering locally
     * is instant and removes a request per character typed.
     */
    getVisibleChannels = () => {
        const all = (this.props.channelDetails && this.props.channelDetails.allChannels) || [];
        const query = this.state.query.trim().toLowerCase();
        if (query.length === 0) {
            return all;
        }
        return all.filter((channel) =>
            typeof channel.channelName === 'string'
            && channel.channelName.toLowerCase().includes(query)
        );
    }

    getSearchJSX = () => {
        const total = ((this.props.channelDetails && this.props.channelDetails.allChannels) || []).length;
        return <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 max-w-md">
                <AiOutlineSearch
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                    type="search"
                    className="bg-white border border-gray-300 h-11 w-full pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder={total > 0 ? 'Search ' + total + ' channels' : 'Search channels'}
                    value={this.state.query}
                    onChange={(event) => this.setState({ query: event.target.value })}
                    aria-label="Search channels"
                />
            </div>
            <Button variant="secondary" onClick={() => { window.location.href = currentURLHost + 'channel/new'; }}>
                Create a channel
            </Button>
        </div>;
    }

    getGridJSX = () => {
        const channels = this.getVisibleChannels();
        const all = (this.props.channelDetails && this.props.channelDetails.allChannels) || [];

        if (all.length === 0) {
            return <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <EmptyState
                    title="No channels yet"
                    description="Channels group questions by course, batch or creator. Create the first one."
                />
                <div className="flex justify-center">
                    <Button variant="primary" onClick={() => { window.location.href = currentURLHost + 'channel/new'; }}>
                        Create a channel
                    </Button>
                </div>
            </div>;
        }

        if (channels.length === 0) {
            return <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <EmptyState
                    title="No channels match that search"
                    description="Try a shorter search term."
                />
            </div>;
        }

        return <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {channels.map((channel) => {
                const tone = accent(accentForName(channel.channelName));
                return <a
                    key={channel.id}
                    href={currentURLHost + 'questions?channel_id=' + channel.id}
                    className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    <span className={'h-1 w-full ' + tone.rail} aria-hidden="true" />
                    <div className="flex items-start gap-3.5 p-4 md:p-5">
                        <span
                            className={['shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold', tone.softBg, tone.softText].join(' ')}
                            aria-hidden="true"
                        >
                            {initialsFor(channel.channelName)}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                                {channel.channelName}
                            </span>
                            <span className="block mt-1.5 text-xs font-medium text-primary-600 inline-flex items-center gap-1">
                                View questions
                                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">&rarr;</span>
                            </span>
                        </span>
                    </div>
                </a>;
            })}
        </div>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.channelDetails === undefined || this.props.channelDetails.allChannels === undefined) {
            return <div className="bg-gray-50 min-h-screen">
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>;
        }
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className={layout.container + ' py-6 md:py-8'}>
                <div className="min-w-0">
                    <h1 className={typography.h1}>Channels</h1>
                    <p className="mt-1 text-sm text-gray-500 max-w-2xl">
                        Channels group questions by course, batch or creator. Open one to practise only its questions.
                    </p>
                    <div className="mt-6">
                        {this.getSearchJSX()}
                    </div>
                    {this.getGridJSX()}
                </div>
            </div>
            <Footer />
        </div>;
    }

}

const mapDispatchToProps = dispatch => ({
    updateChannelDetails: (payload) => dispatch(updateChannelDetails(payload))
})

const mapStateToProps = state => {
    return {
        channelDetails: state.solgressReducer.channelDetails
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelHome);
