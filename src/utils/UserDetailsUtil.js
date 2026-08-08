import React from "react";

export class UserDetailsUtil {

    static getUserGoogleId = () => {
       let userDetails = window.sessionStorage.userDetails;
       if(userDetails=="null" || userDetails == null || userDetails == undefined) {
            return null;
       }
       return JSON.parse(userDetails).googleId;
    }

}