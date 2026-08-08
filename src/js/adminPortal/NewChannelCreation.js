import React from 'react';
import { connect } from 'react-redux';
import {updateNewChannelDetails} from '../../store/actions/solgressAction';
import ChannelReceiver from '../../apis/ChannelReceiver';
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    updateNewChannelDetails: (payload) => dispatch(updateNewChannelDetails(payload))
})


const mapStateToProps = state => {
    return {
        newChannelDetails: state.solgressReducer.newChannelDetails
    };
}

class NewChannelCreation extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeNewChannelDetails = this.initializeNewChannelDetails.bind(this);
    }

    initializeNewChannelDetails = () => {
        let payload = {
            "channelName" : "",
            "channelDescription" : ""
        }
        this.props.updateNewChannelDetails(payload);
    }

    updateChannelName = (event) => {
        let payload = {...this.props.newChannelDetails}
        payload.channelName = event.target.value;
        this.props.updateNewChannelDetails(payload);
    }

    updateChannelDescription = (event) => {
        let payload = {...this.props.newChannelDetails};
        payload.channelDescription = event.target.value;
        this.props.updateNewChannelDetails(payload);
    }

    submitNewChannel = () => {
        ChannelReceiver.upsertChannel(this.props.newChannelDetails).then(channelData=>{
            notify.success("Channel created successfully.");
         });
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.newChannelDetails === undefined){
            this.initializeNewChannelDetails();
            return <div></div>;
        }
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col gap-4">
                    <div className={typography.h1}>Create a new channel</div>
                    <div className="flex flex-col gap-1">
                        <label className={typography.label}>Channel Name</label>
                        <input className="w-full border border-gray-300 px-3 py-2 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 text-gray-700"
                         placeholder="Enter channel name" 
                         value = {this.props.newChannelDetails.channelName}  
                         onChange = {(event) => this.updateChannelName(event)}  
                         />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={typography.label}>Description</label>
                        <textarea className="w-full resize-none border border-gray-300 px-3 py-2 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 text-gray-700"
                         placeholder="Describe this channel so others understand its purpose" 
                         value = {this.props.newChannelDetails.channelDescription}
                         onChange = {(event) => this.updateChannelDescription(event)}
                         rows="4"/>
                    </div>
                    <div>
                        <Button variant="primary" onClick={() => this.submitNewChannel()}>
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewChannelCreation);
