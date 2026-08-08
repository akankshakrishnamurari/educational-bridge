import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet} from '../../store/actions/solgressAction';
import QuestionsReceiver from "../../apis/QuestionsReceiver";
import TagReceiver from '../../apis/TagReceiver';
import {AiOutlineSearch, AiOutlinePlus} from "react-icons/ai";
import {currentURLHost} from './../../constants/hostConfig';
import TagFilterViewLarge from './TagFilter/TagFilterViewLarge';
import { dataOf, listOf } from '../../apis/unwrap';

// Fallback shape for the paged list endpoint, used when a request fails so
// render paths that read `.questions` / `.pageCount` keep working.
const EMPTY_PAGE = { questions: [], pageCount: 0, pageSize: 10 };

const SEARCH_DEBOUNCE_MS = 300;

const mapDispatchToProps = dispatch => ({
    saveQuestionSet: (payload) => dispatch(saveQuestionSet(payload))
})


const mapStateToProps = state => {
    return {
        questionSet: state.solgressReducer.questionSet
    };
}

/**
 * Search-and-filter bar above the question picker in the paper builder.
 *
 * WHAT WAS WRONG
 * --------------
 * The suggestion list was shown and hidden by `onMouseEnter` / `onMouseLeave` on
 * the wrapper. That has two consequences: on a touch screen the list could not be
 * opened at all, and with a mouse the list closed as soon as the pointer left the
 * wrapper — which happens on the way to the suggestion you were reaching for. Each
 * suggestion was also a `<div onClick>` with no `key`, so none of them were
 * focusable and React re-created the whole list on every keystroke.
 *
 * Every keystroke additionally fired an unthrottled list query with no ordering
 * guarantee, so the results could settle on a prefix of what had been typed.
 *
 * A `getTagButton` helper was removed: it had no call site and rendered an
 * `<input>` inside a `<select>`, which is not valid markup.
 *
 * The channel-suggestion half of this component was removed too. It was reachable
 * only when `searchCriteria === 'SEARCH_AND_ADD_CHANNELS'`, a value nothing in the
 * app ever sets (the only control that could set it was the commented-out option in
 * the dead `getTagButton`), and it read `questionSet.channels`, which this page
 * never populates — so the single path that could reach it would have thrown on
 * `undefined.forEach`.
 */
class QuestionSetSearchBoxComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = { tagQuery: '', isSuggestionListOpen: false };
    }

    componentWillUnmount() {
        if (this.searchTimer != null) {
            clearTimeout(this.searchTimer);
        }
        if (this.tagTimer != null) {
            clearTimeout(this.tagTimer);
        }
    }

    getAppliedTags = () => {
        const tags = this.props.questionSet && this.props.questionSet.tags;
        return Array.isArray(tags) ? tags : [];
    }

    getSuggestedTags = () => {
        const suggested = this.props.questionSet && this.props.questionSet.suggestedTags;
        return Array.isArray(suggested) ? suggested : [];
    }

    onTagQueryChange = (value) => {
        this.setState({ tagQuery: value, isSuggestionListOpen: true });
        if (this.tagTimer != null) {
            clearTimeout(this.tagTimer);
        }
        this.tagTimer = setTimeout(() => this.fetchTagSuggestions(value), SEARCH_DEBOUNCE_MS);
    }

    fetchTagSuggestions = (value) => {
        this.latestTagQuery = value;
        TagReceiver.getSuggestedTags(value).then(tagData=>{
            if (this.latestTagQuery !== value) {
                return;
            }
            const existingTagIds = this.getAppliedTags().map((tag) => tag.id);
            const suggestedTags = listOf(tagData).filter((tag) => !existingTagIds.includes(tag.id));
            this.props.saveQuestionSet({
                ...this.props.questionSet,
                suggestedTags,
            });
        });
    }

    addNewTag = (tagToAdd) => {
        if (tagToAdd == null || tagToAdd.id == null) {
            return;
        }
        const tags = [...this.getAppliedTags(), tagToAdd];
        const suggestedTags = this.getSuggestedTags().filter((tag) => tag.id !== tagToAdd.id);
        this.setState({ isSuggestionListOpen: false });
        this.refreshQuestions({ tags, suggestedTags });
    }

    /**
     * Single query path, so the search text and the applied tags always travel
     * together. The three call sites here previously each built their own call and
     * dropped a different part of the criteria.
     */
    refreshQuestions = ({ tags, suggestedTags, searchedKey }) => {
        const set = this.props.questionSet || {};
        const resolvedTags = tags === undefined ? this.getAppliedTags() : tags;
        const resolvedSearch = searchedKey === undefined ? (set.searchedKey || '') : searchedKey;
        QuestionsReceiver.getAllFilteredQuestions(
            resolvedSearch,
            resolvedTags.map((tag) => tag.id),
            [],
            0,
            set.currentPageSize || 10
        ).then(questionsData=>{
            this.props.saveQuestionSet({
                ...this.props.questionSet,
                tags: resolvedTags,
                ...(suggestedTags === undefined ? {} : { suggestedTags }),
                questions: dataOf(questionsData, EMPTY_PAGE),
                searchedKey: resolvedSearch,
                currentPage: 1,
            });
        });
    }

    onQuestionSearchChange = (value) => {
        if (this.searchTimer != null) {
            clearTimeout(this.searchTimer);
        }
        this.searchTimer = setTimeout(() => {
            this.latestSearch = value;
            const set = this.props.questionSet || {};
            QuestionsReceiver.getAllFilteredQuestions(
                value,
                this.getAppliedTags().map((tag) => tag.id),
                [],
                0,
                set.currentPageSize || 10
            ).then(questionsData=>{
                if (this.latestSearch !== value) {
                    return;
                }
                this.props.saveQuestionSet({
                    ...this.props.questionSet,
                    questions: dataOf(questionsData, EMPTY_PAGE),
                    searchedKey: value,
                    currentPage: 1,
                });
            });
        }, SEARCH_DEBOUNCE_MS);
    }

    getSuggestionListJSX = () => {
        if (!this.state.isSuggestionListOpen) {
            return null;
        }
        const suggestedTags = this.getSuggestedTags();
        if (suggestedTags.length === 0) {
            return null;
        }
        return <ul className='absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-md py-1'>
            {suggestedTags.map((tag) => (
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
        return <div className='w-full'>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 py-2'>
                <div className='relative flex-1 min-w-0'>
                    <AiOutlineSearch
                        size={16}
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                    />
                    <input
                        type="search"
                        className='w-full h-10 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                        placeholder="Search questions to add"
                        onChange={(event)=>this.onQuestionSearchChange(event.target.value)}
                        aria-label="Search questions to add"
                    />
                </div>
                <div className='relative flex-1 min-w-0'>
                    <input
                        type="text"
                        className='w-full h-10 px-3 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                        placeholder="Add a tag filter"
                        value={this.state.tagQuery}
                        onChange={(event)=>this.onTagQueryChange(event.target.value)}
                        onFocus={()=>this.setState({ isSuggestionListOpen: true })}
                        // Closed on blur rather than mouse-out. A short delay lets a
                        // click on a suggestion land before the list unmounts, which
                        // the previous onMouseLeave version raced against.
                        onBlur={()=>setTimeout(()=>this.setState({ isSuggestionListOpen: false }), 150)}
                        aria-label="Add a tag filter"
                    />
                    {this.getSuggestionListJSX()}
                </div>
                <a
                    href={currentURLHost + 'question/upsert'}
                    target="_blank"
                    rel="noreferrer"
                    className='shrink-0 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                >
                    <AiOutlinePlus size={15} aria-hidden="true"/>
                    New question
                </a>
            </div>
            <TagFilterViewLarge
                appliedTags = {this.getAppliedTags()}
                onFiltersChanged = {(tags) => this.refreshQuestions({ tags })}
            />
        </div>;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionSetSearchBoxComponent);
