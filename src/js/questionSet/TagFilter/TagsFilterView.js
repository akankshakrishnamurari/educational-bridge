import React from 'react';
import { connect } from 'react-redux';
import {updateGeneralInfo} from '../../../store/actions/solgressAction';
import {generalTextSize} from '../../../constants/TextSizeConstants';
import { VscSettings } from "react-icons/vsc";
import TagFilterViewLarge from './TagFilterViewLarge';
import TagFilterViewSmall from './TagFilterViewSmall';

const mapDispatchToProps = dispatch => ({
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        generalInfo: state.solgressReducer.generalInfo
    };
}

class TagsFilterView extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    // getAuthorNameJSX = () => {
    //     return <div>
    //         <div className='flex flex-row'>
    //             <div className={generalTextSize + " px-2 "}>
    //                 Author Name : 
    //             </div>
    //             <div>
    //                 <input className={generalTextSize + " border border-gray-300  pl-3 py-3 shadow-sm rounded focus:outline-none focus:border-primary-700 bg-transparent placeholder-gray-500 text-gray-600 "}
    //                     placeholder="Author Name" 
    //                     // value = {this.props.newChannelDetails.channelName}  
    //                     // onChange = {(event) => this.updateChannelName(event)}  
    //                 />
    //             </div>
    //         </div>
    //     </div>
    // }

    // getSubjectNameJSX = () => {

    // }

    // getTopicNameJSX = () => {

    // }

    // getExamNameJSX = () => {

    // }

    // getOtherNamesJSX= () => {

    // }
    render(){
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
            return <TagFilterViewSmall/>
          }else{
            return <TagFilterViewLarge/>
          }
        //   updateGeneralInfo = {() => this.props.generalInfo()}
    }
    // render() {
    //     return <div className='border border-primary-300'>
    //         <div className='flex flex-row justify-center'>
    //             <div>
    //                 <VscSettings size={30} color={"blue"}></VscSettings>
    //             </div>
    //             <div className='px-3'>
    //                 Apply Filter
    //             </div>
    //         </div>
    //         {/* {this.getAuthorNameJSX()}
    //         {this.getSubjectNameJSX()}
    //         {this.getTopicNameJSX()}
    //         {this.getExamNameJSX()}
    //         {this.getOtherNamesJSX()} */}
    //     </div>
    // }
}

export default connect(mapStateToProps, mapDispatchToProps)(TagsFilterView);
