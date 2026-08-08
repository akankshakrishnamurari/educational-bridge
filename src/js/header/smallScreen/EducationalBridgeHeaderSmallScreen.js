import React from 'react';
import { connect } from 'react-redux';
import {saveUserDetails, updateGeneralInfo} from '../../../store/actions/solgressAction'
import GoogleLogout from 'react-google-login';
import {headerTextViewClass, logoTextCSS, headerLoginButtonViewClass, searchBoxCSS, headerLoginTextClass, searchBoxInputCSS} from '../../../constants/TextSizeConstants';
import { currentURLHost, currentGoogleLoginAPIKey} from '../../../constants/hostConfig';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { VscSettings } from "react-icons/vsc";
import { AiOutlineSearch } from "react-icons/ai";
import { GoogleLogin } from 'react-google-login';
// import styleHeader from '../../header/styleHeader.css'
import EducationalBridgePopupBox from '../../coreCapabilities/EducationalBridgePopupBox';
import TagFilterViewSmall from '../../questionSet/TagFilter/TagFilterViewSmall';
import {BsArrowLeft, BsClipboardPlus} from "react-icons/bs";
import {FcGoogle} from "react-icons/fc"

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

class EducationalBridgeHeaderSmallScreen extends React.Component {

    componentDidMount(){
        this.setState(
            {
                documentLoaded:true,
            }
        );
    }

    initializeTagFilterView = () => {
        let generalInfo = {};
        generalInfo.isTagFilterViewActive = false;
        generalInfo.temporarySelectedTags=[];
        generalInfo.selectedTags=[];        
        generalInfo.isViewingQuestions = true;
        generalInfo.isViewingPapers = false;
        generalInfo.isSearchActive = false;
        this.props.updateGeneralInfo(generalInfo)
    }

    handleGoogleLoginResponse = (response) => {
        window.sessionStorage.setItem("userDetails", JSON.stringify(response.profileObj));
        this.props.saveUserDetails(response.profileObj);
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
                                    <FcGoogle size={18}/>
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
            let popupContent = <div className='w-screen md:w-64 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50'>
                <div className='z-50 py-2 px-4 text-gray-700 text-sm hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMySolvedPapers}>My Solved Papers</div>
                <div className='z-50 py-2 px-4 text-gray-700 text-sm hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMySolvedQuestions}>My Solved Questions</div>
                <div className='z-50 py-2 px-4 text-gray-700 text-sm hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMyCreatedPapers}>My created Papers</div>
                <div className='z-50 py-2 px-4 text-gray-700 text-sm hover:bg-primary-50 hover:text-primary-700' onClick={this.moveToMyCreatedQuestions}>My Created Questions</div>
                <div className='flex px-4 pt-1 justify-center' onClick={()=>this.handleGoogleLogoutResponse()}>
                    <GoogleLogout
                        clientId = {currentGoogleLoginAPIKey}
                        buttonText="Logout"
                    />
                </div>
            </div>;
            return <Popover
                isOpen={
                    (window.sessionStorage.getItem("userDetails")==="null" || window.sessionStorage.getItem("userDetails")===undefined || JSON.parse(window.sessionStorage.getItem("userDetails")).hasOwnProperty('isUserLoginContentPopupEnabled') ===false)
                        ? false
                        : JSON.parse(window.sessionStorage.getItem("userDetails")).isUserLoginContentPopupEnabled
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
                      arrowClassName='popover-arrow'
                    >
                      {popupContent}
                    </ArrowContainer>
                  )}
                  onClickOutside = {() => this.toggleLoginPopOver()}  
            >
            <img class="rounded-full w-9 h-9 " 
                src={JSON.parse(window.sessionStorage.getItem("userDetails")).imageUrl}
                referrerpolicy="no-referrer"
                onClick={() => this.toggleLoginPopOver()}
            />
          </Popover>;
        }
    }

    getSideBarHamBurger = () => {
        return <div className ={headerLoginButtonViewClass}>
            {this.getLoginLogoutButtonJSX()}
        </div>;
    }

    updateSearchText = (event) => {
        let generalInfo = typeof this.props.generalInfo === "undefined"?{}:{...this.props.generalInfo};
        generalInfo.searchText = event.target.value;
        generalInfo.isTagFilterViewActive = false;
        this.props.updateGeneralInfo(generalInfo);
        this.props.updateSearchText();
    }

    getFilterViewJSX = () => {
        let triggerJSX = <div className="">
            <div className='flex flex-col' onClick={() => this.activateTagFilterView()}>
                <div>
                    <VscSettings size={22} color={"#475569"}></VscSettings>
                </div>
            </div>
        </div>;

        let postPopupContent = <TagFilterViewSmall/>;
        let isPopupClosed = !this.props.generalInfo.isTagFilterViewActive ;
        return <EducationalBridgePopupBox
                popupModalClassName = " bg-white border  shadow flex w-screen"
                popupTriggerContentClassName = ""
                popupTriggerContent = {triggerJSX}
                postPopupContentHeaderClassName = "bg-primary-100 border-t-2 border-l-2 border-r-2 rounded-t-lg border-gray-400"
                postPopupContentHeader = "Filters"
                postpopupContentClassName = "bg-white border-2 border-gray-400 rounded-b-lg"
                postPopupContent = {postPopupContent}
                isPopupClosed = {true}
            />;
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

    activateTagFilterView = () => {
        let payload = {...this.props.generalInfo};
        payload.isTagFilterViewActive = true;
        this.props.updateGeneralInfo(payload);
    }

    getHeaderWithActiveSearch = () => {
        return <div className="w-full bg-white border-b border-gray-200 pb-2">
                <div>
                    <div className="flex flex-row items-center pt-2">
                        <div className='px-2' onClick={() => this.inactivateSearchHeader()}>
                            <BsArrowLeft size={26} color="#475569"/>
                        </div>
                        <div className='flex-1 pr-2'>
                            <div className={searchBoxCSS + ' flex grow items-center'}>
                                <div className='py-1 pl-4 rounded-l-full'>
                                    {this.getFilterViewJSX()}
                                </div>
                                <input 
                                    type="text" 
                                    className = { searchBoxInputCSS + " w-full focus:outline-none rounded"}
                                    placeholder="Search here..."
                                    value={this.props.generalInfo==null ||this.props.generalInfo.searchText==null ? "": this.props.generalInfo.searchText}
                                    onChange={(event) => this.updateSearchText(event)}
                                />
                            </div>    
                        </div>
                        <div className ={'flex flex-row justify-end pr-2 py-1 pl-1' }>  
                            {this.getLoginLogoutButtonJSX()}
                        </div>
                    </div>
                </div>
            </div>;
    }

    getHeaderWithInactiveSearch = () => {
        let filterTriggerJSX = <button className='pr-3 pt-3' onClick={() => this.activateTagFilterView()}>
            <VscSettings size={30} color={"#475569"} />
        </button>
        let filterPostPopupContent = <TagFilterViewSmall/>;
        let isFiltePopupClosed = !this.props.generalInfo.isTagFilterViewActive ;
        let filterPopup = <EducationalBridgePopupBox
                popupModalClassName = " bg-white border  shadow flex w-screen"
                popupTriggerContentClassName = ""
                popupTriggerContent = {filterTriggerJSX}
                postPopupContentHeaderClassName = "bg-primary-100 border-t-2 border-l-2 border-r-2 rounded-t-lg border-gray-400"
                postPopupContentHeader = "Filters"
                postpopupContentClassName = "bg-white border-2 border-gray-400 rounded-b-lg"
                postPopupContent = {filterPostPopupContent}
                isPopupClosed = {isFiltePopupClosed}
            />;
        let customPaperTriggerJSX = <button className='pr-4 pt-4' onClick={() => this.activateTagFilterView()}>
            <BsClipboardPlus size={25} color={"#475569"} />
        </button>
        let customPaperPostPopupContent = <TagFilterViewSmall/>;
        let isCustomPaperPopupClosed = !this.props.generalInfo.isTagFilterViewActive ;
        let customPaperPopup = <EducationalBridgePopupBox
                popupModalClassName = " bg-white border  shadow flex w-screen"
                popupTriggerContentClassName = ""
                popupTriggerContent = {customPaperTriggerJSX}
                postPopupContentHeaderClassName = "bg-primary-100 border-t-2 border-l-2 border-r-2 rounded-t-lg border-gray-400"
                postPopupContentHeader = "Filters"
                postpopupContentClassName = "bg-white border-2 border-gray-400 rounded-b-lg"
                postPopupContent = {customPaperPostPopupContent}
                isPopupClosed = {isCustomPaperPopupClosed}
            />;
        return <div className="flex flex-row sticky top-0 z-max w-full h-14">
                <div className="w-full">
                    <div className="flex flex-row items-center w-full h-full">
                        {/* Logo is capped below the bar height so it reads as a
                            standard header logo rather than filling the whole bar. */}
                        <button className={" flex items-center gap-1.5 h-full md:row-span-1 row-span-2 " + logoTextCSS}  onClick={() => window.location.href=currentURLHost}>
                            <img src="/logo.svg" alt="" className="h-8 w-auto shrink-0" />
                            <span className="whitespace-nowrap tracking-tight">
                                <span className="font-normal">Educational</span><span className="font-extrabold text-primary-600">Bridge</span>
                            </span>
                        </button>
                        <div className ={'flex flex-row items-center justify-end pr-4 py-2 pl-2 flex-1' }>
                            <button className='pr-2' onClick={() => this.enableSearchHeader()}>
                                <AiOutlineSearch size={26} color={"#475569"} ></AiOutlineSearch>
                            </button>  
                            {
                                this.props.generalInfo.isSearchActive
                                    ? ""
                                    : filterPopup
                            }
                            <button>
                                {this.getLoginLogoutButtonJSX()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>;
    }

    render(){
        if(typeof this.props.generalInfo == `undefined`){
            this.initializeTagFilterView();
            return <div/>
        }
        return <div className = "sticky top-0 bg-white border-b border-gray-200 flex flex-row">
                {this.props.generalInfo.isSearchActive?this.getHeaderWithActiveSearch():this.getHeaderWithInactiveSearch()}
            </div>
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EducationalBridgeHeaderSmallScreen);
