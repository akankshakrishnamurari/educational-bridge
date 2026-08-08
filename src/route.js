import React from 'react';
import QuestionCreation from "./js/adminPortal/questionCreation/QuestionCreation";
import NewPaperPortal from "./js/adminPortal/paperCreation/NewPaperPortal";
import './App.css';
import PaperView from "./js/paperSet/PaperView";
import PaperSubmissionView from "./js/PaperSubmissionView";
import NewTagCreation from './js/adminPortal/NewTagCreation';
import NewChannelCreation from './js/adminPortal/NewChannelCreation';
import QuestionSet from './js/questionSet/QuestionSet';
import GeneralQuestionSubmissionView from './js/questionSet/GeneralQuestionSubmissionView';
import PaperSet from './js/paperSet/PaperSet';
import GeneralQuestionView, {loadData} from './js/questionSet/GeneralQuestionView';
import ChannelHome from './js/channelSet/ChannelHome';
import UserQuestionSubmissionsSummary from './js/questionSet/UserQuestionSubmissionsSummary';
import UserPaperSubmissionsSummary from './js/paperSet/UserPaperSubmissionsSummary';
import AboutUs from './js/AboutUs';
import Home from './js/Home';

export default [
    {
        loadData,
        path: "/question/view",
        element: <GeneralQuestionView/>,
        exact: false,
    },
    {
        loadData,
        path: "/questions",
        element: <QuestionSet/>,
        exact: false,
    },
    {
        loadData,
        path: "/",
        element: <Home/>,
        exact: true,
    },
    {
        loadData,
        path: "/question/upsert",
        element: <QuestionCreation/>,
        exact: false,
    },
    {
        loadData,
        path: "/channels",
        element: <ChannelHome/>,
        exact: false,
    },
    {
        loadData,
        path: "/papers",
        element: <QuestionSet/>,
        exact: false,
    },
    {
        loadData,
        path: "/paper/new",
        element: <NewPaperPortal/>,
        exact: false,
    },
    {
        loadData,
        path: "/paper/view",
        element: <PaperView/>,
        exact: false,
    },
    {
        loadData,
        path: "/paper/submission/view",
        element: <PaperSubmissionView/>,
        exact: false,
    },
    {
        loadData,
        path: "/question/submission/view",
        element: <GeneralQuestionSubmissionView/>,
        exact: false,
    },
    {
        loadData,
        path: "/tags/new",
        element: <NewTagCreation/>,
        exact: false,
    },
    {
        loadData,
        path: "/channel/new",
        element: <NewChannelCreation/>,
        exact: false,
    },
    {
        loadData,
        path: "/papers/instances/me",
        element: <UserPaperSubmissionsSummary/>,
        exact: false,
    },
    {
        loadData,
        path: "/questions/instances/me",
        element: <UserQuestionSubmissionsSummary/>,
        exact: false,
    },
    {
        loadData,
        path: "/aboutus",
        element: <AboutUs/>,
        exact: false,
    },
];

// <Routes>
            // <Route exact path="/question/upsert" element={<QuestionCreation editorRef={editorRef}/>}/>