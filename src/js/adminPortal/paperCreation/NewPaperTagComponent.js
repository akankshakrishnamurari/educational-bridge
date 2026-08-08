import React from 'react';
import TagReceiver from "../../../apis/TagReceiver";
import { connect } from 'react-redux';
import {updateNewPaperDetails} from "../../../store/actions/solgressAction";
import {currentURLHost} from './../../../constants/hostConfig';
import { AiOutlineClose, AiOutlinePlus, AiOutlineSearch } from "react-icons/ai";
import { listOf } from '../../../apis/unwrap';

const SEARCH_DEBOUNCE_MS = 300;

const mapDispatchToProps = dispatch => ({
    updateNewPaperDetails: (payload) => dispatch(updateNewPaperDetails(payload)),
})


const mapStateToProps = state => {
    return {
        newPaperDetails: state.solgressReducer.newPaperDetails
    };
}

/**
 * Tags for a paper, so learners can find it by subject or exam.
 *
 * WHAT WAS WRONG
 * --------------
 *   - The suggestion list opened on `onMouseEnter` and closed on `onMouseLeave` of
 *     the input's wrapper. It closed on the way to the suggestion being reached for,
 *     and on a touch screen it could not be opened at all.
 *   - Suggestions and remove buttons were `<div onClick>` with no `key`: not
 *     focusable, and re-created on every keystroke.
 *   - `render()`'s guard tested whether `newPaperDetails` might be undefined and
 *     then immediately read a property off it, so the "not loaded" branch threw. It
 *     also called `initializeTagDetails()` from render, dispatching redux mid-render.
 *   - `initializeTagDetails` read `payload.tags.length` before anything had set
 *     `tags`, so it threw whenever the builder state was fresh.
 *   - The suggestion query fired per keystroke with no ordering guarantee.
 *   - `getTagFlexScrollableHeightCSSClass` picked one of four fixed heights and had
 *     no call site.
 *   - Every remove icon used `fill-rule`, which is not a React attribute and was
 *     dropped, so the two crossing strokes rendered with the wrong fill rule.
 */
class NewPaperTagComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = { query: '', suggestions: [], isOpen: false };
    }

    componentDidMount() {
        this.fetchSuggestions('');
    }

    componentWillUnmount() {
        if (this.timer != null) {
            clearTimeout(this.timer);
        }
    }

    getAttachedTags = () => {
        const tags = this.props.newPaperDetails && this.props.newPaperDetails.tags;
        return Array.isArray(tags) ? tags : [];
    }

    fetchSuggestions = (query) => {
        this.latestQuery = query;
        TagReceiver.getSuggestedTags(query).then(tagData=>{
            if (this.latestQuery !== query) {
                return;
            }
            const attachedIds = this.getAttachedTags().map((tag) => tag.id);
            this.setState({
                suggestions: listOf(tagData).filter((tag) => tag && !attachedIds.includes(tag.id)),
            });
        });
    }

    onQueryChange = (query) => {
        this.setState({ query, isOpen: true });
        if (this.timer != null) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.fetchSuggestions(query), SEARCH_DEBOUNCE_MS);
    }

    addNewTag = (tagToAdd) => {
        if (tagToAdd == null || tagToAdd.id == null) {
            return;
        }
        this.setState((previous) => ({
            isOpen: false,
            suggestions: previous.suggestions.filter((tag) => tag.id !== tagToAdd.id),
        }));
        this.props.updateNewPaperDetails({
            ...this.props.newPaperDetails,
            tags: [...this.getAttachedTags(), tagToAdd],
        });
    }

    removeTag = (tagId) => {
        const removed = this.getAttachedTags().find((tag) => tag.id === tagId);
        this.props.updateNewPaperDetails({
            ...this.props.newPaperDetails,
            tags: this.getAttachedTags().filter((tag) => tag.id !== tagId),
        });
        if (removed) {
            this.setState((previous) => ({ suggestions: [...previous.suggestions, removed] }));
        }
    }

    getAppliedTagsJSX = () => {
        const attached = this.getAttachedTags();
        if (attached.length === 0) {
            return null;
        }
        return <div className='flex flex-wrap items-center gap-1.5 pb-2'>
            <span className='text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1'>Applied</span>
            {attached.map((tag) => (
                <span
                    key={tag.id}
                    className='inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium'
                >
                    <span className='truncate max-w-[14rem]'>{tag.tagName}</span>
                    <button
                        type="button"
                        className='p-0.5 rounded-full hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
                        aria-label={'Remove tag ' + tag.tagName}
                        onClick={()=>this.removeTag(tag.id)}
                    >
                        <AiOutlineClose size={11} aria-hidden="true"/>
                    </button>
                </span>
            ))}
        </div>;
    }

    getSuggestionsJSX = () => {
        if (!this.state.isOpen || this.state.suggestions.length === 0) {
            return null;
        }
        return <ul className='absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-md py-1'>
            {this.state.suggestions.map((tag) => (
                <li key={tag.id}>
                    <button
                        type="button"
                        className='flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50'
                        onClick={()=>this.addNewTag(tag)}
                    >
                        <AiOutlinePlus size={13} className='shrink-0 text-gray-400' aria-hidden="true"/>
                        <span className='truncate'>{tag.tagName}</span>
                    </button>
                </li>
            ))}
        </ul>;
    }

    render() {
        if (this.props.newPaperDetails === undefined) {
            return <div/>;
        }
        return <div className="w-full pb-2">
            {this.getAppliedTagsJSX()}
            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                <label
                    className='text-sm font-medium text-gray-700 shrink-0'
                    htmlFor="paper-tag-search"
                >
                    Tags
                </label>
                <div className='relative w-full sm:max-w-md'>
                    <AiOutlineSearch
                        size={15}
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                    />
                    <input
                        id="paper-tag-search"
                        type="text"
                        className='w-full h-10 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                        placeholder="Search and add tags"
                        value={this.state.query}
                        onChange={(event)=>this.onQueryChange(event.target.value)}
                        onFocus={()=>this.setState({ isOpen: true })}
                        // Delay lets a click on a suggestion land before the list
                        // unmounts; the previous onMouseLeave version raced against it.
                        onBlur={()=>setTimeout(()=>this.setState({ isOpen: false }), 150)}
                    />
                    {this.getSuggestionsJSX()}
                </div>
                <a
                    href={currentURLHost + 'tags/new'}
                    target="_blank"
                    rel="noreferrer"
                    className='shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:underline'
                >
                    <AiOutlinePlus size={13} aria-hidden="true"/>
                    New tag
                </a>
            </div>
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewPaperTagComponent);
