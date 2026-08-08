import React from 'react';
import {AiOutlinePlus, AiOutlineCheck} from "react-icons/ai";


class OptionSelectionCheckbox extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    getInCorrectOptionSelectionCheckbox = () => {
        return <div onClick={()=>this.props.markAsSelected(this.props.identifier)}>
            <div className="flex items-center">
                <div className="flex flex-col">
                    <button className="mx-1 sm:mx-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 transition-colors rounded-lg ">
                        <AiOutlinePlus className = "px-1 py-1 w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6"/>
                    </button>
                </div>
            </div>
        </div>;
    }

    getCorrectOptionSelectionCheckbox = () => {
        return <div onClick={()=>this.props.markAsUnselected(this.props.identifier)}>
            <div className="flex items-center">
                <div className="flex flex-col">
                    <button className="mx-1 sm:mx-2  bg-success-500 transition duration-150 ease-in-out rounded ">
                        <AiOutlineCheck className = "px-1 py-1 w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6"/>
                    </button>
                </div>
            </div>
        </div>;
    }

    render() {
        return (this.props.isSelected)?this.getCorrectOptionSelectionCheckbox():this.getInCorrectOptionSelectionCheckbox();
    }

}

export default OptionSelectionCheckbox;
