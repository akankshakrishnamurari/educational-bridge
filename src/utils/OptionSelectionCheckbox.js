import React from 'react';
import {AiOutlinePlus, AiOutlineCheck} from "react-icons/ai";

/**
 * Add / remove toggle for picking a question into a paper section.
 *
 * WHAT WAS WRONG
 * --------------
 * Each state was a `<div onClick={...}>` wrapping a `<button>` with no handler of
 * its own. The element that responded to the click was the div, and the div was not
 * focusable, so the control could not be operated by keyboard at all — the whole
 * question-selection step of the paper builder was pointer-only. It also announced
 * nothing: the icon carried no label, so a screen reader read an empty button.
 *
 * It is now one <button> per state, labelled, with the icon marked decorative.
 */
class OptionSelectionCheckbox extends React.Component {

    render() {
        const isSelected = this.props.isSelected === true;
        const label = this.props.label || 'this question';
        if (isSelected) {
            return <button
                type="button"
                className="mx-1 sm:mx-2 bg-success-500 hover:bg-success-600 text-white transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-success-500"
                onClick={()=>this.props.markAsUnselected(this.props.identifier)}
                aria-label={'Remove ' + label + ' from this section'}
                title={'Remove ' + label + ' from this section'}
            >
                <AiOutlineCheck className="px-1 py-1 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true"/>
            </button>;
        }
        return <button
            type="button"
            className="mx-1 sm:mx-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500"
            onClick={()=>this.props.markAsSelected(this.props.identifier)}
            aria-label={'Add ' + label + ' to this section'}
            title={'Add ' + label + ' to this section'}
        >
            <AiOutlinePlus className="px-1 py-1 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true"/>
        </button>;
    }

}

export default OptionSelectionCheckbox;
