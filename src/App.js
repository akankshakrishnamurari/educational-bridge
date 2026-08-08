import {  Route, Routes } from 'react-router-dom';
import React, { useRef, useEffect } from 'react';
import './App.css';
import { currentGoogleLoginAPIKey } from './constants/hostConfig';
import route from './route'
import jwt_decode from 'jwt-decode';
import UserAPIConnector from './apis/UserAPIConnector';
import { gapi } from 'gapi-script';

function App() {
  let editorRef = useRef(null);
  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  function handleGoogleLoginCallback(response) {
    let userDetails = jwt_decode(response.credential);
    window.sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
    UserAPIConnector.updateUserDetails(userDetails);
    window.location.reload();
  }

  useEffect (()=>{
    /* global google */
    google.accounts.id.initialize({
      client_id: currentGoogleLoginAPIKey,
      scope: ["https://www.googleapis.com/auth/user.birthday.read"], 
      callback: handleGoogleLoginCallback
    });
    google.accounts.id.renderButton(
      document.getElementById("signInDiv"),
      {theme :"outline", size : "large"}
    )
  },[]);

  useEffect(() => {
    const initClient = () => {
          gapi.client.init({
          clientId: currentGoogleLoginAPIKey,
          scope: ''
        });
     };
     gapi.load('client:auth2', initClient);
 });

  let data = <div className="App min-h-screen">
        <Routes>
            { route.map( e => <Route key={ e.path } { ...e } /> ) }
        </Routes>
      <footer className="text-center text-gray-500 bg-white border-t border-gray-200 pb-10">
        <div className='flex flex-row justify-center py-5'>
            <div className='px-2'>
              {/* Contact Us : krishnamurari.at@gmail.com / (+1) 551-352-8368 */}
            </div>
        </div>
      </footer>
    </div>

  return data;
  
}

export default App;