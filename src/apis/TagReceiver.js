import React from 'react';
import {currentHost} from './../constants/hostConfig';
import { logError } from '../utils/logger';

class TagReceiver extends React.Component  {

    static getSuggestedTags = async(tagSearchKey) => {
        try {
            const response = await fetch(
                currentHost + 'suggestion/tags?tag_pattern='+tagSearchKey + '&start_index=0&page_size=5'
            );
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('TagReceiver.getSuggestedTags', e);
            return null;
        }
    }   
    
    static getUserResourceCreationTag = async(email) => {
        try {
            const response = await fetch(
                currentHost + 'tag/user/resource/creation?email='+email
            );
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('TagReceiver.getUserResourceCreationTag', e);
            return null;
        }
    }

    static upsertNewTag = async(tagData) => {
        try {
            let response = fetch(currentHost + 'tag?tag_name=' + tagData.tagName+'&tag_description=' + tagData.tagDescription, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            return "updated";
        } catch (e) {
            logError('TagReceiver.upsertNewTag', e);
            return null;
        }
    }

}

export default TagReceiver;
