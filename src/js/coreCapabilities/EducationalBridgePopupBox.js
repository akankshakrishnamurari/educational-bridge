import React from 'react';
import Popup from 'reactjs-popup';
import {AiOutlineClose} from "react-icons/ai";

/**
 * Modal sheet with a titled header and a close control.
 *
 * TWO ACCESSIBILITY FIXES
 * -----------------------
 * The trigger was a plain <div>. reactjs-popup attaches its open handler to
 * whatever element it is handed, so the only way to open any of these sheets was
 * a pointer click — the filters sheet on mobile and the question preview in the
 * paper builder were both unreachable by keyboard. It is a <button> now.
 *
 * The close control was also a <div onClick={close}>, so a sheet could be opened
 * (with a mouse) and then not closed without one. It is a <button> with a label.
 */
class EducationalBridgePopupBox extends React.Component {

    render() {
        return <Popup
            trigger={
                <button
                    type="button"
                    className={'inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded ' + (this.props.popupTriggerContentClassName || '')}
                    aria-label={this.props.triggerAriaLabel || this.props.postPopupContentHeaderLabel || 'Open'}
                >
                    {this.props.popupTriggerContent}
                </button>
            }
            modal
        >
            {close => (this.props.isPopupClosed?"":(
                <div className={"modal " + this.props.popupModalClassName}>
                    <div className='flex flex-col w-full'>
                        <div className={'flex flex-row items-center ' + this.props.postPopupContentHeaderClassName }>
                            <div className={'flex grow w-full justify-center'}>
                                {this.props.postPopupContentHeader}
                            </div>
                            <button
                                type="button"
                                className="shrink-0 flex items-center justify-center p-1.5 text-gray-600 hover:bg-danger-100 hover:text-danger-700 transition-colors focus:outline-none focus:ring-2 focus:ring-danger-500"
                                onClick={close}
                                aria-label="Close"
                            >
                                <AiOutlineClose className='w-5 h-5' aria-hidden="true"/>
                            </button>
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
