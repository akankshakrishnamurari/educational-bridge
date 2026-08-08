import React from 'react';
import { connect } from 'react-redux';
import {saveUserDetails, updateGeneralInfo} from '../../../store/actions/solgressAction'
// NAMED IMPORTS, DELIBERATELY
// ---------------------------
// This file used to do `import GoogleLogout from 'react-google-login'`. The
// package's default export is GoogleLogin, so that line imported the *sign-in*
// component and gave it the name GoogleLogout. The "Sign out" item in the account
// menu therefore rendered a sign-in control: clicking it opened Google's sign-in
// popup and never cleared the session, so signing out was impossible on desktop.
// (The mobile header got away with the same mistake only because it also had a
// local click handler that wiped the session and reloaded the page.)
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { generalTextSize } from '../../../constants/TextSizeConstants';
import { layout, colors } from '../../../constants/designTokens';
import { currentURLHost } from '../../../constants/hostConfig';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { currentGoogleLoginAPIKey } from '../../../constants/hostConfig';
import { AiOutlineSearch } from "react-icons/ai";
import {FcGoogle} from "react-icons/fc"
import notify from '../../../utils/notify';
import {IoCreateOutline} from "react-icons/io5"
import {MdExitToApp} from "react-icons/md";
import {UserDetailsUtil} from '../../../utils/UserDetailsUtil';

const mapDispatchToProps = dispatch => ({
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload)),
    saveUserDetails :(payload) => dispatch(saveUserDetails(payload))
})


const mapStateToProps = state => {
    return {
        generalInfo: state.solgressReducer.generalInfo,
        userDetails: state.solgressReducer.userDetails
    };
}

// Shared classes for the rows inside the two header dropdowns. These are real
// <button> elements now: they were <div onClick=...>, which meant the entire
// account menu (solved papers, solved questions, created papers, created
// questions) and the entire create menu could only be operated with a pointer.
// Nothing in either menu was reachable by keyboard or announced as actionable.
const MENU_ITEM_CLASS = 'block w-full text-left py-2 px-4 text-gray-700 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:bg-primary-50 focus:text-primary-700 transition-colors';

class EducationalBridgeHeaderLargeScreen extends React.Component {

    componentDidMount(){
        // Seeding redux used to happen inside render(), which dispatched an action
        // as a side effect of rendering. Moved here so a render is just a render.
        if (typeof this.props.generalInfo === 'undefined') {
            this.initializeTagFilterView();
        }
    }

    initializeTagFilterView = () => {
        let generalInfo = {};
        generalInfo.isTagFilterViewActive = false;
        generalInfo.isCreateContentPopupActive = false;
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
        this.props.updateGeneralInfo(generalInfo);
    }

    handleGoogleLoginResponse = (response) => {
        window.sessionStorage.setItem("userDetails", JSON.stringify(response.profileObj));
        this.props.saveUserDetails(response.profileObj);
        window.location.reload();
    }

    handleGoogleLoginFailureResponse = () => {
        // This previously only wrote to the console, so a failed sign-in looked to the
        // visitor like nothing had happened at all.
        notify.error("We couldn't sign you in with Google. Please try again.");
    }

    /**
     * Clears the local session and reloads.
     *
     * Called both from GoogleLogout's onLogoutSuccess and directly from the button's
     * own click handler. Google's sign-out is a network round trip that can fail or
     * hang; if it never resolves, onLogoutSuccess never fires. A sign-out that
     * silently does nothing is worse than one that drops the local session anyway,
     * so the local session is cleared regardless and `hasSignedOut` keeps the reload
     * from running twice.
     */
    handleGoogleLogoutResponse = () => {
        if (this.hasSignedOut) {
            return;
        }
        this.hasSignedOut = true;
        window.sessionStorage.setItem("userDetails", null);
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

    activateCreateContentPopOver = () => {
        let payload = {...this.props.generalInfo};
        payload.isCreateContentPopupActive = !payload.isCreateContentPopupActive;
        this.props.updateGeneralInfo(payload);
    }

    inactivateCreateContentPopOver = () => {
        let payload = {...this.props.generalInfo};
        payload.isCreateContentPopupActive = false;
        this.props.updateGeneralInfo(payload);
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
            return <GoogleLogin
                clientId = {currentGoogleLoginAPIKey}
                render={renderProps => (
                    // One <button>, not a clickable <div> wrapping two nested
                    // <button>s. The old markup announced itself to a screen reader
                    // as two separate unlabelled buttons, and the element carrying
                    // the click handler was not focusable at all.
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 h-10 pl-3 pr-4 rounded-lg bg-white border border-gray-300 text-sm font-medium text-primary-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-60"
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                    >
                        <FcGoogle size={18} aria-hidden="true"/>
                        Log in
                    </button>
                )}
                onSuccess={this.handleGoogleLoginResponse}
                onFailure = {this.handleGoogleLoginFailureResponse}
                cookiePolicy = 'none'
            />;
        }
        const userDetails = UserDetailsUtil.getUserDetails() || {};
        let popupContent = <div className='pt-3'>
                <div className={'w-64 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50 ' + generalTextSize }>
                    {/* The signed-in identity, so the menu says whose account it is.
                        Previously the only clue was the avatar image itself. */}
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
                    <div className='flex justify-center pt-2 px-2'>
                        <GoogleLogout
                            clientId = {currentGoogleLoginAPIKey}
                            onLogoutSuccess={this.handleGoogleLogoutResponse}
                            onFailure={this.handleGoogleLogoutResponse}
                            render={renderProps => (
                                <button
                                    type="button"
                                    className='inline-flex items-center justify-center gap-1.5 w-full h-9 px-3 rounded-lg bg-danger-600 hover:bg-danger-700 transition-colors text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-1'
                                    onClick={() => {
                                        // Ask Google to sign out, then clear locally
                                        // regardless of whether that resolves.
                                        if (typeof renderProps.onClick === 'function') {
                                            renderProps.onClick();
                                        }
                                        this.handleGoogleLogoutResponse();
                                    }}
                                >
                                    <MdExitToApp size={18} aria-hidden="true"/>
                                    Sign out
                                </button>
                            )}
                        />
                    </div>
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
                    // Was the raw CSS keyword 'blue' at 0.7 opacity, which is not a
                    // colour that appears anywhere else in the app.
                    arrowColor={colors.gray[200]}
                    arrowSize={10}
                    className='popover-arrow-container'
                    arrowClassName='popover-arrow pt-3'
                >
                    {popupContent}
                </ArrowContainer>
              )}
              onClickOutside = {() => this.toggleLoginPopOver()}
        >
            <button
                type="button"
                onClick={() => this.toggleLoginPopOver()}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Open your account menu"
                aria-expanded={userDetails.isUserLoginContentPopupEnabled === true}
            >
                <img
                    className="rounded-full w-10 h-10 bg-gray-100 object-cover"
                    src={userDetails.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                />
            </button>
        </Popover>;
    }

    getCreateContentButton = () => {
        let popupContent = <div className={'w-56 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-max ' + generalTextSize}>
            <button type="button" className={MENU_ITEM_CLASS} onClick={()=>window.location.href=currentURLHost+"question/upsert"}>
                New question
            </button>
            <button type="button" className={MENU_ITEM_CLASS} onClick={()=>window.location.href=currentURLHost+"paper/new"}>
                New paper
            </button>
            <button type="button" className={MENU_ITEM_CLASS} onClick={()=>window.location.href=currentURLHost+"channel/new"}>
                New channel
            </button>
            <button type="button" className={MENU_ITEM_CLASS} onClick={()=>window.location.href=currentURLHost+"tags/new"}>
                New tag
            </button>
        </div>;
        return <Popover
                isOpen={this.props.generalInfo.isCreateContentPopupActive === true}
                positions={['bottom', 'left', 'right', 'top']}
                content={({ position, childRect, popoverRect }) => (
                    <ArrowContainer
                        position={position}
                        childRect={childRect}
                        popoverRect={popoverRect}
                        arrowColor={'#FFFFFF'}
                        arrowSize={10}
                        className='popover-arrow-container'
                        arrowClassName='popover-arrow'
                    >
                        {popupContent}
                    </ArrowContainer>
                    )}
                    onClickOutside = {() => this.inactivateCreateContentPopOver()}
            >
                {/* The trigger is the button itself. It used to be a <div onClick>
                    wrapping a <button>, so the focusable element and the element that
                    handled the click were different elements. */}
                <button
                    type="button"
                    className='inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                    onClick={() => this.activateCreateContentPopOver()}
                    title="Create a question, paper, channel or tag"
                    aria-expanded={this.props.generalInfo.isCreateContentPopupActive === true}
                >
                    <IoCreateOutline size={18} color={"currentColor"} aria-hidden="true"/>
                    <span className="hidden xl:inline">Create</span>
                    <span className="xl:hidden sr-only">Create</span>
                </button>
            </Popover>;
    }

    updateSearchText = (searchText) => {
        let generalInfo = typeof this.props.generalInfo === "undefined"?{}:{...this.props.generalInfo};
        generalInfo.searchText = searchText;
        generalInfo.isTagFilterViewActive = false;
        this.props.updateGeneralInfo(generalInfo);
        this.props.updateSearchText();
    }

    /**
     * Runs the search.
     *
     * This used to send the visitor to `/?search_text=...` — the home page, which
     * does not read that parameter. Only the question list does. So pressing Enter
     * in the header search box navigated away from wherever you were and showed you
     * the marketing page, with your query sitting unread in the URL. Search, the
     * single most-used control in the header, did nothing.
     *
     * The text is also encoded now. Unencoded, a query containing `&` or `#` was
     * truncated at that character, and one containing `+` arrived as a space.
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

    onSearchKeyDown = (event) => {
        if(event.key === 'Enter') {
            this.submitSearch();
        }
    }

    render(){
        if(typeof this.props.generalInfo == `undefined`){
            return <div/>
        }
        // App bar: fixed 64px height, contained to layout.container (the same gutter
        // as page content), single 'gap' spacing rhythm. The previous version used
        // percentage column widths plus ad hoc padding, so nothing lined up with the
        // page below it.
        return <header className="sticky top-0 z-max bg-white border-b border-gray-200">
            {/* Uses `layout.container` outright, gutter included, so the wordmark sits
                on exactly the same left edge as the content beneath it. */}
            <div className={layout.container}>
                <div className="flex items-center gap-4 lg:gap-6 h-16">

                    <button
                        type="button"
                        className="shrink-0 flex items-center gap-2 text-lg lg:text-xl tracking-tight text-gray-900 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                        onClick={() => window.location.href=currentURLHost}
                        aria-label="EducationalBridge home"
                    >
                        {/* h-9 leaves breathing room inside the 64px bar. This was h-16,
                            i.e. exactly the bar height, so the mark ran edge to edge and
                            read as a graphic rather than a logo. */}
                        <img src="/logo.svg" alt="" className="h-9 w-auto shrink-0" />
                        <span className="whitespace-nowrap">
                            <span className="font-normal">Educational</span><span className="font-extrabold text-primary-600">Bridge</span>
                        </span>
                    </button>

                    <nav className="hidden lg:flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={() => window.location.href=currentURLHost+"questions"}
                        >
                            Browse
                        </button>
                        <button
                            type="button"
                            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={() => window.location.href=currentURLHost+"channels"}
                        >
                            Channels
                        </button>
                    </nav>

                    {/* A real <form>, so Enter submits the way a search field is
                        expected to and assistive technology announces it as a search
                        landmark. */}
                    <form
                        className="flex-1 min-w-0 max-w-xl"
                        role="search"
                        onSubmit={(event) => { event.preventDefault(); this.submitSearch(); }}
                    >
                        <div className="relative">
                            <AiOutlineSearch
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="search"
                                className="w-full h-10 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                placeholder="Search questions and papers"
                                value={this.props.generalInfo==null ||this.props.generalInfo.searchText==null ? "": this.props.generalInfo.searchText}
                                onChange={(event) => this.updateSearchText(event.target.value)}
                                onKeyDown={(event)=> this.onSearchKeyDown(event)}
                                aria-label="Search questions and papers"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        {this.getCreateContentButton()}
                        {this.getLoginLogoutButtonJSX()}
                    </div>
                </div>
            </div>
        </header>
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EducationalBridgeHeaderLargeScreen);
