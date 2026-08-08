import React from 'react';
import Pagination from '@material-ui/lab/Pagination';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { AiFillSetting } from "react-icons/ai";
import { pagesizeOptionTextSize, generalTextSize, pagingSelectionButtonStyle } from '../../../constants/TextSizeConstants';

class PagingSection extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    getPageSettingPopupDiv = () => {
        let popupContent = <div className ='bg-gray-100 border-2 border-primary-400 z-50 px-2'>
                <div className='flex flex-row py-1'>
                    <div className={'text-gray-600 px-2' + generalTextSize}>
                        Page Number : 
                    </div>
                    <div className='px-2'>
                        <input type="number"
                            className="bg-white text-gray-600 px-1 border-2 text-center w-16 items-center "
                            name="custom-input-number"
                            min = "1"
                            max = {this.props.pageCount}
                            value={this.props.currentPageNumber}
                            onChange={(event)=>this.props.handlePageChange(event, event.target.value)}
                        />
                    </div>
                </div>
                <div className='flex flex-row py-1 justify-left'>
                    <div className={'text-gray-600 px-2' + generalTextSize}>
                        Page Size : 
                    </div>
                    <div className='px-2'>
                    <select className= {pagesizeOptionTextSize + pagingSelectionButtonStyle + ' px-1'}
                        value={this.props.currentPageSize}
                        onChange={(event => this.props.updatePageSize(event))}
                    >
                        <option className={pagesizeOptionTextSize} value="10">10</option>
                        <option className={pagesizeOptionTextSize} value="15">15</option>
                        <option className={pagesizeOptionTextSize} value="25">25</option>
                        <option className={pagesizeOptionTextSize} value="50">50</option>
                        <option className={pagesizeOptionTextSize} value="100">100</option>
                        <option className={pagesizeOptionTextSize} value="250">250</option>
                    </select>
                    </div>
                </div>
            </div>;
            return <Popover
                isOpen={this.props.isPageSettingsConfigOpen==undefined?false:this.props.isPageSettingsConfigOpen}
                positions={['right', 'bottom', 'left', 'up']} // preferred positions by priority
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
                onClickOutside = {() => this.props.togglePageSettingPopover()}  
            >
                <div className='py-5' onClick={()=>this.props.togglePageSettingPopover()}>
                    <AiFillSetting  size={30} color = {'gray'}/>
                </div>
            </Popover>;
    }

    render() {
        return <div className='flex flex-row flex justify-center'>
                <div className='px-4'>
                    <Pagination 
                        className = " text-xs md:text-sm xl:text-lg py-4 " 
                        size="large"  
                        count={this.props.pageCount} 
                        color="primary" 
                        variant="outlined"   
                        shape="rounded"  
                        page = {this.props.currentPageNumber}
                        showFirstButton 
                        showLastButton 
                        onChange={this.props.handlePageChange}/>
                </div>
                <div>
                    {this.getPageSettingPopupDiv()}
                </div>
            </div>
    }

}

export default PagingSection;
