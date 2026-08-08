import React from 'react';
import { connect } from 'react-redux';
import {saveUserDetails, updateGeneralInfo} from '../../../store/actions/solgressAction'
// Google Identity Services, not `react-google-login` — see the note in the
// large-screen header and in utils/googleAuth.js.
import GoogleSignInButton from '../../../components/common/GoogleSignInButton';
import { completeGoogleSignIn, signOutOfGoogle } from '../../../utils/googleAuth';
import { logoTextCSS } from '../../../constants/TextSizeConstants';
import { currentURLHost } from '../../../constants/hostConfig';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { colors } from '../../../constants/designTokens';
import { VscSettings } from "react-icons/vsc";
import { AiOutlineSearch } from "react-icons/ai";
import EducationalBridgePopupBox from '../../coreCapabilities/EducationalBridgePopupBox';
import TagFilterViewSmall from '../../questionSet/TagFilter/TagFilterViewSmall';
import {BsArrowLeft} from "react-icons/bs";
import {MdExitToApp} from "react-icons/md";
import notify from '../../../utils/notify';
import {UserDetailsUtil} from '../../../utils/UserDetailsUtil';

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

const MENU_ITEM_CLASS = 'block w-full text-left py-2.5 px-4 text-gray-700 text-sm hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:bg-primary-50 focus:text-primary-700 transition-colors';

class EducationalBridgeHeaderSmallScreen extends React.Component {

    componentDidMount(){
        // Was dispatched from inside render(). Moved out so rendering has no side
        // effects.
        if (typeof this.props.generalInfo === 'undefined') {
            this.initializeTagFilterView();
        }
    }

    initializeTagFilterView = () => {
        let generalInfo = {};
        generalInfo.isTagFilterViewActive = false;
        generalInfo.temporarySelectedTags=[];
        generalInfo.selectedTags=[];
        generalInfo.isViewingQuestions = true;
        generalInfo.isViewingPapers = false;
        generalInfo.isSearchActive = false;
        generalInfo.searchText = "";
        let searchTextQueryParam = new URLSearchParams(window.location.search).get('search_text');
        if(searchTextQueryParam!=null) {
            generalInfo.searchText = searchTextQueryParam;
        }
        this.props.updateGeneralInfo(generalInfo)
    }

    /**
     * See the large-screen header for why the server-side login record is made
     * here rather than through `this.props.saveUserDetails`.
     */
    handleGoogleSignIn = async (user) => {
        this.props.saveUserDetails(user);
        await completeGoogleSignIn(user);
        // The large-screen header reloads here and this one did not, so on a phone
        // the header kept rendering the "Log in" button until the next navigation
        // even though the session had been stored.
        window.location.reload();
    }

    handleGoogleSignInFailure = () => {
        // This previously only wrote to the console, so a failed sign-in looked to the
        // visitor like nothing had happened at all.
        notify.error("We couldn't sign you in with Google. Please try again.");
    }

    handleSignOut = () => {
        if (this.hasSignedOut) {
            return;
        }
        this.hasSignedOut = true;
        signOutOfGoogle();
        UserDetailsUtil.clearUserDetails();
        this.props.saveUserDetails(undefined);
        window.location.href = currentURLHost;
    }

    toggleLoginPopOver = () => {
        let userDetails = {...(UserDetailsUtil.getUserDetails() || {})}
        if(userDetails.isUserLoginContentPopupEnabled === null || userDetails.isUserLoginContentPopupEnabled === false) {
            userDetails["isUserLoginContentPopupEnabled"] = true;
        }
        else {
            userDetails["isUserLoginContentPopupEnabled"] = false;
        }
        window.sessionStorage.setItem("userDetails",  JSON.stringify(userDetails));
        this.props.saveUserDetails(userDetails);
    }

    toggleLoginPopOverWithoutReload = () => {
        let userDetails = {...(UserDetailsUtil.getUserDetails() || {})}
        if(userDetails.isUserLoginContentPopupEnabled === null || userDetails.isUserLoginContentPopupEnabled === false) {
            userDetails["isUserLoginContentPopupEnabled"] = true;
        }
        else {
            userDetails["isUserLoginContentPopupEnabled"] = false;
        }
        window.sessionStorage.setItem("userDetails",  JSON.stringify(userDetails));
    }

    moveToMySolvedPapers = () => {
        this.toggleLoginPopOverWithoutReload();
        window.sessionStorage.setItem("solvedByMe",  true);
        window.location.href = currentURLHost + "papers/instances/me";
    }

    moveToMySolvedQuestions = () => {
        this.toggleLoginPopOverWithoutReload();
        window.sessionStorage.setItem("solvedByMe",  true);
        window.location.href = currentURLHost + "questions/instances/me";
    }

    moveToMyCreatedPapers = () => {
        this.toggleLoginPopOverWithoutReload();
        window.sessionStorage.setItem("createdByMe",  true);
        window.location.href = currentURLHost + "papers";
    }

    moveToMyCreatedQuestions = () => {
        this.toggleLoginPopOverWithoutReload();
        window.sessionStorage.setItem("createdByMe",  true);
        window.location.href = currentURLHost + "questions";
    }

    getLoginLogoutButtonJSX = () => {
        if(!UserDetailsUtil.isSignedIn()) {
            // Icon-only here, unlike the desktop header. This row already carries a
            // non-wrapping wordmark plus a search and a filter trigger, and GIS's
            // labelled button is ~120px wide, which overflows a 360px viewport.
            // The icon variant is 32px and Google gives it its own accessible name
            // ("Sign in with Google"), so the label is still announced.
            return <GoogleSignInButton
                onSignIn={this.handleGoogleSignIn}
                onError={this.handleGoogleSignInFailure}
                buttonOptions={{ type: 'icon', size: 'medium', shape: 'square' }}
            />;
        }
        const userDetails = UserDetailsUtil.getUserDetails() || {};
        let popupContent = <div className='w-64 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50'>
            <div className="px-4 pb-2 mb-1 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-900 truncate">{userDetails.name || 'Your account'}</div>
                {userDetails.email &&
                    <div className="text-xs text-gray-500 truncate">{userDetails.email}</div>
                }
            </div>
            <button type="button" className={MENU_ITEM_CLASS} onClick={this.moveToMySolvedQuestions}>Questions I've solved</button>
            <button type="button" className={MENU_ITEM_CLASS} onClick={this.moveToMySolvedPapers}>Papers I've taken</button>
            <button type="button" className={MENU_ITEM_CLASS} onClick={this.moveToMyCreatedQuestions}>Questions I've written</button>
            <button type="button" className={MENU_ITEM_CLASS} onClick={this.moveToMyCreatedPapers}>Papers I've built</button>
            <div className='flex px-3 pt-2 justify-center'>
                {/* One button, one handler. This was a <div onClick={logout}>
                    wrapping GoogleLogout's own default button, so there were two
                    overlapping click targets doing two different things inside one
                    control. GIS has no logout component, which removes the
                    ambiguity for good. */}
                <button
                    type="button"
                    className='inline-flex items-center justify-center gap-1.5 w-full h-9 px-3 rounded-lg bg-danger-600 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-danger-500'
                    onClick={this.handleSignOut}
                >
                    <MdExitToApp size={18} aria-hidden="true"/>
                    Sign out
                </button>
            </div>
        </div>;
        return <Popover
            isOpen={userDetails.isUserLoginContentPopupEnabled === true}
            positions={['bottom', 'left', 'right', 'top']}
            content={({ position, childRect, popoverRect }) => (
                <ArrowContainer
                    position={position}
                    childRect={childRect}
                    popoverRect={popoverRect}
                    arrowColor={colors.gray[200]}
                    arrowSize={10}
                    className='popover-arrow-container'
                    arrowClassName='popover-arrow'
                >
                    {popupContent}
                </ArrowContainer>
              )}
              onClickOutside = {() => this.toggleLoginPopOver()}
        >
            {/* The click handler used to sit on the <img> itself, so the account menu
                could only be opened with a pointer. */}
            <button
                type="button"
                onClick={() => this.toggleLoginPopOver()}
                className="rounded-full shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label="Open your account menu"
                aria-expanded={userDetails.isUserLoginContentPopupEnabled === true}
            >
                <img className="rounded-full w-9 h-9 bg-gray-100 object-cover"
                    src={userDetails.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                />
            </button>
        </Popover>;
    }

    updateSearchText = (event) => {
        let generalInfo = typeof this.props.generalInfo === "undefined"?{}:{...this.props.generalInfo};
        generalInfo.searchText = event.target.value;
        generalInfo.isTagFilterViewActive = false;
        this.props.updateGeneralInfo(generalInfo);
        this.props.updateSearchText();
    }

    /**
     * The compact header had no submit path at all: its search input had an onChange
     * and nothing else, so on a phone there was no way to actually run a search from
     * anywhere except the question list, where typing filters live. Pressing the
     * on-screen keyboard's Go key did nothing.
     */
    submitSearch = () => {
        const searchText = (this.props.generalInfo && this.props.generalInfo.searchText) || '';
        const trimmed = searchText.trim();
        if (trimmed === '') {
            window.location.href = currentURLHost + "questions";
            return;
        }
        window.location.href = currentURLHost + "questions?search_text=" + encodeURIComponent(trimmed);
    }

    enableSearchHeader = () => {
        let payload = {...this.props.generalInfo};
        payload.isSearchActive = true;
        this.props.updateGeneralInfo(payload);
    }

    inactivateSearchHeader = () => {
        let payload = {...this.props.generalInfo};
        payload.isSearchActive = false;
        this.props.updateGeneralInfo(payload);
    }

    /**
     * The filters sheet only has a list to filter on the question and paper list
     * pages. The trigger used to render in the header on all fourteen routes, so on
     * the home page, the solve page, the authoring forms and every dashboard it
     * opened a sheet whose "Show results" button had no visible effect.
     */
    isFilterableRoute = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        const path = window.location.pathname.replace(/\/+$/, '');
        return path === '/questions' || path === '/papers';
    }

    /**
     * The filters sheet trigger.
     *
     * There used to be two of these side by side: this one and a second identical
     * popup behind a clipboard icon, wired to the same handler and showing the same
     * "Filters" content. The clipboard looked like a "build a paper" action and did
     * something else entirely, so it has been removed rather than relabelled.
     *
     * The active-search variant of this control also passed `isPopupClosed={true}`
     * as a literal, which made the sheet render empty every time it opened — the
     * filter button in search mode was simply dead.
     */
    getFilterPopupJSX = (iconSize) => {
        if (!this.isFilterableRoute()) {
            return null;
        }
        return <EducationalBridgePopupBox
                popupModalClassName = " bg-white border shadow flex w-screen"
                popupTriggerContentClassName = "p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                popupTriggerContent = {<VscSettings size={iconSize} aria-hidden="true"/>}
                triggerAriaLabel = "Filters"
                postPopupContentHeaderClassName = "bg-primary-100 border-t-2 border-l-2 border-r-2 rounded-t-lg border-gray-400"
                postPopupContentHeader = "Filters"
                postpopupContentClassName = "bg-white border-2 border-gray-400 rounded-b-lg"
                postPopupContent = {<TagFilterViewSmall/>}
                isPopupClosed = {false}
            />;
    }

    getHeaderWithActiveSearch = () => {
        return <div className="w-full bg-white">
                <div className="flex flex-row items-center gap-1.5 h-14 px-2">
                    <button
                        type="button"
                        className='p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                        onClick={() => this.inactivateSearchHeader()}
                        aria-label="Close search"
                    >
                        <BsArrowLeft size={22} aria-hidden="true"/>
                    </button>
                    <form
                        className='flex-1 min-w-0'
                        role="search"
                        onSubmit={(event) => { event.preventDefault(); this.submitSearch(); }}
                    >
                        <div className="relative">
                            <AiOutlineSearch
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="search"
                                className="w-full h-9 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-primary-500"
                                placeholder="Search questions and papers"
                                value={this.props.generalInfo==null ||this.props.generalInfo.searchText==null ? "": this.props.generalInfo.searchText}
                                onChange={(event) => this.updateSearchText(event)}
                                aria-label="Search questions and papers"
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                        </div>
                    </form>
                    {this.getFilterPopupJSX(20)}
                </div>
            </div>;
    }

    getHeaderWithInactiveSearch = () => {
        return <div className="w-full">
                <div className="flex flex-row items-center gap-1 w-full h-14 px-2">
                    <button
                        type="button"
                        className={"flex items-center gap-1.5 min-w-0 px-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded " + logoTextCSS}
                        onClick={() => window.location.href=currentURLHost}
                        aria-label="EducationalBridge home"
                    >
                        <img src="/logo.svg" alt="" className="h-8 w-auto shrink-0" />
                        <span className="whitespace-nowrap tracking-tight">
                            <span className="font-normal">Educational</span><span className="font-extrabold text-primary-600">Bridge</span>
                        </span>
                    </button>
                    <div className='flex flex-row items-center justify-end gap-1 ml-auto shrink-0'>
                        <button
                            type="button"
                            className='p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                            onClick={() => this.enableSearchHeader()}
                            aria-label="Search"
                        >
                            <AiOutlineSearch size={22} aria-hidden="true"/>
                        </button>
                        {this.getFilterPopupJSX(22)}
                        {/* This was wrapped in an outer <button>, and
                            getLoginLogoutButtonJSX returns a <button> — a button
                            inside a button is invalid HTML, and browsers resolve it by
                            closing the outer element early, which broke the layout of
                            the whole action cluster. */}
                        {this.getLoginLogoutButtonJSX()}
                    </div>
                </div>
            </div>;
    }

    render(){
        if(typeof this.props.generalInfo == `undefined`){
            return <div/>
        }
        return <header className="sticky top-0 z-max bg-white border-b border-gray-200 flex flex-row">
                {this.props.generalInfo.isSearchActive?this.getHeaderWithActiveSearch():this.getHeaderWithInactiveSearch()}
            </header>
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EducationalBridgeHeaderSmallScreen);
