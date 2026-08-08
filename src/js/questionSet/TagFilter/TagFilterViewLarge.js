import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet, savePaperSet, updateGeneralInfo} from '../../../store/actions/solgressAction';
import TagReceiver from '../../../apis/TagReceiver';
// Filter controls are styled inline in this file now, so the shared class strings
// are no longer imported here.
import QuestionsReceiver from '../../../apis/QuestionsReceiver'
import {AiOutlineClose} from "react-icons/ai";
import {MdArrowDropDown} from "react-icons/md";
import { VscSettings } from "react-icons/vsc";
import { Popover } from 'react-tiny-popover';
import './leftSideBar.css';
import { AiOutlineSearch } from "react-icons/ai";
import { dataOf, listOf } from '../../../apis/unwrap';

// Fallback shape for the paged list endpoint, used when a request fails so
// render paths that read `.questions` / `.pageCount` keep working.
const EMPTY_PAGE = { questions: [], pageCount: 0, pageSize: 10 };

const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload)),
    savePaperSet: (payload) => dispatch(savePaperSet(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet,
        paperSet: state.solgressReducer.paperSet,
        generalInfo: state.solgressReducer.generalInfo
    };
}

class TagsFilterViewLarge extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    /**
     * Applied filters, as a single source of truth.
     *
     * The host page owns this list (it is the same list it shows as chips and sends
     * with every query). This component used to keep its own copy in
     * `generalInfo.selectedTags` and run its own list query, so the page's chips and
     * the toolbar's chips came from two pieces of state that never synced, and each
     * one's query dropped the other's criteria. The fallback keeps the component
     * usable if it is ever mounted without the host prop.
     */
    getAppliedTags = () => {
        if (Array.isArray(this.props.appliedTags)) {
            return this.props.appliedTags;
        }
        const fromGeneralInfo = this.props.generalInfo && this.props.generalInfo.selectedTags;
        return Array.isArray(fromGeneralInfo) ? fromGeneralInfo : [];
    }

    applyTags = (tags) => {
        if (typeof this.props.onFiltersChanged === 'function') {
            this.props.onFiltersChanged(tags);
            return;
        }
        // Standalone fallback: keep the local copy and refresh the list directly.
        let payload = {...this.props.generalInfo};
        payload.selectedTags = tags;
        this.props.updateGeneralInfo(payload);
        QuestionsReceiver.getAllFilteredQuestions('', tags.map((tag) => tag.id), []).then(questionsData=>{
            let questionSetPayload = {...this.props.questionSet};
            questionSetPayload.questions = dataOf(questionsData, EMPTY_PAGE);
            questionSetPayload.tags = tags;
            this.props.saveQuestionSet(questionSetPayload);
        });
    }

    addNewTag = (tag,index) => {
        const suggested = this.props.generalInfo.suggestedTags.get(tag) || [];
        const toggledTag = suggested[index];
        if (toggledTag == null) {
            return;
        }
        const applied = this.getAppliedTags();
        if(this.isASelectedTag(toggledTag.id)){
            // Deselect. The previous implementation walked selectedTags and compared
            // each entry against suggestedTags.get(tag)[i] -- the SAME index in a
            // different, unrelated array -- so it removed whichever tags happened to
            // not line up positionally rather than the one that was clicked.
            this.applyTags(applied.filter((selected) => selected.id !== toggledTag.id));
            return;
        }
        this.applyTags([...applied, toggledTag]);
    }

    isASelectedTag = (tagId) => {
        return this.getAppliedTags().some((tag) => tag && tag.id === tagId);
    }

    removeSelectedAppliedTag = (tagId) => {
        this.applyTags(this.getAppliedTags().filter((tag) => tag.id !== tagId));
    }

    showSelectedTags = () => {
        const selectedTags = this.getAppliedTags();
        if (selectedTags.length === 0) {
            return <div></div>;
        }
        let response = [];
        for(let index=0; index<selectedTags.length; index++) {
            if(selectedTags[index] && selectedTags[index].id){
                    response.push(
                        // Removable filter chip. Accent tint + a small affordance, rather
                        // than a bordered box with an oversized blue close icon.
                        <span
                            key={selectedTags[index].id}
                            className='inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium'
                        >
                            <span className='truncate max-w-[16rem]'>{selectedTags[index].tagName}</span>
                            <button
                                type="button"
                                className='p-0.5 rounded-full hover:bg-primary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
                                aria-label={"Remove filter " + selectedTags[index].tagName}
                                onClick={()=>this.removeSelectedAppliedTag(selectedTags[index].id)}
                            >
                                <AiOutlineClose size={12} aria-hidden="true" />
                            </button>
                        </span>
                    );
            }
        }
        if (response.length === 0) {
            return null;
        }
        return <div className='flex flex-row flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide mr-1'>Applied</span>
            {response}
        </div>;
    }

    getNormalisedTagName = (tagName, prefix) => {
        return tagName.slice(prefix.length);
    }

    showSuggestedTag = (tag) => {
        let response = [];
        // `.get()` returns undefined for a dimension whose prefetch has not landed
        // yet, and reading `.length` off that threw while the popover was open.
        let suggestedTags = this.props.generalInfo.suggestedTags.get(tag) || [];
        for(let index=0; index<suggestedTags.length; index++) {
                const isSelected = this.isASelectedTag(suggestedTags[index].id);
                response.push(
                    <button
                        key={suggestedTags[index].id}
                        className={'flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors '
                            + (isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50')}
                        onClick={()=>this.addNewTag(tag,index)}
                    >
                        <input
                            type='checkbox'
                            readOnly
                            checked={isSelected}
                            className='w-4 h-4 shrink-0 accent-primary-600 pointer-events-none'
                        />
                        <span className='truncate'>
                            {this.getNormalisedTagName(
                                suggestedTags[index].tagName,
                                (this.props.generalInfo.tagPrefixPairMap.get(tag) || { prefix: '' }).prefix
                            )}
                        </span>
                    </button>
                );
        }
        if (response.length === 0) {
            return <div className='px-3 py-6 text-center text-sm text-gray-400'>No matches</div>;
        }
        return <div className='flex flex-col max-h-64 overflow-y-auto py-1'>{response}</div>
    }

    updateTagDetails = (event,tag) => {
        let payload = {...this.props.generalInfo};
        let tagPlaceholder = new Map(payload.tagPlaceholder);
        tagPlaceholder.set(tag, event.target.value);
        payload.tagPlaceholder = tagPlaceholder;
        this.props.updateGeneralInfo(payload);
        let prefixValue = (payload.tagPrefixPairMap.get(tag) || { prefix: '' }).prefix;
        prefixValue=(prefixValue+event.target.value);
        TagReceiver.getSuggestedTags((prefixValue)).then(tagData=>{
            let payload = {...this.props.generalInfo};
            let suggestedTagsByApi = listOf(tagData);
            let suggestedTags =new Map(payload.suggestedTags);
            suggestedTags.set(tag,suggestedTagsByApi);
            payload.suggestedTags=suggestedTags;
            this.props.updateGeneralInfo(payload);
        });
    }

    /**
     * Opens the dropdown for one dimension, closing any other.
     *
     * This used to toggle against null rather than against the clicked dimension: if
     * Subject was open and you clicked Chapter, it set the open dimension to null, so
     * Chapter did not open. Moving between filters took two clicks on every control
     * and looked like the first click had been missed.
     */
    activateTagPopup = (index) => {
        let payload = {...this.props.generalInfo};
        payload.activeTagFilterPopupIndex = payload.activeTagFilterPopupIndex === index ? null : index;
        this.props.updateGeneralInfo(payload);
    }

    inactivateTagPopup = () => {
        let payload = {...this.props.generalInfo};
        payload.activeTagFilterPopupIndex = null;
        this.props.updateGeneralInfo(payload);
    }
    
    getTagDetailsJSX = (tag) => {
        let isTagSearchActive = this.props.generalInfo.activeTagFilterPopupIndex==tag;
        // Active state uses the accent tint rather than a saturated blue fill, so an
        // open filter reads as "selected" without shouting.
        let triggerStateCSS = isTagSearchActive
            ? "border-primary-500 bg-primary-50 text-primary-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
        const dimension = this.props.generalInfo.tagPrefixPairMap.get(tag) || {};
        // How many filters from this dimension are applied, so a collapsed control
        // still says whether it is doing anything. Previously an active filter was
        // only visible in the chip row further down, which meant a toolbar of seven
        // identical-looking dropdowns gave no clue which ones were narrowing the list.
        const appliedInDimension = dimension.prefix
            ? this.getAppliedTags().filter(
                (applied) => applied && typeof applied.tagName === 'string'
                    && applied.tagName.startsWith(dimension.prefix)
            ).length
            : 0;
        let triggerContent = <button
            type="button"
            className={'inline-flex items-center gap-1 h-9 px-3 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 '
                + (appliedInDimension > 0 && !isTagSearchActive
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : triggerStateCSS)}
            onClick={(event)=>this.activateTagPopup(tag)}
            aria-expanded={isTagSearchActive}
        >
            {dimension.inputPlaceholder}
            {appliedInDimension > 0 &&
                <span className='ml-0.5 px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold tabular-nums'>
                    {appliedInDimension}
                </span>
            }
            <MdArrowDropDown size={18} aria-hidden="true" />
        </button>;

        let content = <div
            className='flex flex-col w-72 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden'
            onMouseLeave={this.inactivateTagPopup}
        >
                <div className='relative border-b border-gray-200'>
                    <AiOutlineSearch
                        size={16}
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                    />
                    <input
                        type="text"
                        className='w-full h-10 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none'
                        placeholder={dimension.searchPlaceholder}
                        // `.get()` yields undefined before the placeholder map is
                        // seeded, which React reports as an uncontrolled-to-controlled
                        // input switch.
                        value = {this.props.generalInfo.tagPlaceholder.get(tag) || ''}
                        onChange = {(event) => this.updateTagDetails(event,tag)}
                        aria-label={dimension.searchPlaceholder}
                    />
                </div>
                {this.showSuggestedTag(tag)}
            </div>;
        return <Popover
                isOpen={isTagSearchActive}
                positions={['bottom', 'left', 'right', 'top']} // preferred positions by priority
                align = {"start"}
                content={content}
                // The only way to dismiss an open dropdown used to be onMouseLeave on
                // the panel, which does not exist on a touch screen — so on a tablet
                // the panel stayed open over the results.
                onClickOutside = {this.inactivateTagPopup}
            >
                {triggerContent}
            </Popover>
    }

    // Filterable dimensions, keyed to the tag-name prefixes the importer actually
    // writes (see backend-master-main/tools/import_jee_questions.py::build_tag_names).
    //
    // The Exam prefix was previously "Exam Name : ", which no tag in the database
    // has ever matched -- the importer writes "Exam : ". That filter therefore
    // returned an empty suggestion list forever.
    //
    // Subject, Chapter, Topic, Difficulty and Year are the dimensions the redesigned
    // list surfaces on every row, so they are all filterable here. Offering
    // difficulty and year in particular is what makes "drill exactly what you need"
    // true rather than aspirational.
    static FILTER_DIMENSIONS = [
        ['subject', 'Subject : ', 'Subject', 'Search subjects'],
        ['chapter', 'Chapter : ', 'Chapter', 'Search chapters'],
        ['topic', 'Topic : ', 'Topic', 'Search topics'],
        ['difficulty', 'Difficulty : ', 'Difficulty', 'Search difficulty'],
        ['year', 'Year : ', 'Year', 'Search years'],
        ['exam', 'Exam : ', 'Exam', 'Search exams'],
        ['author', 'Created By : ', 'Author', 'Search authors'],
    ];

    initializeGeneralInfo = () => {
        let tagPrefixPairMap = new Map();
        const tagPlaceholder = new Map();
        let suggestedTags = new Map();

        TagsFilterViewLarge.FILTER_DIMENSIONS.forEach(([key, prefix, inputPlaceholder, searchPlaceholder]) => {
            tagPrefixPairMap.set(key, { prefix, tag: key + 'Tag', inputPlaceholder, searchPlaceholder });
            tagPlaceholder.set(key, '');
            suggestedTags.set(key, []);
        });
        // Retained for callers that look up the "other" bucket; not rendered as a control.
        tagPrefixPairMap.set("other", { prefix: "", tag: "otherTag", inputPlaceholder: "Other tags", searchPlaceholder: "Search other tags" });

        let payload ={...this.props.generalInfo};
        payload.suggestedTags= suggestedTags;
        // Was unconditionally `[]`, which erased any filter the host page had already
        // applied (a channel link, "my created questions", or the default source
        // filter) the moment this toolbar mounted.
        payload.selectedTags = Array.isArray(payload.selectedTags) ? payload.selectedTags : [];
        payload.tagPrefixPairMap = tagPrefixPairMap;
        payload.tagPlaceholder=tagPlaceholder;
        this.props.updateGeneralInfo(payload);

        // Iterate the configured dimensions rather than a hardcoded count, so adding
        // a dimension above does not silently skip prefetching its suggestions.
        TagsFilterViewLarge.FILTER_DIMENSIONS.forEach(([key, prefix]) => {
            TagReceiver.getSuggestedTags(prefix).then(tagData=>{
                let payload ={...this.props.generalInfo};
                let suggestedTagsByApi = listOf(tagData);
                let suggestedTags =new Map(payload.suggestedTags);
                suggestedTags.set(key, suggestedTagsByApi);
                payload.suggestedTags=suggestedTags;
                this.props.updateGeneralInfo(payload);
            });
        });
    }

    // updateExistingTags = () => {
    //     let payload = {...this.props.generalInfo};
    //     payload.selectedTags = [...payload.selectedTags];
    //     this.props.updateGeneralInfo(payload);
    // } 
    
    isReady = () => {
        const info = this.props.generalInfo;
        return info != undefined
            && info.tagPrefixPairMap != undefined
            && info.suggestedTags != undefined
            && info.tagPlaceholder != undefined;
    }

    // Seeding used to happen inside render(), which dispatched several redux actions
    // (one per filter dimension, plus the initial map) as a side effect of
    // rendering.
    componentDidMount() {
        if (!this.isReady()) {
            this.initializeGeneralInfo();
        }
    }

    render() {
        if(!this.isReady()) {
            return <div></div>;
        }
        // Filter toolbar: white card, hairline border, controls on a single 36px
        // row so they read as a set of selects rather than loose text.
        return <div className='bg-white border border-gray-200 rounded-xl px-4 py-3'>
            <div className="flex flex-row flex-wrap items-center gap-2">
                <div className='flex items-center gap-2 pr-1 text-gray-500'>
                    <VscSettings size={18} />
                    <span className='text-sm font-medium text-gray-700'>Filters</span>
                </div>
                {TagsFilterViewLarge.FILTER_DIMENSIONS.map(([key]) => (
                    <React.Fragment key={key}>{this.getTagDetailsJSX(key)}</React.Fragment>
                ))}
                <div className='flex justify-end grow'>
                    <button
                        disabled
                        title="Sorting is not available yet"
                        className='inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed'
                    >
                        Sort by
                        <MdArrowDropDown size={18} />
                        <span className='text-xs'>soon</span>
                    </button>
                </div>
            </div>
            {this.showSelectedTags()}
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TagsFilterViewLarge);
