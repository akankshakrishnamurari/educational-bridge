import React from 'react';
import {currentHost} from './../constants/hostConfig'

class ChannelReceiver extends React.Component  {

    static getSuggestedChannels = async(channelSearchKey) => {
        try {
            const response = await fetch(
                currentHost + 'suggestion/channels?channel_pattern='+channelSearchKey + '&start_index=0&page_size=10'
            );
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static getAllChannelsSummary = async() => {
        try {
            const response = await fetch(
                currentHost + 'channels/summary'
            );
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static getChannelDetails = async(channelId) => {
        try {
            const response = await fetch(
                currentHost + 'channel?channel_id='+channelId
            );
            let data = await response.json();
            return {data};
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    static upsertChannel = async(channelData) => {
        try {
            // Two fixes here.
            //
            // 1. The fetch was not awaited: the function returned "updated"
            //    immediately, so the caller reported success before the request had
            //    even been sent, and a rejected request produced an unhandled
            //    promise rejection instead of an error. A failed create looked
            //    identical to a successful one.
            // 2. Values were concatenated straight into the query string. A channel
            //    name containing & or # silently truncated the request, and one
            //    containing a + arrived with spaces. encodeURIComponent fixes both.
            const url = currentHost + 'channel'
                + '?channel_name=' + encodeURIComponent(channelData.channelName || '')
                + '&channel_description=' + encodeURIComponent(channelData.channelDescription || '');
            const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) {
                return null;
            }
            return "updated";
        } catch (e) {
            console.log(e);
            return null;
        }
    }

}

export default ChannelReceiver;
