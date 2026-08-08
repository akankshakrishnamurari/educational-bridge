import {getInitialState} from "../utils/reduxUtil";
import produce from "immer";

const initialState = getInitialState();

const SolgressReduxState = (currentState = initialState, action) => {
  switch (action.type) {
    case 'SIMPLE_ACTION':
      return {
        result: action.payload
      }
    case 'INITIALIZE_STATE' :
      return initialState;
    case 'SAVE_SPEAKER_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.speakerDetails = action.payload;
      });
    }
    case 'SAVE_PAPER_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.paperDetails = action.payload;
      });
    }
    case 'SAVE_USER_PAPERS_SUMMARY': {
      return produce(currentState, (draftState) => {
        draftState.userPapersSummary = action.payload;
      });
    }
    case 'SAVE_USER_QUESTIONS_SUMMARY': {
      return produce(currentState, (draftState) => {
        draftState.userQuestionsSummary = action.payload;
      });
    }
    case 'SAVE_SUBMITTED_PAPER_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.submittedPaperDetails = action.payload;
      });
    }
    case 'SAVE_USER_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.userDetails = action.payload;
      });
    }
    case 'UPDATE_NEW_QUESTION_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.newQuestionDetails = action.payload;
      });
    }
    case 'UPDATE_SUBMITTED_QUESTION_DETAILS':  {
      return produce(currentState, (draftState) => {
        draftState.submittedQuestionDetails = action.payload;
      });
    } 
    case 'UPDATE_QUESTION_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.questionDetails = action.payload;
      });
    }
    case 'UPDATE_QUESTION_COMMENTS': {
      return produce(currentState, (draftState) => {
        draftState.questionComments = action.payload;
      });
    }
    case 'UPDATE_CHANNEL_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.channelDetails = action.payload;
      });
    }
    case 'UPDATE_NEW_TAG_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.newTagDetails = action.payload;
      });
    }
    case 'UPDATE_NEW_CHANNEL_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.newChannelDetails = action.payload;
      });
    }
    case 'UPDATE_NEW_PAPER_DETAILS': {
      return produce(currentState, (draftState) => {
        draftState.newPaperDetails = action.payload;
      });
    }
    case 'SAVE_QUESTION_SET': {
      return produce(currentState, (draftState) => {
        draftState.questionSet = action.payload;
      });
    }
    case 'SAVE_PAPER_SET': {
      return produce(currentState, (draftState) => {
        draftState.paperSet = action.payload;
      });
    }
    case 'UPDATE_GENERAL_INFO': {
      return produce(currentState, (draftState) => {
        draftState.generalInfo = action.payload;
      });
    }
    default:
      return {...currentState};
  }
}

export default SolgressReduxState;