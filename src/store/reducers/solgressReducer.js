import {getInitialState} from "../utils/reduxUtil";
import produce from "immer";

const initialState = getInitialState();

// Two cases used to sit at the top of this switch and both are now gone, along
// with the unused thunk action creators that were the only things that could
// have dispatched them:
//
//   'SIMPLE_ACTION'    returned `{ result: action.payload }` — note it replaced
//                      the WHOLE state object rather than producing a draft, so
//                      one dispatch would have wiped every slice in the store
//                      (user details, question set, paper details, all of it).
//   'INITIALIZE_STATE' returned `initialState`, the shared object read at module
//                      load, so any later immer draft would have mutated the
//                      same reference the reducer falls back to.
const SolgressReduxState = (currentState = initialState, action) => {
  switch (action.type) {
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