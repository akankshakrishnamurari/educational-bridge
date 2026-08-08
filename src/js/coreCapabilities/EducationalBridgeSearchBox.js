import React from 'react';

class EducationalBridgeSearchBox extends React.Component {
    
    render() {
        return <input 
            type="text" 
            class="w-6/12  bg-slate-100 h-12 w-full pr-8 pl-5 rounded-full z-0 focus:shadow focus:outline-none" 
            placeholder="Search Questions ..."
            onChange={(event)=>this.updateSearchedKey(event)}
        />
    }

}

export default (EducationalBridgeSearchBox);
