import React from 'react';
import TagReceiver from "../../../apis/TagReceiver";
import { connect } from 'react-redux';
import {updateNewQuestionDetails} from '../../../store/actions/solgressAction';
import {currentURLHost} from './../../../constants/hostConfig';
import { AiOutlineClose, AiOutlinePlus, AiOutlineSearch } from "react-icons/ai";
import { tagPrefixPairMap, MANDATORY_TAG_PREFIX } from '../../../constants/tagPrefixPairMap';
import { listOf } from '../../../apis/unwrap';

const SEARCH_DEBOUNCE_MS = 300;

const mapDispatchToProps = dispatch => ({
    updateNewQuestionDetails: (payload) => dispatch(updateNewQuestionDetails(payload))
})


const mapStateToProps = state => {
    return {
        newQuestionDetails: state.solgressReducer.newQuestionDetails
    };
}

/**
 * Tag picker on the question authoring page. Decides whether a published question
 * is reachable by any filter at all, so it matters more than it looks.
 *
 * WHY THIS WAS REWRITTEN
 * ----------------------
 * The previous version had a set of faults that compounded:
 *
 *   - `isASelectedTag` read `generalInfo.selectedTags`, which is the QUESTION LIST's
 *     filter state and is always empty on this page. Every suggestion therefore
 *     rendered unticked, including ones already attached, so there was no way to
 *     tell what you had added except by reading the separate "Mapped Tags" panel.
 *
 *   - Those ticks were `<input type="checkbox" checked>` with no onChange, which
 *     React warns about on every render and which the browser treats as read-only.
 *
 *   - Suggestions and the remove buttons were `<div onClick>` with no `key`, so
 *     nothing here was reachable by keyboard and React rebuilt the lists on every
 *     keystroke.
 *
 *   - The non-mandatory dimension dropdown offered Topic, Author and
 *     "Exam Name : " — a prefix that exists nowhere in the data, so picking Exam
 *     returned an empty list forever. It offered no Chapter, Difficulty or Year,
 *     which are three of the dimensions the list page filters by.
 *
 *   - `render()` called `initializeTagDetails()`, dispatching redux mid-render, and
 *     its own guard read a property off `newQuestionDetails` after testing that
 *     `newQuestionDetails` might be undefined — so the "not yet loaded" branch threw.
 *
 *   - Six further methods (`getTagDetailsJSX`, `showSuggestedTags`,
 *     `getTagFlexScrollableHeightCSSClass`, `activateTagSearch`,
 *     `deactivateTagSearch`, `updateSearchedTagKey`) had no live call sites.
 *
 * It is now one list of dimensions, driven by the shared prefix constant, with the
 * attached tags grouped by dimension beside it.
 */
class NewQuestionTagComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            activePrefix: MANDATORY_TAG_PREFIX,
            query: '',
            suggestions: [],
        };
    }

    componentDidMount() {
        this.fetchSuggestions(this.state.activePrefix, '');
    }

    componentWillUnmount() {
        if (this.timer != null) {
            clearTimeout(this.timer);
        }
    }

    getAttachedTags = () => {
        const tags = this.props.newQuestionDetails && this.props.newQuestionDetails.tags;
        return Array.isArray(tags) ? tags : [];
    }

    fetchSuggestions = (prefix, query) => {
        const requestKey = prefix + '\u0000' + query;
        this.latestRequestKey = requestKey;
        TagReceiver.getSuggestedTags(prefix + query).then(tagData=>{
            if (this.latestRequestKey !== requestKey) {
                return;
            }
            // The endpoint matches on a prefix pattern, but it is a `like`, so
            // filtering here keeps a stray match from another dimension out.
            const suggestions = listOf(tagData).filter(
                (tag) => tag && typeof tag.tagName === 'string' && tag.tagName.startsWith(prefix)
            );
            this.setState({ suggestions });
        });
    }

    onDimensionChange = (prefix) => {
        this.setState({ activePrefix: prefix, query: '', suggestions: [] });
        this.fetchSuggestions(prefix, '');
    }

    onQueryChange = (query) => {
        this.setState({ query });
        if (this.timer != null) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.fetchSuggestions(this.state.activePrefix, query), SEARCH_DEBOUNCE_MS);
    }

    isAttached = (tagId) => this.getAttachedTags().some((tag) => tag && tag.id === tagId);

    toggleTag = (tag) => {
        if (tag == null || tag.id == null) {
            return;
        }
        const attached = this.getAttachedTags();
        this.props.updateNewQuestionDetails({
            ...this.props.newQuestionDetails,
            tags: this.isAttached(tag.id)
                ? attached.filter((existing) => existing.id !== tag.id)
                : [...attached, tag],
        });
    }

    stripPrefix = (tagName) => {
        if (typeof tagName !== 'string') {
            return '';
        }
        const idx = tagName.indexOf(' : ');
        return idx === -1 ? tagName : tagName.slice(idx + 3);
    }

    getDimensionOf = (tagName) => {
        if (typeof tagName !== 'string') {
            return null;
        }
        return tagPrefixPairMap.find((dimension) => tagName.startsWith(dimension.prefix)) || null;
    }

    getPickerJSX = () => {
        const activeDimension = tagPrefixPairMap.find((d) => d.prefix === this.state.activePrefix)
            || tagPrefixPairMap[0];
        return <div className='flex flex-col gap-2'>
            <div className='flex flex-col sm:flex-row gap-2'>
                <select
                    className='h-10 px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                    value={this.state.activePrefix}
                    onChange={(event) => this.onDimensionChange(event.target.value)}
                    aria-label="Tag type"
                >
                    {tagPrefixPairMap.map((dimension) => (
                        <option key={dimension.prefix} value={dimension.prefix}>
                            {dimension.inputPlaceholder}
                            {dimension.prefix === MANDATORY_TAG_PREFIX ? ' (required)' : ''}
                        </option>
                    ))}
                </select>
                <div className='relative flex-1 min-w-0'>
                    <AiOutlineSearch
                        size={15}
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                    />
                    <input
                        type="text"
                        className='w-full h-10 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                        placeholder={activeDimension.searchPlaceholder}
                        value={this.state.query}
                        onChange={(event) => this.onQueryChange(event.target.value)}
                        aria-label={activeDimension.searchPlaceholder}
                    />
                </div>
            </div>
            <div className='max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100'>
                {this.state.suggestions.length === 0
                    ? <p className='px-3 py-6 text-center text-sm text-gray-400'>
                        No {activeDimension.inputPlaceholder.toLowerCase()} tags match.
                    </p>
                    : this.state.suggestions.map((tag) => {
                        const attached = this.isAttached(tag.id);
                        return <button
                            key={tag.id}
                            type="button"
                            className={'flex items-center justify-between gap-2 w-full px-3 py-2.5 text-left text-sm transition-colors '
                                + (attached ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50')}
                            onClick={() => this.toggleTag(tag)}
                            aria-pressed={attached}
                        >
                            <span className='truncate'>{this.stripPrefix(tag.tagName)}</span>
                            <span
                                className={'shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold '
                                    + (attached
                                        ? 'bg-primary-600 border-primary-600 text-white'
                                        : 'bg-white border-gray-300 text-transparent')}
                                aria-hidden="true"
                            >
                                &#10003;
                            </span>
                        </button>;
                    })
                }
            </div>
            <a
                href={currentURLHost + 'tags/new'}
                target="_blank"
                rel="noreferrer"
                className='inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:underline'
            >
                <AiOutlinePlus size={13} aria-hidden="true"/>
                Create a new tag
            </a>
        </div>;
    }

    getAttachedJSX = () => {
        const attached = this.getAttachedTags();
        const hasSubject = attached.some(
            (tag) => tag && typeof tag.tagName === 'string' && tag.tagName.startsWith(MANDATORY_TAG_PREFIX)
        );
        // Group by dimension so the panel reads as a classification rather than an
        // undifferentiated pile of pills.
        const grouped = tagPrefixPairMap.map((dimension) => ({
            dimension,
            tags: attached.filter(
                (tag) => tag && typeof tag.tagName === 'string' && tag.tagName.startsWith(dimension.prefix)
            ),
        })).filter((entry) => entry.tags.length > 0);
        const unclassified = attached.filter((tag) => this.getDimensionOf(tag && tag.tagName) === null);

        return <div className='bg-gray-50 border border-gray-200 rounded-xl p-4'>
            <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                Attached tags
            </h3>
            {!hasSubject &&
                <p className='mt-2 text-sm text-danger-600'>
                    Add a subject. Without one, this question will not appear under any subject filter.
                </p>
            }
            {attached.length === 0
                ? <p className='mt-2 text-sm text-gray-500'>Nothing attached yet.</p>
                : <div className='mt-3 flex flex-col gap-3'>
                    {grouped.map(({ dimension, tags }) => (
                        <div key={dimension.prefix}>
                            <div className='text-xs font-medium text-gray-500'>{dimension.inputPlaceholder}</div>
                            <div className='mt-1 flex flex-wrap gap-1.5'>
                                {tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className='inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-white border border-gray-300 text-xs font-medium text-gray-700'
                                    >
                                        <span className='truncate max-w-[12rem]'>{this.stripPrefix(tag.tagName)}</span>
                                        <button
                                            type="button"
                                            className='p-0.5 rounded-full text-gray-400 hover:bg-danger-50 hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-500'
                                            aria-label={'Remove tag ' + tag.tagName}
                                            onClick={() => this.toggleTag(tag)}
                                        >
                                            <AiOutlineClose size={11} aria-hidden="true"/>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {unclassified.length > 0 &&
                        <div>
                            <div className='text-xs font-medium text-gray-500'>Unclassified</div>
                            <div className='mt-1 flex flex-wrap gap-1.5'>
                                {unclassified.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className='inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-white border border-warning-200 text-xs font-medium text-warning-700'
                                        title="This tag has no dimension prefix, so no filter will match it."
                                    >
                                        <span className='truncate max-w-[12rem]'>{tag.tagName}</span>
                                        <button
                                            type="button"
                                            className='p-0.5 rounded-full text-warning-600 hover:bg-warning-100 focus:outline-none focus:ring-2 focus:ring-warning-500'
                                            aria-label={'Remove tag ' + tag.tagName}
                                            onClick={() => this.toggleTag(tag)}
                                        >
                                            <AiOutlineClose size={11} aria-hidden="true"/>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    }
                </div>
            }
        </div>;
    }

    render() {
        if (this.props.newQuestionDetails === undefined) {
            return <div/>;
        }
        return <div className='grid md:grid-cols-2 gap-4'>
            {this.getPickerJSX()}
            {this.getAttachedJSX()}
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(NewQuestionTagComponent);
