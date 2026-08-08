import React from 'react';
import Popup from 'reactjs-popup';
import {AiOutlineClose} from "react-icons/ai";


class EducationalBridgePopupBox extends React.Component {
    
    render() {
        return <Popup 
            trigger={
                <div className={this.props.popupTriggerContentClassName}>
                    {this.props.popupTriggerContent}
                </div>
            } 
            modal
        >    
            {close => (this.props.isPopupClosed?"":(
                <div className={"modal " + this.props.popupModalClassName}>
                    <div className=' flex flex-col w-full'>
                        <div className={'flex flex-row ' + this.props.postPopupContentHeaderClassName }>
                            <div className={'flex grow w-full justify-center'}> 
                                {this.props.postPopupContentHeader} 
                            </div> 
                            <div className="flex float-right bg-danger-200 " onClick={close}>
                                <AiOutlineClose className=' sm:w-6 sm:h-6 md:w-8 md:h-8 md:py-1 md:px-1'/>   
                            </div>
                        </div>
                        <div className={this.props.postpopupContentClassName}>     
                            {this.props.postPopupContent}
                        </div>
                    </div>                  
                </div>    
            ))}
        </Popup>;
    }

}

export default (EducationalBridgePopupBox);
