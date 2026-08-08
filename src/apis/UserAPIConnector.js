import React from 'react';
import {currentHost} from '../constants/hostConfig';
import { logError } from '../utils/logger';

class UserAPIConnector extends React.Component  {

    static updateUserDetails = async(userDetails) => {
        try {
            let requestBody = {};
            requestBody.googleId = userDetails.googleId;
            requestBody.picture = userDetails.imageUrl;
            requestBody.email = userDetails.email;
            requestBody.name = userDetails.name;
            requestBody.familyName = userDetails.familyName;
            requestBody.givenName = userDetails.givenName;
            let response = fetch(currentHost + 'user/login/details', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                }
            );
            return "updated";
        } catch (e) {
            logError('UserAPIConnector.updateUserDetails', e);
            return null;
        }
    }
    static getSuggestedUsers = async(userKey) => {
        try {
            const response = await fetch(
                currentHost + '/suggestion/users?search_key='+userKey+'&start_index=0&page_size=100'
            );
            let data = await response.json();
            return {data};
        }
        catch (e) {
            logError('UserAPIConnector.getSuggestedUsers', e);
            return null;
        }
    }   

}

export default UserAPIConnector;
