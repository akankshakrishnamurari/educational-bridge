import React from 'react';
import { connect } from 'react-redux';
import {saveUserDetails, updateGeneralInfo} from '../../../store/actions/solgressAction'
import GoogleLogout from 'react-google-login';
// The header now styles its own controls inline (see render), so only the two
// still-referenced shared class strings are imported.
import {headerLoginButtonViewClass, generalTextSize} from '../../../constants/TextSizeConstants';
import { layout } from '../../../constants/designTokens';
import { currentURLHost } from '../../../constants/hostConfig';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { currentGoogleLoginAPIKey, currentHost } from '../../../constants/hostConfig';
import { VscSettings } from "react-icons/vsc";
import { AiOutlineSearch } from "react-icons/ai";
import { GoogleLogin } from 'react-google-login';
import {FcGoogle} from "react-icons/fc"
import TagFilterViewSmall from '../../questionSet/TagFilter/TagFilterViewSmall';
import TagFilterViewLarge from '../../questionSet/TagFilter/TagFilterViewLarge'
// import styleHeader from '../../header/styleHeader.css'
// import leftSideBar from src\js\questionSet\TagFilter\leftSideBar.css
// import leftSideBar from '../../questionSet/TagFilter/leftSideBar'
// import './TagFilter/leftSideBar.css';
import {BsClipboardPlus} from "react-icons/bs";
import {IoCreateOutline} from "react-icons/io5"
import {MdExitToApp} from "react-icons/md";

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

class EducationalBridgeHeaderLargeScreen extends React.Component {

    componentDidMount(){
        this.setState(
            {
                documentLoaded:true,
            }
        );
    }
    initializeTagFilterView = () => {
        let generalInfo = {};
        generalInfo.isTagFilterViewActive = true;
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

    handleGoogleLoginFailureResponse = (response) => {
        console.log("response from login failed");
    }

    handleGoogleLogoutResponse = () => {
        window.sessionStorage.setItem("userDetails", null);
        this.props.saveUserDetails(undefined);
        window.location.reload();
    }

    toggleLoginPopOver = () => {
        // let userDetails = {...this.props.userDetails};
        let userDetails = {... JSON.parse(window.sessionStorage.getItem("userDetails"))}
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
        payload.isCreateContentPopupActive = true;
        this.props.updateGeneralInfo(payload);
    }

    inactivateCreateContentPopOver = () => {
        let payload = {...this.props.generalInfo};
        payload.isCreateContentPopupActive = false;
        this.props.updateGeneralInfo(payload);
    }

    toggleLoginPopOverWithoutReload = () => {
        let userDetails = {... JSON.parse(window.sessionStorage.getItem("userDetails"))}
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
        if(window.sessionStorage.getItem("userDetails") === null || window.sessionStorage.getItem("userDetails") === "null") {
            // return  <div id = "signInDiv" className='flex w-full sm:justify-end'/>;
            return <div className='bg-white rounded-full shadow-sm'>
                    <GoogleLogin
                        clientId = {currentGoogleLoginAPIKey}
                        // buttonText = {"Login"}
                        render={renderProps => (
                            <div className='flex flex-row items-center pl-3 pr-4 rounded-full h-9'  onClick={renderProps.onClick} >
                                <button className='pr-2 rounded flex items-center'>
                                    <FcGoogle size={20}/>
                                </button>
                                <button className='text-primary-700 font-medium text-sm'>
                                    Login
                                </button>
                            </div>
                        )}
                        onSuccess={this.handleGoogleLoginResponse}
                        onFailure = {this.handleGoogleLoginFailureResponse}
                        cookiePolicy = 'none'
                    />
            </div>;
        } else {
            let popupContent = <div className='pt-3'>
                    <div className={'w-screen md:w-64 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50 ' + generalTextSize }>
                        <div className='z-50 cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMySolvedPapers}>My Solved Papers</div>
                        <div className='z-50 cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMySolvedQuestions}>My Solved Questions</div>
                        <div className='z-50 cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMyCreatedPapers}>My created Papers</div>
                        <div className='z-50 cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMyCreatedQuestions}>My Created Questions</div>
                        <div className='cursor-pointer flex justify-center pt-1 px-2'>
                            <GoogleLogout
                                clientId = {currentGoogleLoginAPIKey}
                                render={renderProps => (
                                    <div className='flex flex-row rounded-lg h-9 pl-3 pr-4 bg-danger-600 hover:bg-danger-700 transition-colors w-full items-center justify-center'  onClick={renderProps.onClick} >
                                        <button className='py-1 rounded'>
                                            <MdExitToApp size={20} color={'white'}/>
                                        </button>
                                        <button className='py-1 pl-1 text-white font-medium'>
                                            Sign out
                                        </button>
                                    </div>
                                )}
                                buttonText="Logout"
                            />
                        </div>
                    </div>
                </div>;
            return <Popover
                isOpen={
                    (this.props.userDetails ===  undefined || this.props.userDetails == null || this.props.userDetails.isUserLoginContentPopupEnabled ===false)
                        ? false
                        : this.props.userDetails.isUserLoginContentPopupEnabled
                    }
                positions={['bottom', 'left', 'right', 'up']} // preferred positions by priority
                content={({ position, childRect, popoverRect }) => (
                    <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
                      position={position}
                      childRect={childRect}
                      popoverRect={popoverRect}
                      arrowColor={'blue'}
                      arrowSize={10}
                      arrowStyle={{ opacity: 0.7 }}
                      className='popover-arrow-container'
                      arrowClassName='popover-arrow pt-3'
                    >
                      {popupContent}
                    </ArrowContainer>
                  )}
                  onClickOutside = {() => this.toggleLoginPopOver()}  
            >
            <button onClick={() => this.toggleLoginPopOver()}>
                <img 
                    class="rounded-full w-10 h-10  md:w-12 md:h-12" 
                    src={JSON.parse(window.sessionStorage.getItem("userDetails")).imageUrl}
                    referrerpolicy="no-referrer"
                />
            </button>
          </Popover>;
        }
    }

    getCreateContentButton = () => {
        let contentButtonJSX = <button
            className='inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors'
            title="Create a question, paper, channel or tag"
        >
            {/* currentColor so the icon follows the button's text colour */}
            <IoCreateOutline size={18} color={"currentColor"} />
            <span className="hidden xl:inline">Create</span>
        </button>
    let popupContent = <div className={'w-screen md:w-56 py-2 bg-white rounded-lg shadow-lg border border-gray-100 sticky top-0 z-max ' + generalTextSize}>
        <div className='z-max cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700' 
            onClick={()=>window.location.href=currentURLHost+"question/upsert"}>
            New Question
        </div>
        <div className='z-max cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700'
            onClick={()=>window.location.href=currentURLHost+"paper/new"}>
            New Paper
        </div>
        <div className='z-max cursor-pointer py-2 px-4 hover:bg-primary-50 hover:text-primary-700'
            onClick={()=>window.location.href=currentURLHost+"tags/new"}>
            New Tag
        </div>
    </div>;
    return <Popover
            isOpen={this.props.generalInfo.isCreateContentPopupActive}
            positions={['bottom', 'left', 'right', 'up']} // preferred positions by priority
            content={({ position, childRect, popoverRect }) => (
                <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
                    position={position}
                    childRect={childRect}
                    popoverRect={popoverRect}
                    arrowColor={'#FFFFFF'}
                    arrowSize={10}
                    arrowStyle={{ opacity: 0.9 }}
                    className='popover-arrow-container'
                    arrowClassName='popover-arrow'
                >
                    {popupContent}
                </ArrowContainer>
                )}
                onClickOutside = {() => this.inactivateCreateContentPopOver()}  
        >
            <div onClick={() => this.activateCreateContentPopOver()}>
                {contentButtonJSX}
            </div>
        </Popover>;
    }

    getSideBarHamBurger = () => {
        return <div className ={headerLoginButtonViewClass}>
            {this.getLoginLogoutButtonJSX()}
        </div>;
    }

    updateSearchText = (searchText) => {
        let generalInfo = typeof this.props.generalInfo === "undefined"?{}:{...this.props.generalInfo};
        generalInfo.searchText = searchText;
        generalInfo.isTagFilterViewActive = false;
        this.props.updateGeneralInfo(generalInfo);
        this.props.updateSearchText();
    }

    oneEnterEvent = (event) => {
        if(event.key === 'Enter') {
            this.redirectToHomePageSearch();
        }
    }

    // scrollHandler = () =>{
    //     let moving = window.pageYOffset;
    //     this.props.generalInfo.visible=(this.props.generalInfo.position > moving);
    //     this.props.generalInfo.position=moving;
    //     window.addEventListener("scroll", scrollHandler);
    //     return  window.removeEventListener("scroll", scrollHandler);

    // }
    // handleScroll = () =>{
    //     let moving = window.pageYOffset;   
    //     this.props.generalInfo.visible=(this.props.generalInfo.position > moving);
    //     this.props.generalInfo.Position=(moving);
    // }
    updateTagFilterActive = () =>{
        let payload ={...this.props.generalInfo};
        if(payload.isTagFilterViewActive==true){
            payload.isTagFilterViewActive=false;
        }
        else{
            payload.isTagFilterViewActive=true;
        }
        this.props.updateGeneralInfo(payload);
    }

    getFilterView = () => {
        // return <div>
        //     prakasj
        //     <div/>
        if(this.props.generalInfo.isTagFilterViewActive==true){
            return (
                <div className='py-20 pl-20 '>
                    {/* <TagFilterViewLarge/> */}
                </div>
            );
        }
        else{
            return <div></div>;
        }
        // return <div>
        //     <TagFilterViewLarge/>;
        // </div>
    } 
    
    redirectToHomePageSearch = () => {
        window.location.href = currentURLHost + "?search_text=" + this.props.generalInfo.searchText;
    }

    render(){
        // let generalInfo = typeof this.props.generalInfo === "undefined"?{}:{...this.props.generalInfo};
        // let position=window.pageYOffset;let visible=true;
        // generalInfo.position=position;
        // generalInfo.visible=visible;
        // // this.props.updateGeneralInfo(generalInfo);
        // window.addEventListener("scroll", this.props.handleScroll);
        // const cls = generalInfo.visible ? "visible" : "hidden";

        if(typeof this.props.generalInfo == `undefined`){
            this.initializeTagFilterView();
            return <div/>
        }
        {/* App bar: fixed 64px height, contained to layout.container (the same gutter
            as page content), single 'gap' spacing rhythm. The previous version used
            percentage column widths (lg:min-w-[20%]) plus ad hoc px-10 / pl-12
            padding, so nothing lined up with the page below it. */}
        return <header className="sticky top-0 z-max bg-white border-b border-gray-200">
            {/* Deliberately not `layout.container` here: that class carries the page's
                left/right gutter (px-4 sm:px-6 lg:px-8), which pushed the logo in from
                the edge. The header keeps the same max-width/centring so it still lines
                up on ultrawide screens, just without the side padding. */}
            <div className="w-full max-w-[1800px] mx-auto">
                <div className="flex items-center gap-4 lg:gap-6 h-16">

                    {/* Wordmark: logo is capped below the bar height so it reads as a
                        standard header logo rather than filling the whole bar. */}
                    <button
                        className="shrink-0 flex items-center gap-2 text-lg lg:text-xl tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
                        onClick={() => window.location.href=currentURLHost}
                        aria-label="EducationalBridge home"
                    >
                        <img src="/logo.svg" alt="" className="h-16 w-auto shrink-0" />
                        <span className="whitespace-nowrap">
                            <span className="font-normal">Educational</span><span className="font-extrabold text-primary-600">Bridge</span>
                        </span>
                    </button>

                    {/* Primary nav */}
                    <nav className="hidden lg:flex items-center gap-1 shrink-0">
                        <button
                            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            onClick={() => window.location.href=currentURLHost+"questions"}
                        >
                            Browse
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            onClick={() => window.location.href=currentURLHost+"channels"}
                        >
                            Channels
                        </button>
                    </nav>

                    {/* Search: grows to fill, capped so it doesn't sprawl on wide screens */}
                    <div className="flex-1 min-w-0 max-w-xl">
                        <div className="relative">
                            <AiOutlineSearch
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                className="w-full h-10 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                placeholder="Search questions and papers"
                                value={this.props.generalInfo==null ||this.props.generalInfo.searchText==null ? "": this.props.generalInfo.searchText}
                                onChange={(event) => this.updateSearchText(event.target.value)}
                                onKeyDown={(event)=> this.oneEnterEvent(event)}
                                aria-label="Search questions and papers"
                            />
                        </div>
                    </div>

                    {/* Actions */}
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
