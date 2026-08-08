import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import configureStore from "./store/store";
import {Provider} from "react-redux";
import {HelmetProvider} from 'react-helmet-async';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import theme from './theme';

// WHY createRoot AND NOT ReactDOM.hydrate
// ---------------------------------------
// This file called `ReactDOM.hydrate(...)`. Three things were wrong with that:
//
//  1. hydrate is the API for attaching React to server-rendered markup. There is
//     no server renderer here: this is Create React App, public/index.html ships
//     an empty <div id="root">, and nothing prerenders it. Hydrating an empty
//     container is a guaranteed mismatch, so React discarded the (non-existent)
//     markup and client-rendered anyway — the slower path to the same result.
//
//  2. react-dom is 18.2. `ReactDOM.hydrate` was removed as a supported API in
//     React 18; calling it logs "ReactDOM.hydrate is no longer supported" and
//     silently opts the whole tree into LEGACY mode.
//
//  3. Legacy mode disables React 18's automatic batching. Every setState outside
//     a React event handler — in a promise callback, a setTimeout, an API
//     `.then()` — triggered its own separate re-render. This app resolves several
//     pieces of state per API response, and each list row typesets LaTeX through
//     KaTeX on render, so the redundant renders were not free.
//
// createRoot is the React 18 entry point and puts the app in concurrent mode,
// where those updates are batched into one render.
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <HelmetProvider>
        <Provider store={configureStore()}>
            <BrowserRouter>
                {/* Inside the providers, so the fallback can still use the theme,
                    and outside the router's element tree, so a throw in any single
                    route renders the fallback instead of unmounting the app. */}
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
                <ToastContainer position="top-right" autoClose={3000} />
            </BrowserRouter>
        </Provider>
        </HelmetProvider>
        </ThemeProvider>
    </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
