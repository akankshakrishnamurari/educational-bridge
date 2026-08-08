import { Route, Routes } from 'react-router-dom';
import React, { useEffect } from 'react';
import './App.css';
import { currentGoogleLoginAPIKey } from './constants/hostConfig';
import route from './route';
import jwt_decode from 'jwt-decode';
import UserAPIConnector from './apis/UserAPIConnector';
import { gapi } from 'gapi-script';

// App is the routing shell only.
//
// It deliberately renders no chrome of its own: the header is per-page (some
// surfaces, such as the timed paper view, need a different one) and the footer is
// opted into per page via components/common/Footer, because focused task surfaces
// with sticky action bars should not have a footer competing for the same space.

function App() {
    function handleGoogleLoginCallback(response) {
        let userDetails = jwt_decode(response.credential);
        window.sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
        UserAPIConnector.updateUserDetails(userDetails);
        window.location.reload();
    }

    useEffect(() => {
        /* global google */
        google.accounts.id.initialize({
            client_id: currentGoogleLoginAPIKey,
            scope: ['https://www.googleapis.com/auth/user.birthday.read'],
            callback: handleGoogleLoginCallback,
        });
        google.accounts.id.renderButton(
            document.getElementById('signInDiv'),
            { theme: 'outline', size: 'large' }
        );
    }, []);

    useEffect(() => {
        const initClient = () => {
            gapi.client.init({
                clientId: currentGoogleLoginAPIKey,
                scope: '',
            });
        };
        gapi.load('client:auth2', initClient);
    });

    return (
        <div className="App min-h-screen">
            <Routes>
                {route.map((e) => <Route key={e.path} {...e} />)}
            </Routes>
        </div>
    );
}

export default App;
