import React from 'react';
import ReactDOM from 'react-dom';
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
import theme from './theme';


ReactDOM.hydrate(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <HelmetProvider>
        <Provider store={configureStore()}>
            <BrowserRouter>
                <App />
                <ToastContainer position="top-right" autoClose={3000} />
            </BrowserRouter>
        </Provider>
        </HelmetProvider>
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
