import { Route, Routes } from 'react-router-dom';
import React from 'react';
import './App.css';
import route from './route';

// App is the routing shell only.
//
// It deliberately renders no chrome of its own: the header is per-page (some
// surfaces, such as the timed paper view, need a different one) and the footer is
// opted into per page via components/common/Footer, because focused task surfaces
// with sticky action bars should not have a footer competing for the same space.
//
// TWO GOOGLE SIGN-IN INITIALISATIONS USED TO LIVE HERE
// ----------------------------------------------------
// Neither did anything useful, and between them they loaded both of Google's auth
// libraries on every page:
//
//  * A `google.accounts.id.initialize` + `renderButton` pair that drew into
//    `document.getElementById('signInDiv')`. No element with that id exists
//    anywhere in the app, so renderButton was handed `null` on every mount.
//    Its callback — the only code that recorded a login server-side — could
//    therefore never fire.
//
//  * A `gapi.load('client:auth2')` from `gapi-script`, with an effect that had no
//    dependency array, so it re-ran on every single render. That is the retired
//    Google Sign-In platform library, and pulling it in is what put the app on
//    the code path that fails with "Error 400: redirect_uri_mismatch".
//
// Sign-in now lives with the control that triggers it: components/common/
// GoogleSignInButton, backed by utils/googleAuth. Nothing global is needed —
// the GIS script is loaded on demand, and only where a sign-in button renders.

function App() {
    return (
        <div className="App min-h-screen">
            <Routes>
                {route.map((e) => <Route key={e.path} {...e} />)}
            </Routes>
        </div>
    );
}

export default App;
