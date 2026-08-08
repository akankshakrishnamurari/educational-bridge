import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet, updateGeneralInfo} from '../../../store/actions/solgressAction';
import TagReceiver from '../../../apis/TagReceiver';
import QuestionsReceiver from '../../../apis/QuestionsReceiver';
import {AiOutlineClose, AiOutlineSearch} from "react-icons/ai";
import {MdExpandMore, MdExpandLess} from "react-icons/md";
import { dataOf, listOf } from '../../../apis/unwrap';

// Fallback shape for the paged list endpoint, used when a request fails so
// render paths that read `.questions` / `.pageCount` keep working.
const EMPTY_PAGE = { questions: [], pageCount: 0, pageSize: 10 };

// Same dimensions, in the same order, as the desktop toolbar. The two views
// previously offered different sets of filters against different tag prefixes:
// this one asked for "Exam Name : ", a prefix no tag in the database has ever
// used (the importer writes "Exam : "), so that filter returned an empty list
// forever. It also had no Chapter, Difficulty or Year, which are exactly the
// dimensions a student narrows by.
const FILTER_DIMENSIONS = [
    { key: 'subject', prefix: 'Subject : ', label: 'Subject' },
    { key: 'chapter', prefix: 'Chapter : ', label: 'Chapter' },
    { key: 'topic', prefix: 'Topic : ', label: 'Topic' },
    { key: 'difficulty', prefix: 'Difficulty : ', label: 'Difficulty' },
    { key: 'year', prefix: 'Year : ', label: 'Year' },
    { key: 'exam', prefix: 'Exam : ', label: 'Exam' },
    { key: 'author', prefix: 'Created By : ', label: 'Author' },
];

const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload)),
    updateGeneralInfo: (payload) => dispatch(updateGeneralInfo(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet,
        generalInfo: state.solgressReducer.generalInfo
    };
}

/**
 * The filters sheet on small screens.
 *
 * This was rewritten rather than patched. The previous version:
 *
 *   - Rendered two literal `<div>.</div>` elements as bottom spacing, so two stray
 *     full stops sat visibly at the end of the sheet.
 *   - Dispatched redux actions from inside render() (initializeGeneralInfo and
 *     updateExistingTags), so rendering mutated state.
 *   - Built its option rows in a for-loop with no `key`, and rendered
 *     `<input type="checkbox" checked>` with no onChange, producing a React warning
 *     per option and a checkbox the browser treats as read-only for no stated reason.
 *   - Put every interaction on a `<div onClick>`, so nothing in the sheet was
 *     reachable by keyboard.
 *   - Applied filters via `getAllFilteredQuestions("", tagIds, [])`, discarding the
 *     active search text and channel, and wrote its result to a second copy of the
 *     filter state (`generalInfo.temporarySelectedTags`) that the list page never
 *     read — so the chips shown after applying did not necessarily describe the
 *     results.
 *
 * It now shares `questionSet.tags` with the desktop toolbar, which is the list the
 * page actually queries with.
 */
class TagsFilterViewSmall extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            // Staged locally: a filter sheet should not re-query on every tap. Only
            // "Show results" commits.
            draftTags: null,
            openDimension: 'subject',
            suggestionsByDimension: {},
            searchByDimension: {},
        };
    }

    componentDidMount() {
        this.setState({ draftTags: this.getAppliedTags() });
        FILTER_DIMENSIONS.forEach((dimension) => this.loadSuggestions(dimension, ''));
    }

    getAppliedTags = () => {
        const tags = this.props.questionSet && this.props.questionSet.tags;
        return Array.isArray(tags) ? [...tags] : [];
    }

    getDraftTags = () => this.state.draftTags || [];

    loadSuggestions = (dimension, query) => {
        TagReceiver.getSuggestedTags(dimension.prefix + query).then(tagData=>{
            this.setState((previous) => ({
                suggestionsByDimension: {
                    ...previous.suggestionsByDimension,
                    [dimension.key]: listOf(tagData),
                },
            }));
        });
    }

    onSearchChange = (dimension, value) => {
        this.setState((previous) => ({
            searchByDimension: { ...previous.searchByDimension, [dimension.key]: value },
        }));
        this.loadSuggestions(dimension, value);
    }

    isSelected = (tagId) => this.getDraftTags().some((tag) => tag && tag.id === tagId);

    toggleTag = (tag) => {
        if (tag == null || tag.id == null) {
            return;
        }
        const draft = this.getDraftTags();
        this.setState({
            draftTags: this.isSelected(tag.id)
                ? draft.filter((existing) => existing.id !== tag.id)
                : [...draft, tag],
        });
    }

    clearAll = () => {
        this.setState({ draftTags: [] });
    }

    getChannelIdsFromUrl = () => {
        if (typeof window === 'undefined') {
            return [];
        }
        const channelId = new URLSearchParams(window.location.search).get('channel_id');
        return channelId == null || channelId === '' ? [] : [channelId];
    }

    /**
     * Commits the staged filters and refreshes the list, carrying the search text
     * and channel through so applying a filter narrows the current result set
     * instead of silently resetting it to everything.
     */
    applyFilters = () => {
        const tags = this.getDraftTags();
        const set = this.props.questionSet || {};
        const searchText = set.searchedKey || '';
        const pageSize = set.currentPageSize || 10;
        QuestionsReceiver.getAllFilteredQuestions(
            searchText,
            tags.map((tag) => tag.id),
            this.getChannelIdsFromUrl(),
            0,
            pageSize
        ).then(questionsData=>{
            let payload = {...set};
            payload.questions = dataOf(questionsData, EMPTY_PAGE);
            payload.tags = tags;
            payload.searchedKey = searchText;
            payload.currentPage = 1;
            payload.currentPageSize = pageSize;
            this.props.saveQuestionSet(payload);
        });
        // Keep the legacy copy in step for any remaining reader, and close the sheet.
        let generalInfo = {...(this.props.generalInfo || {})};
        generalInfo.selectedTags = tags;
        generalInfo.temporarySelectedTags = [];
        generalInfo.isTagFilterViewActive = false;
        this.props.updateGeneralInfo(generalInfo);
    }

    stripPrefix = (tagName, prefix) => {
        if (typeof tagName !== 'string') {
            return '';
        }
        return tagName.startsWith(prefix) ? tagName.slice(prefix.length) : tagName;
    }

    getAppliedChipsJSX = () => {
        const draft = this.getDraftTags();
        if (draft.length === 0) {
            return null;
        }
        return <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Applied ({draft.length})
                </span>
                <button
                    type="button"
                    className="text-xs font-semibold text-primary-600 focus:outline-none focus:underline"
                    onClick={this.clearAll}
                >
                    Clear all
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {draft.map((tag) => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                    >
                        <span className="truncate max-w-[12rem]">{tag.tagName}</span>
                        <button
                            type="button"
                            className="p-0.5 rounded-full hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            aria-label={'Remove filter ' + tag.tagName}
                            onClick={() => this.toggleTag(tag)}
                        >
                            <AiOutlineClose size={11} aria-hidden="true"/>
                        </button>
                    </span>
                ))}
            </div>
        </div>;
    }

    getDimensionJSX = (dimension) => {
        const isOpen = this.state.openDimension === dimension.key;
        const suggestions = this.state.suggestionsByDimension[dimension.key] || [];
        const selectedCount = this.getDraftTags().filter(
            (tag) => tag && typeof tag.tagName === 'string' && tag.tagName.startsWith(dimension.prefix)
        ).length;
        return <div key={dimension.key} className="border-b border-gray-100">
            {/* A real button with aria-expanded, replacing the Collapsible whose
                trigger was an unfocusable div. */}
            <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-3.5 text-left focus:outline-none focus:bg-gray-50"
                onClick={() => this.setState({ openDimension: isOpen ? null : dimension.key })}
                aria-expanded={isOpen}
            >
                <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{dimension.label}</span>
                    {selectedCount > 0 &&
                        <span className="px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold tabular-nums">
                            {selectedCount}
                        </span>
                    }
                </span>
                {isOpen
                    ? <MdExpandLess size={20} className="text-gray-400" aria-hidden="true"/>
                    : <MdExpandMore size={20} className="text-gray-400" aria-hidden="true"/>
                }
            </button>
            {isOpen &&
                <div className="px-4 pb-3">
                    <div className="relative">
                        <AiOutlineSearch
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            className="w-full h-9 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-primary-500"
                            placeholder={'Search ' + dimension.label.toLowerCase()}
                            value={this.state.searchByDimension[dimension.key] || ''}
                            onChange={(event) => this.onSearchChange(dimension, event.target.value)}
                            aria-label={'Search ' + dimension.label.toLowerCase()}
                        />
                    </div>
                    <div className="mt-2 max-h-56 overflow-y-auto -mx-1">
                        {suggestions.length === 0
                            ? <p className="px-1 py-4 text-center text-sm text-gray-400">No matches</p>
                            : suggestions.map((tag) => {
                                const isSelected = this.isSelected(tag.id);
                                return <button
                                    key={tag.id}
                                    type="button"
                                    className={'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left text-sm transition-colors '
                                        + (isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700')}
                                    onClick={() => this.toggleTag(tag)}
                                    aria-pressed={isSelected}
                                >
                                    {/* A styled span, not a checkbox input: the row is
                                        the control, and a nested input only produced
                                        React's "checked without onChange" warning. */}
                                    <span
                                        className={'shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold '
                                            + (isSelected
                                                ? 'bg-primary-600 border-primary-600 text-white'
                                                : 'bg-white border-gray-300 text-transparent')}
                                        aria-hidden="true"
                                    >
                                        &#10003;
                                    </span>
                                    <span className="truncate">{this.stripPrefix(tag.tagName, dimension.prefix)}</span>
                                </button>;
                            })
                        }
                    </div>
                </div>
            }
        </div>;
    }

    render() {
        return <div className="flex flex-col w-full max-h-[75vh]">
            {this.getAppliedChipsJSX()}
            <div className="flex-1 overflow-y-auto">
                {FILTER_DIMENSIONS.map((dimension) => this.getDimensionJSX(dimension))}
            </div>
            {/* Sticky footer so the commit action is always reachable without
                scrolling past seven expandable sections. */}
            <div className="sticky bottom-0 px-4 py-3 bg-white border-t border-gray-200">
                <button
                    type="button"
                    className="w-full h-11 rounded-lg bg-primary-600 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={this.applyFilters}
                >
                    Show results
                </button>
            </div>
        </div>
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TagsFilterViewSmall);
