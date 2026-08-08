import React from 'react';
import { connect } from 'react-redux';
import {saveUserDetails, updateGeneralInfo} from '../../store/actions/solgressAction'
import { MiscUtils } from '../../utils/MiscUtils';
import EducationalBridgeHeaderLargeScreen from './largeScreen/EducationalBridgeHeaderLargeScreen';
import EducationalBridgeHeaderSmallScreen from './smallScreen/EducationalBridgeHeaderSmallScreen';
import UserAPIConnector from '../../apis/UserAPIConnector';


const mapDispatchToProps = dispatch => ({
    saveUserDetails: (payload) => dispatch(saveUserDetails(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        userDetails: state.solgressReducer.userDetails,
        generalInfo: state.solgressReducer.generalInfo
    };
}

class EducationalBridgeHeader extends React.Component {

    constructor(props) {
        super(props);
        this.state = { isSmallScreen: MiscUtils.isUserOnSmallScreen() };
    }

    // WHY THE HEADER LISTENS TO RESIZE
    // --------------------------------
    // Which header renders used to be decided once, from the user-agent string.
    // That produced two wrong answers: a desktop browser narrowed to phone width
    // kept the wide header (which then overflowed, because it lays out a wordmark,
    // nav, search field and two action buttons on one row), and a tablet in
    // landscape at 1024px got the cramped mobile header. Neither corrected itself,
    // because a user-agent string does not change when the window does.
    //
    // The decision is now made from viewport width and re-evaluated on resize and
    // orientation change, which is what the rest of the app's responsive
    // breakpoints already key off.
    componentDidMount() {
        window.addEventListener('resize', this.handleViewportChange);
        window.addEventListener('orientationchange', this.handleViewportChange);
        // Re-check after mount: the constructor may have run before the layout
        // settled (notably on orientation change during load).
        this.handleViewportChange();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleViewportChange);
        window.removeEventListener('orientationchange', this.handleViewportChange);
    }

    handleViewportChange = () => {
        const isSmallScreen = MiscUtils.isUserOnSmallScreen();
        if (isSmallScreen !== this.state.isSmallScreen) {
            this.setState({ isSmallScreen });
        }
    }

    saveUserDetails = (payload) => {
        // Fire and forget: the caller has already stored the session locally, so a
        // failure here must not block sign-in. UserAPIConnector already swallows and
        // reports transport errors.
        UserAPIConnector.updateUserDetails(payload);
    }

    /**
     * The header is rendered on every page, but only the question and paper list
     * pages pass an `updateSearchText` callback (they filter their list live as you
     * type). This used to forward the call unconditionally, so typing a single
     * character into the header search box on any other page — the home page, the
     * solve page, about us, every authoring page — threw
     * "this.props.updateSearchText is not a function" on each keystroke.
     *
     * Live filtering is genuinely page-specific, so the fix is for the forwarder to
     * be a no-op when the host page has nothing to filter. Those pages still search
     * fine: the header navigates to the question list on submit.
     */
    updateSearchText = () => {
        if (typeof this.props.updateSearchText === 'function') {
            this.props.updateSearchText();
        }
    }

    render(){
        if(this.state.isSmallScreen){
            return <EducationalBridgeHeaderSmallScreen
                saveUserDetails = {this.saveUserDetails}
                updateSearchText = {this.updateSearchText}/>
        }
        return <EducationalBridgeHeaderLargeScreen
            saveUserDetails = {this.saveUserDetails}
            updateSearchText = {this.updateSearchText}/>
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(EducationalBridgeHeader);
