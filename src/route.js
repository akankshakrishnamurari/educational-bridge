import React from 'react';
import QuestionCreation from "./js/adminPortal/questionCreation/QuestionCreation";
import PaperBuilder from "./js/adminPortal/paperCreation/PaperBuilder";
import './App.css';
import PaperView from "./js/paperSet/PaperView";
import PaperSubmissionView from "./js/PaperSubmissionView";
import NewTagCreation from './js/adminPortal/NewTagCreation';
import NewChannelCreation from './js/adminPortal/NewChannelCreation';
import QuestionSet from './js/questionSet/QuestionSet';
import GeneralQuestionSubmissionView from './js/questionSet/GeneralQuestionSubmissionView';
import GeneralQuestionView, {loadData} from './js/questionSet/GeneralQuestionView';
import ChannelHome from './js/channelSet/ChannelHome';
import UserQuestionSubmissionsSummary from './js/questionSet/UserQuestionSubmissionsSummary';
import UserPaperSubmissionsSummary from './js/paperSet/UserPaperSubmissionsSummary';
import AboutUs from './js/AboutUs';
import Home from './js/Home';
import NotFound from './js/NotFound';

// Named rather than exported anonymously so the array shows up under a useful name
// in stack traces and React DevTools.
const routes = [
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
        element: <PaperBuilder/>,
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
    // Catch-all. Must stay last for readability, though React Router v6 ranks a
    // "*" path below every concrete path regardless of declaration order, so a
    // real route can never be shadowed by this one.
    {
        path: "*",
        element: <NotFound/>,
    },
];

export default routes;