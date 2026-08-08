import React from 'react';
import { connect } from 'react-redux';
import {saveUserDetails, updateGeneralInfo} from '../../store/actions/solgressAction'
import { MiscUtils } from '../../utils/MiscUtils';
import EducationalBridgeHeaderLargeScreen from './largeScreen/EducationalBridgeHeaderLargeScreen';
import EducationalBridgeHeaderSmallScreen from './smallScreen/EducationalBridgeHeaderSmallScreen';
import PaperAPIsConnector from '../../apis/PaperAPIsConnector';
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
    saveUserDetails = (payload) => {
        UserAPIConnector.updateUserDetails(payload).then(userData=>{
            console.log(5);
        });
    }
    render(){
        if(MiscUtils.isUserOnSmallScreen()){
            return <EducationalBridgeHeaderSmallScreen
                saveUserDetails = { this.saveUserDetails}
                updateSearchText = {() => this.props.updateSearchText()}/>
        } else {
            return <EducationalBridgeHeaderLargeScreen
                saveUserDetails = { this.saveUserDetails}
                updateSearchText = {() => this.props.updateSearchText()}/>
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(EducationalBridgeHeader);
// export default EducationalBridgeHeader;
