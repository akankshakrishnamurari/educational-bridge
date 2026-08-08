/*
  src/actions/solgressAction.js
*/
import {getInitialState} from "../utils/reduxUtil";

export const solgressAction = () => dispatch => {
    dispatch({
        type: 'SIMPLE_ACTION',
        payload: 'result_of_simple_action'
    })
}

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

export const initializeReduxState = () => dispatch => {
    dispatch({
        type: 'INITIALIZE_STATE',
        payload: getInitialState()
    })
}