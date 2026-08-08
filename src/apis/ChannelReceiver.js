import { currentHost } from './../constants/hostConfig';
import { requestJson, postJson } from './httpClient';

// Channel API. Resolves with `{data}` on success, `null` on any failure.

const encode = (value) => encodeURIComponent(value === null || value === undefined ? '' : value);

class ChannelReceiver {

    static getSuggestedChannels = async (channelSearchKey) => requestJson(
        'ChannelReceiver.getSuggestedChannels',
        currentHost + 'suggestion/channels?channel_pattern=' + encode(channelSearchKey)
            + '&start_index=0&page_size=10'
    )

    static getAllChannelsSummary = async () => requestJson(
        'ChannelReceiver.getAllChannelsSummary',
        currentHost + 'channels/summary'
    )

    static getChannelDetails = async (channelId) => requestJson(
        'ChannelReceiver.getChannelDetails',
        currentHost + 'channel?channel_id=' + encode(channelId)
    )

    /**
     * Create or update a channel.
     *
     * The fetch was originally not awaited, so this returned "updated" before the
     * request had been sent and a failed create was indistinguishable from a
     * successful one. Names are URL-encoded because a channel called "Physics &
     * Maths" previously truncated the query string at the ampersand.
     */
    static upsertChannel = async (channelData) => postJson(
        'ChannelReceiver.upsertChannel',
        currentHost + 'channel'
            + '?channel_name=' + encode(channelData && channelData.channelName)
            + '&channel_description=' + encode(channelData && channelData.channelDescription)
    )

}

export default ChannelReceiver;
