import React from 'react';
import Split from "react-split";
import { connect } from 'react-redux';
import {savePaperSet} from '../../store/actions/solgressAction';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import TagReceiver from "../../apis/TagReceiver";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { BsEyeFill } from "react-icons/bs";
import { BsFillPencilFill } from "react-icons/bs";
import { AiFillTags } from 'react-icons/ai'
import { JSXUtils } from '../../utils/JSXUtils';
import {MiscUtils} from "../../utils/MiscUtils";
import PaperSetSearchBoxComponent from './PaperSetSearchBoxComponent';
import ChannelReceiver from '../../apis/ChannelReceiver';
import {searchBoxCSS, buttonBesideSearchBoxCSS, 
    searchTableHeaderCellCSS, clickableSearchTableBodyCellTextCSS,
    nonClickableSearchTableBodyCellTextCSS,
    generalTextSize} from './../../constants/TextSizeConstants';
import {currentURLHost} from './../../constants/hostConfig';


const mapDispatchToProps = dispatch => ({
    savePaperSet: (payload) => dispatch(savePaperSet(payload))
})


const mapStateToProps = state => {
    return {
        paperSet: state.solgressReducer.paperSet
    };
}

class PaperSet extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializePapers = this.initializePapers.bind(this);
        this.openPaperEditingViewInNewTab = this.openPaperEditingViewInNewTab.bind(this);
    }

    getPreDecidedTags = async () => { // Workaround : In case it's linked from my created papers. We pick this tag from session storage
        if( window.sessionStorage.getItem('createdByMe')==="true" ){
            let tags = [];
            await TagReceiver.getUserResourceCreationTag(JSON.parse(sessionStorage.getItem("userDetails")).email).then( tagData=> {
                    tags.push({...tagData.data})
                }
            );
            return tags;
        }
        return [];
    }

    resetResourceCreationSessionStorage = () => {
        window.sessionStorage.setItem('createdByMe',"false");
    }

    initializePapers = async () => {
        let tags = await this.getPreDecidedTags();
        const search = window.location.search;
        const channelId = new URLSearchParams(search).get('channel_id');
        let channelIds = [];
        channelIds.push(channelId);
        let channels = [];
        let tagIds = [];
        tags.forEach(tag => {
            tagIds.push(tag.id);
        });

        await PaperAPIsConnector.getAllFilteredPapers("",tagIds, channelIds).then(paperData=>{
            if(channelId !== undefined && channelId !== null) {
                ChannelReceiver.getChannelDetails(channelId).then(channelData=>{
                    channels.push({...channelData.data});
                    let payload = {};
                    payload.tags = tags;
                    payload.channels = channels;
                    payload.suggestedTags = [];
                    payload.suggestedChannels = [];
                    payload.isTagSearchActive = false;
                    payload.isChannelSearchActive = true;
                    payload.papers = paperData.data;
                    payload.searchedKey = "";
                    payload.helpSectionEnabled = false;
                    payload.searchCriteria = "SEARCH_BY_PAPER_NAME";
                    this.props.savePaperSet(payload);
                });
            } else {
                let payload = {};
                payload.tags = tags;
                payload.channels = channels;
                payload.suggestedTags = [];
                payload.suggestedChannels = [];
                payload.isTagSearchActive = false;
                payload.isChannelSearchActive = true;
                payload.papers = paperData.data;
                payload.searchedKey = "";
                payload.helpSectionEnabled = false;
                payload.searchCriteria = "SEARCH_BY_PAPER_NAME";
                this.props.savePaperSet(payload);
            }
        });
    }

    openPaperEditingViewInNewTab = (paperId) => {
        window.open(currentURLHost + 'paper/upsert?paper_id=' + paperId);
    }

    openPaperSubmissionViewInNewTab = (paperId) => {
        window.open(currentURLHost + 'paper/view?paper_id=' + paperId + '&paper_instance_id='+ MiscUtils.generateUUID());
    }

    redirectToPaperSubmissionViewInSameTab = (paperId) => {
        window.location.href = currentURLHost + 'paper/view?paper_id=' + paperId + '&paper_instance_id='+ MiscUtils.generateUUID();
    }

    getPapersTableHeaderJSX = () => {
        return <TableRow className = 'bg-gray-100'>
            <TableCell className='border border-slate-300'>
                <p className={searchTableHeaderCellCSS}>
                    Papers
                </p>
            </TableCell>
            {/* <TableCell className='border border-slate-300'>
                <p className={"justify-center" + searchTableHeaderCellCSS}>
                    View
                </p>
            </TableCell> */}
            <TableCell className='border border-slate-300 max-w-[15%]'>
                <div className={"flex justify-center " + searchTableHeaderCellCSS}>
                    Edit (Upcoming)
                </div>
            </TableCell>
        </TableRow>;
    }

    getPaperTagsDivJSX = (paper) => {
        if (paper.tags === undefined || paper.tags.length === 0) {
            return;
        }
        let response = [];
        paper.tags.forEach(tag=> {
            response.push(
                <span className='px-1'>
                    <span className='px-1 rounded-xl px-3 bg-gray-100 text-xs' /*style={{'white-space':'nowrap'}}*/>{tag.tagName}</span>
                </span>
            )
        });
        return <div className='flex flex-row ...'>
            <div className='flex justify-top ...'>
                <span className='px-2'><AiFillTags size={15} color = {'gray'}/></span>
            </div>
            <div className=''>
                {response}
            </div>
        </div>;
    }

    getPapersTableBodyRowsJSX = () => {
        let tableRows = [];
        if(this.props.paperSet.length===0) {
            let noTableFoundRow =<TableRow className="hover:bg-slate-100">
                <TableCell>
                    <p className={"flex justify-center " + generalTextSize }>                    
                        No paper found with matching filters.
                    </p>
                </TableCell>
            </TableRow>
            tableRows.push(noTableFoundRow);
            return tableRows;
        }
        this.props.paperSet.papers.forEach((paper, index) => {
            let newRow = <TableRow className="hover:bg-slate-100">
                <TableCell>
                    <div className="flex flex-col w-full...">
                        <p className={clickableSearchTableBodyCellTextCSS}
                            onClick = {()=>this.redirectToPaperSubmissionViewInSameTab(paper.id)}
                        >
                            <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(paper.paper_name)}}></div>
                        </p>
                    </div>
                    <div className = "flex flex-row ...">
                    {this.getPaperTagsDivJSX(paper)}
                    </div>
                </TableCell>
                {/* <TableCell className='border border-slate-300 flex justify-center ...'>
                    <div className='flex justify-center ...'>
                        <BsEyeFill size={15} color = {'darkblue'} onClick = {()=>this.openPaperSubmissionViewInNewTab(paper.id)}/>
                    </div>
                </TableCell> */}
                <TableCell className='border border-slate-300 flex justify-center max-w-[15%] ...'>
                    <div className='flex justify-center ...'>
                        {/* <BsFillPencilFill size={15} color ={'darkblue'} onClick={()=>this.openPaperEditingViewInNewTab(paper.id)}/> */}
                        <BsFillPencilFill size={15} color ={'black'}/>

                    </div>
                </TableCell>
            </TableRow>;
            tableRows.push(newRow);
        });
        return tableRows;
    }

    getPapersTableJSX = () => {
        return <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            {this.getPapersTableHeaderJSX()}
                        </TableHead>
                        <TableBody>
                            {this.getPapersTableBodyRowsJSX()}
                        </TableBody>
                    </Table>
                </TableContainer>
    } 

    refreshSearch = () => {
        let tagIds = [];
        this.props.paperSet.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        let channelIds = [];
        this.props.paperSet.channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        PaperAPIsConnector.getAllFilteredPapers(this.props.paperSet.searchedKey, tagIds,channelIds).then(papersData=>{
            let payload = {...this.props.paperSet};
            payload.papers = papersData.data;
            this.props.savePaperSet(payload);
        });
    }

    showSelectedTags = () => {
        let response = [];
        this.props.paperSet.tags.forEach(element => {
            response.push(
                <div className="flex flex-row justify-center ...">
                    <div className="py-4 px-2F ">{JSXUtils.getTagViewJSX(element.tagName)}</div>
                    <div className="py-2" onClick={()=>this.removeTag(element.id)}>
                        <button className={"flex my-2 transition-colors rounded bg-gray-100 border border-gray-300 py-2 px-1 text-gray-600 " + generalTextSize + " hover:bg-danger-50 hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"
                                     fill="currentColor" className="bi bi-x-lg" viewBox="0 0 14 14">
                                    <path fill-rule="evenodd"
                                          d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                                    <path fill-rule="evenodd"
                                          d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/>
                                </svg>
                        </button>
                    </div>
                </div>
            );
        });
        if(response.length === 0) {
            return;
        }
        return <div className="flex flex-row ...">
            <div>
                <p className={"px-6  py-6 " + generalTextSize + " leading-tight text-gray-800 "}>
                    Filter on Tags :
                </p>
            </div>
            {response}
        </div>;
    }

    showSelectedChannels = () => {
        let response = [];
        this.props.paperSet.channels.forEach(element => {
            response.push(
                <div className="flex flex-row justify-center ...">
                    <div className="py-2 ">{JSXUtils.getTagViewJSX(element.channelName)}</div>
                    <div className="py-2" onClick={()=>this.removeChannel(element.id)}>
                        <button className={"flex my-2 transition-colors rounded bg-gray-100 border border-gray-300 py-2 px-1 text-gray-600 hover:bg-danger-50 hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 " + generalTextSize }>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd"
                                          d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                                    <path fill-rule="evenodd"
                                          d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/>
                                </svg>
                        </button>
                    </div>
                </div>
            );
        });
        if(response.length === 0) {
            return;
        }
        return <div className="flex flex-row ...">
            <div>
                <h4 className={generalTextSize + " px-6  py-6 leading-tight text-gray-800 "}>
                    Channel Filters :
                </h4>
            </div>
            {response}
        </div>;
    }

    removeTag = (tagId) => {
        let payload = {...this.props.paperSet};
        let tags = [...payload.tags];
        let suggestedTags = [...payload.suggestedTags];
        suggestedTags.push(tags.filter(function(tag) {return tag.id === tagId})[0]);
        tags = tags.filter(function(tag) {return tag.id !== tagId});
        payload.tags = tags;
        payload.suggestedTags = suggestedTags;
        let tagIds = [];
        tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        let channelIds = [];
        payload.channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        PaperAPIsConnector.getAllFilteredPapers(this.props.paperSet.searchedKey, tagIds, channelIds).then(papersData=>{
            payload.papers = papersData.data;
            this.props.savePaperSet(payload);
        });
    }

    removeChannel = (channelId) => {
        let payload = {...this.props.paperSet};
        let channels = [...payload.channels];
        let suggestedChannels = [...payload.suggestedChannels];
        suggestedChannels.push(channels.filter(function(channel) {return channel.id === channelId})[0]);
        channels = channels.filter(function(channel) {return channel.id !== channelId});
        payload.channels = channels;
        payload.suggestedChannels = suggestedChannels;
        let channelIds = [];
        channels.forEach(channel =>{
            channelIds.push(channel.id);
        });
        let tagIds = [];
        payload.tags.forEach(tag =>{
            tagIds.push(tag.id);
        });
        PaperAPIsConnector.getAllFilteredPapers(this.props.paperSet.searchedKey, tagIds, channelIds).then(papersData=>{
            payload.papers = papersData.data;
            this.props.savePaperSet(payload);
        });
    }

    updateHelpSectionEnabling = (event) => {
        let payload = {...this.props.paperSet};
        payload.helpSectionEnabled = event.target.checked;
        this.props.savePaperSet(payload);
    }

    getHelpSectionJSX = () => {
        if(this.props.paperSet.helpSectionEnabled === false) {
            return <div/>;
        }
        return <div>
            <div className="bg-success-50 py-2">
                <h3 className ={generalTextSize}>
                    Help Section
                </h3>
            </div>
            <p className={generalTextSize + ' py-2'}>
                1. How to create a multiple choice paper on educationalbridge ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/y7169jEvb-Y" className='w-full'/>
            <p className={generalTextSize + ' py-2'}>
                2. What does preview means here ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/e_TxH59MclA" className='w-full'/>

            <p className={generalTextSize + ' py-2'}>
                3. How to add images into the papers ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/bVKHRtafgPc" className='w-full'/>
            <p className={generalTextSize + ' py-2'}>
                3. What is educationalbridge ?
            </p>
            <iframe width="420" height="345" src="https://www.youtube.com/embed/hQ8GYk9gkcE" className='w-full'/>
        </div>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.paperSet === undefined){
            this.initializePapers();
            return <div></div>;
        }
        this.resetResourceCreationSessionStorage();
        return <div className = "flex flex-row...">
                <div className='max-w-[0%] lg:min-w-[15%] lg:max-w-[15%] sm:min-w-[20%] sm:max-w-[20%]'>
                    {/* Position for ads */}
                </div>
                <div className="w-full  shadow bg-white  overflow-y-scroll ">
                    {this.showSelectedTags()}
                    {this.showSelectedChannels()}
                    <PaperSetSearchBoxComponent/>
                    {this.getPapersTableJSX()}
                </div>
                <div className='max-w-[0%] lg:min-w-[15%] lg:max-w-[15%]'>
                    {/* Position for ads */}
                </div>
            </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PaperSet);