/*
  Redux action creators.

  Every creator below returns a PLAIN OBJECT. That is deliberate and the store
  depends on it: no middleware is installed (see store/store.js), so dispatching
  a function here would throw "Actions must be plain objects". If an async action
  is ever needed, apply redux-thunk in store.js first.

  Two thunk-style creators used to live here — `solgressAction`, which dispatched
  a 'SIMPLE_ACTION' with the payload 'result_of_simple_action', and
  `initializeReduxState`. Both were written as `() => dispatch => {...}`, neither
  was imported anywhere, and neither could have worked without thunk middleware.
  Removed rather than left as a trap for the next person who tries to use them.
*/

export const saveSpeakerDetails = (payload) => {
    return {
        type: 'SAVE_SPEAKER_DETAILS',
        payload: payload
    };
};

export const savePaperDetails = (payload) => {
    return {
        type: 'SAVE_PAPER_DETAILS',
        payload: payload
    };
};

export const saveSubmittedPaperDetails = (payload) => {
    return {
        type: 'SAVE_SUBMITTED_PAPER_DETAILS',
        payload: payload
    };
};

export const saveUserDetails = (payload) => {
    return {
        type: 'SAVE_USER_DETAILS',
        payload: payload
    };
};

export const updateNewTagDetails = (payload) => {
    return {
        type: 'UPDATE_NEW_TAG_DETAILS',
        payload: payload
    };
};

export const updateNewChannelDetails = (payload) => {
    return {
        type: 'UPDATE_NEW_CHANNEL_DETAILS',
        payload: payload
    };
};

export const updateNewQuestionDetails = (payload) => {
    return {
        type: 'UPDATE_NEW_QUESTION_DETAILS',
        payload: payload
    };
};

export const updateQuestionDetails = (payload) => {
    return {
        type: 'UPDATE_QUESTION_DETAILS',
        payload: payload
    };
};

export const updateQuestionComments = (payload) => {
    return {
        type: 'UPDATE_QUESTION_COMMENTS',
        payload: payload
    }
}

export const updateSubmittedQuestionDetails = (payload) => {
    return {
        type: 'UPDATE_SUBMITTED_QUESTION_DETAILS',
        payload: payload
    };
};

export const updateChannelDetails = (payload) => {
    return {
        type: 'UPDATE_CHANNEL_DETAILS',
        payload: payload
    };
};

export const saveQuestionSet = (payload) => {
    return {
        type: 'SAVE_QUESTION_SET',
        payload: payload
    }
}

export const savePaperSet = (payload) => {
    return {
        type: 'SAVE_PAPER_SET',
        payload: payload
    }
}

export const saveUserPapersSummary = (payload) => {
    return {
        type: 'SAVE_USER_PAPERS_SUMMARY',
        payload: payload
    }
}

export const saveUserQuestionsSummary = (payload) => {
    return {
        type: 'SAVE_USER_QUESTIONS_SUMMARY',
        payload: payload
    }
}


export const updateNewPaperDetails = (payload) => {
    return {
        type: 'UPDATE_NEW_PAPER_DETAILS',
        payload: payload
    };
};

export const updateGeneralInfo = (payload) => {
    return {
        type: 'UPDATE_GENERAL_INFO',
        payload: payload
    };
}