import React from 'react';
import {currentHost} from './../constants/hostConfig';

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
            console.log(e);
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
            console.log(e);
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
            console.log(e);
            return null;
        }
    }

}

export default TagReceiver;
