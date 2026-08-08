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
            let response = fetch(currentHost + 'channel?channel_name=' + channelData.channelName+'&channel_description=' + channelData.channelDescription, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            return "updated";
        } catch (e) {
            console.log(e);
            return null;
        }
    }

}

export default ChannelReceiver;
