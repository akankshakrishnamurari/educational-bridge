import React from 'react';
import { connect } from 'react-redux';
import {updateNewTagDetails } from '../../store/actions/solgressAction';
import TagReceiver from '../../apis/TagReceiver';
import { generalTextSize } from '../../constants/TextSizeConstants';
import { tagPrefixPairMap } from '../../constants/tagPrefixPairMap';
import ClipLoader from "react-spinners/ClipLoader";
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import { typography } from '../../constants/designTokens';

const mapDispatchToProps = dispatch => ({
    updateNewTagDetails: (payload) => dispatch(updateNewTagDetails(payload))
})


const mapStateToProps = state => {
    return {
        newTagDetails: state.solgressReducer.newTagDetails
    }
}

class NewTagCreation extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
        this.initializeNewTagDetails = this.initializeNewTagDetails.bind(this)
    }

    initializeNewTagDetails = () => {
        let payload = {
            "tagName" : "",
            "tagDescription" : "",
            "tagPrefix" : "Subject : "
        }
        this.props.updateNewTagDetails(payload)
    }

    updateTagName = (event) => {
        let payload = {...this.props.newTagDetails}
        payload.tagName = (event.target.value)
        this.props.updateNewTagDetails(payload)
    }

    updateTagDescription = (event) => {
        let payload = {...this.props.newTagDetails}
        payload.tagDescription = event.target.value
        this.props.updateNewTagDetails(payload)
    }

    submitNewTag = () => {
        let payload ={...this.props.newTagDetails}
        payload.tagName =(payload.tagPrefix+payload.tagName)
        this.props.updateNewTagDetails(payload)
        TagReceiver.upsertNewTag(payload).then(tagData=>{
            notify.success("Tag created successfully.")
         })
    }
    updateTagPrefix = (event) => {
        let payload ={...this.props.newTagDetails}
        for(let index=0;index<tagPrefixPairMap.length;index++){
            if(tagPrefixPairMap[index].prefix == event.target.value){
                payload.tagPrefix=tagPrefixPairMap[index].prefix
            }
        }
        this.props.updateNewTagDetails(payload)
    }

    showTagPrefix = () => {
        return (
            <div className="flex flex-col gap-1">
                <label className={typography.label}>Tag Type</label>
                <select className="border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-fit"
                    value={this.props.newTagDetails.tagPrefix}
                    onChange={(event => this.updateTagPrefix(event))}
                >
                    {tagPrefixPairMap.map((option) => (

                        <option key={option.prefix} value={option.prefix}>
                            {option.inputPlaceholder} 
                        </option>

                    ))}
                </select>
            </div>
        )
    }
    render() {
        if(typeof window == `undefined`){
            return <div/>
        }
        if(this.props.newTagDetails === undefined){
            this.initializeNewTagDetails()
            return <div>
                <div className='bg-gray-50 min-h-screen'>
                    <EducationalBridgeHeader/>
                    <div className='flex justify-center py-20'>
                        <ClipLoader color="#2563EB" size="60"/>
                    </div>
                </div>
            </div>
        }
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col gap-4">
                    <div className={typography.h1}>Create a new tag</div>
                    {this.showTagPrefix()}
                    <div className="flex flex-col gap-1">
                        <label className={typography.label}>Tag Name</label>
                        <input className="w-full border border-gray-300 px-3 py-2 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 text-gray-700"
                            placeholder="Enter tag name" 
                            value = {this.props.newTagDetails.tagName}  
                            onChange = {(event) => this.updateTagName(event)}  
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={typography.label}>Description</label>
                        <textarea className="w-full resize-none border border-gray-300 px-3 py-2 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 text-gray-700"
                        placeholder="Describe this tag so others understand its purpose" 
                        value = {this.props.newTagDetails.tagDescription}
                        onChange = {(event) => this.updateTagDescription(event)}
                        rows="4"/>
                    </div>
                    <div>
                        <Button variant="primary" onClick={() => this.submitNewTag()}>
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div> 
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewTagCreation);
