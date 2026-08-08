import React from 'react';
import { connect } from 'react-redux';
import {saveQuestionSet, savePaperSet, updateGeneralInfo} from '../../store/actions/solgressAction';
import QuestionsReceiver from "../../apis/QuestionsReceiver";
import TagReceiver from "../../apis/TagReceiver";
import { AiFillTags } from 'react-icons/ai';
import { JSXUtils } from '../../utils/JSXUtils';
import {currentURLHost} from './../../constants/hostConfig';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import {MiscUtils} from "../../utils/MiscUtils";
import TagFilterViewLarge from './TagFilter/TagFilterViewLarge';
import ClipLoader from "react-spinners/ClipLoader";
import PagingSection from '../adminPortal/platformCapabilities/PagingSection';
import PageCard from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Footer from '../../components/common/Footer';
import QuestionListItem from '../../components/questionSet/QuestionListItem';
import { typography, layout } from '../../constants/designTokens';
import { DEFAULT_PAGE_SIZE, coercePageSize } from '../../constants/pagination';
import { dataOf, listOf } from '../../apis/unwrap';

// Shape the list endpoint returns. Used as the fallback when a request fails so
// the render path, which reads `set.questions` and `set.pageCount`, keeps working
// instead of throwing on a null response.
const EMPTY_PAGE = { questions: [], pageCount: 0, pageSize: DEFAULT_PAGE_SIZE, totalCount: 0 };

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

class QuestionSet extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.initializeQuestions = this.initializeQuestions.bind(this);
        this.openQuestionEditingViewInNewTab = this.openQuestionEditingViewInNewTab.bind(this);
    }

    getPreDecidedTags = async () => { // Workaround : In case it's linked from my created questions. We pick this tag from session storage
        if( window.sessionStorage.getItem('createdByMe')==="true" ){
            let tags = [];
            // Was `JSON.parse(sessionStorage.getItem("userDetails")).email`, which
            // threw for a signed-out visitor arriving on a link that still had the
            // `createdByMe` flag set in their session.
            const email = UserDetailsUtil.getUserEmail();
            if (email === null) {
                return [];
            }
            await TagReceiver.getUserResourceCreationTag(email).then( tagData=> {
                    const tag = dataOf(tagData);
                    if (tag !== null && tag.id) {
                        tags.push({...tag});
                    }
                }
            );
            return tags;
        }
        return [];
    }

    resetResourceCreationSessionStorage = () => {
        window.sessionStorage.setItem('createdByMe',"false");
    }

    /**
     * Default classification filter for a bare visit to this page.
     *
     * WHY THIS EXISTS
     * ---------------
     * The unfiltered list endpoint returns rows in an order that puts the oldest
     * records first, and the oldest records are seed data: two questions literally
     * named "New Question" whose body reads "This is a sample Question. Please
     * update it", plus a batch of hand-typed arithmetic used to smoke-test the
     * submission flow. None of them carry a Subject tag, so they cannot be filtered,
     * studied, or placed in the syllabus — and they filled the entire first page,
     * which meant every new visitor's first impression of the question bank was
     * placeholder content.
     *
     * The `fulfilled` flag looks like it should identify finished questions but does
     * not: it is false for the imported questions too, and true for several of the
     * seed rows, so it carries no usable signal.
     *
     * Rather than hiding rows client-side (which would leave gaps in a server-paged
     * list and make the page counts wrong), this applies a real filter for the
     * source of the actual bank. It is returned as an ordinary tag, so it appears in
     * the filter bar as a normal chip and can be removed like any other — the
     * default is visible rather than hidden behaviour.
     *
     * Resolved at runtime instead of hardcoding an id, and a failed lookup simply
     * yields no default, leaving the previous unfiltered behaviour intact.
     */
    getDefaultClassificationTag = async () => {
        const response = await TagReceiver.getSuggestedTags('Source : ');
        const candidates = listOf(response).filter(
            (tag) => tag && tag.id && typeof tag.tagName === 'string'
                && tag.tagName.toLowerCase().startsWith('source :')
        );
        return candidates.length === 1 ? [{ ...candidates[0] }] : [];
    }

    /**
     * True when the visitor arrived with an explicit intent — a channel link, a
     * search, or "my created questions" — in which case no default is applied.
     */
    hasExplicitFilter = () => {
        if (typeof window === 'undefined') {
            return true;
        }
        const params = new URLSearchParams(window.location.search);
        const searchText = params.get('search_text');
        const hasSearch = (searchText !== null && searchText !== '')
            || (this.props.generalInfo !== undefined
                && this.props.generalInfo.searchText !== undefined
                && this.props.generalInfo.searchText !== '');
        return hasSearch
            || this.getChannelIdsFromUrl().length > 0
            || window.sessionStorage.getItem('createdByMe') === 'true';
    }

    /**
     * Channel filter taken from the URL, so a link from the channels directory
     * narrows the list. Returns an empty array when absent, which the connector
     * serialises to an empty `channel_ids` param exactly as before.
     */
    getChannelIdsFromUrl = () => {
        if (typeof window === 'undefined') {
            return [];
        }
        const channelId = new URLSearchParams(window.location.search).get('channel_id');
        return channelId == null || channelId === '' ? [] : [channelId];
    }

    initializeQuestions = async () => {
        let tags = await this.getPreDecidedTags();
        if (tags.length === 0 && !this.hasExplicitFilter()) {
            tags = await this.getDefaultClassificationTag();
        }

        let searchText = "";
        let searchTextQueryParam = new URLSearchParams(window.location.search).get('search_text');
        if(searchTextQueryParam!=null) {
            searchText = searchTextQueryParam;
        }
        if(typeof this.props.generalInfo != "undefined" && this.props.generalInfo.searchText) {
            searchText = this.props.generalInfo.searchText;
        }

        await this.loadQuestions({
            tags,
            searchText,
            pageNumber: 0,
            pageSize: DEFAULT_PAGE_SIZE,
            isInitialLoad: true,
        });
        await this.loadPapers(tags);
    }

    /**
     * THE single question-list query.
     *
     * Every path that changed the list — first load, live search, paging, page-size,
     * and each of the seven tag filters — used to build its own call to
     * getAllFilteredQuestions, and each one omitted a different subset of the
     * criteria. Applying a subject filter sent no search text and no channel; running
     * a search sent no tags; paging sent no search text. So the list, the filter
     * chips and the pager routinely disagreed about what was being shown, and any
     * two of the three controls used together produced results matching neither.
     *
     * Funnelling all of them through here means the query always carries the full
     * state, and the state that produced the results is what gets stored alongside
     * them.
     */
    loadQuestions = async ({ tags, searchText, pageNumber, pageSize, isInitialLoad, isStale }) => {
        const resolvedTags = Array.isArray(tags) ? tags : [];
        const tagIds = resolvedTags.map((tag) => tag.id);
        const resolvedSearch = searchText || '';
        // Coerced rather than defaulted: the page-size <select> hands over the
        // string "25", and this is the value stored back into redux and then used
        // for the absolute row numbering below the list.
        const resolvedPageSize = coercePageSize(pageSize);
        await QuestionsReceiver.getAllFilteredQuestions(
            resolvedSearch,
            tagIds,
            // The channels page links here as `questions?channel_id=<id>`. This page
            // never read that parameter and always sent an empty channel filter, so
            // every one of those links silently showed the unfiltered list.
            this.getChannelIdsFromUrl(),
            pageNumber,
            resolvedPageSize
        ).then(questionsData=>{
            if (typeof isStale === 'function' && isStale()) {
                return;
            }
            const payload = isInitialLoad
                ? {
                    suggestedTags: [],
                    isTagSearchActive: false,
                    searchCriteria: "SEARCH_BY_QUESTIONS",
                }
                : {...this.props.questionSet};
            payload.tags = resolvedTags;
            payload.questions = dataOf(questionsData, EMPTY_PAGE);
            payload.searchedKey = resolvedSearch;
            payload.currentPage = pageNumber + 1;
            payload.currentPageSize = resolvedPageSize;
            this.props.saveQuestionSet(payload);
        });
    }

    loadPapers = async (tags) => {
        const tagIds = (Array.isArray(tags) ? tags : []).map((tag) => tag.id);
        await PaperAPIsConnector.getAllFilteredPapers("", tagIds, []).then(paperData=>{
            let payload = {...(this.props.paperSet || {})};
            payload.tags = tags;
            payload.papers = dataOf(paperData, []);
            payload.searchCriteria = "SEARCH_BY_PAPER_NAME";
            this.props.savePaperSet(payload);
        });
    }

    /**
     * Applies a new set of filter tags. Passed down to the filter toolbar, which
     * previously ran its own query and wrote only to `generalInfo.selectedTags` —
     * a second, parallel notion of "applied filters" that never synced with the
     * `questionSet.tags` this page displays as chips. The toolbar showed one set of
     * filters, the summary strip showed another, and the results matched whichever
     * control had been touched last.
     */
    applyFilterTags = (tags) => {
        this.loadQuestions({
            tags,
            searchText: (this.props.questionSet || {}).searchedKey,
            pageNumber: 0,
            pageSize: coercePageSize((this.props.questionSet || {}).currentPageSize),
        });
        this.loadPapers(tags);
    }

    openQuestionEditingViewInNewTab = (questionId) => {
       window.open(currentURLHost + 'question/upsert?question_id=' + questionId)
    }

    // Navigation to a question or paper is now a real <a href> inside the list
    // item rather than a programmatic window.location assignment, so the
    // openInNewTab / redirectInSameTab helpers this class used to carry are gone.
    // That restores cmd-click, middle-click and "open in new tab" on every row.

    redirectToQuestionsView = () => {
        let generalInfo = {...this.props.generalInfo};
        generalInfo.isViewingQuestions = true;
        generalInfo.isViewingPapers = false;
        this.props.updateGeneralInfo(generalInfo);
    }

    redirectToPapersView = () => {
        let generalInfo = {...this.props.generalInfo};
        generalInfo.isViewingQuestions = false; // False means its paper
        generalInfo.isViewingPapers = true;
        this.props.updateGeneralInfo(generalInfo);
    }
    
    /**
     * Content-type switcher. Rendered as a segmented control rather than
     * underlined tabs so it reads as a filter on one collection instead of
     * navigation between unrelated pages -- which is what it actually is.
     *
     * "Notes" is a real roadmap item but has no content behind it, so it is
     * explicitly marked and made non-interactive rather than looking like a tab
     * that silently does nothing when clicked.
     */
    getQuestionsTableHeaderJSX = () => {
        const isViewingQuestions = typeof this.props.generalInfo == "undefined" || this.props.generalInfo.isViewingQuestions;
        const base = 'relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1';
        const active = 'bg-white text-gray-900 shadow-sm';
        const inactive = 'text-gray-500 hover:text-gray-800';
        const paperCount = (this.props.paperSet && Array.isArray(this.props.paperSet.papers))
            ? this.props.paperSet.papers.length
            : null;
        return <div className='inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl'>
                    <button
                        className={base + ' ' + (isViewingQuestions ? active : inactive)}
                        onClick={this.redirectToQuestionsView}
                        aria-current={isViewingQuestions ? 'page' : undefined}
                    >
                        Questions
                    </button>
                    <button
                        className={base + ' ' + (!isViewingQuestions ? active : inactive)}
                        onClick={this.redirectToPapersView}
                        aria-current={!isViewingQuestions ? 'page' : undefined}
                    >
                        Papers
                        {paperCount !== null &&
                            <span className='ml-1.5 text-xs font-normal text-gray-400 tabular-nums'>{paperCount}</span>
                        }
                    </button>
                    <span
                        className='px-4 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed inline-flex items-center gap-1.5'
                        aria-disabled="true"
                        title="Notes are not available yet"
                    >
                        Notes
                        <span className='px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-warning-100 text-warning-700'>
                            Soon
                        </span>
                    </span>
                </div>;
    }

    getTagsDivJSX = (tags, createdBy) => {
        if (tags === 0) {
            return;
        }
        // Imported questions carry ~10 tags each. Showing all of them, prefixes and
        // all, buries the question text. So: drop the provenance/bookkeeping tags,
        // strip the "Prefix : " for display, and cap the visible count.
        const HIDDEN_TAG_PREFIXES = ['Created By : ', 'Source : '];
        const MAX_VISIBLE_TAGS = 4;
        const displayable = (tags || []).filter(
            tag => tag && tag.tagName && !HIDDEN_TAG_PREFIXES.some(p => tag.tagName.startsWith(p))
        );
        const stripPrefix = (name) => {
            const idx = name.indexOf(' : ');
            return idx === -1 ? name : name.slice(idx + 3);
        };
        let response = [];
        displayable.slice(0, MAX_VISIBLE_TAGS).forEach(tag=> {
            response.push(
                <Badge key={tag.id} variant="neutral">{stripPrefix(tag.tagName)}</Badge>
                )
        });
        const hiddenCount = displayable.length - response.length;
        if (hiddenCount > 0) {
            response.push(
                <Badge key="more" variant="gray">{'+' + hiddenCount}</Badge>
            );
        }
        // createdBy comes from the backend as a plain string (Google id / email / free text),
        // not a resolved user object, so we display it as-is rather than assuming .name/.picture.
        const createdByDisplayName = (createdBy && typeof createdBy === 'object')
            ? (createdBy.name || '').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            : (createdBy || '');
        const createdByPicture = (createdBy && typeof createdBy === 'object') ? createdBy.picture : null;
        return <div className='flex flex-row items-center gap-2 flex-wrap mt-2'>
            <div className='flex items-center gap-1 text-gray-400'>
                <AiFillTags size={14} />
            </div>
            {createdByDisplayName &&
                <div className='flex items-center gap-1.5 bg-gray-50 rounded-full pl-1 pr-2 py-0.5'>
                    {createdByPicture &&
                        <img
                            className="rounded-full w-5 h-5"
                            src={createdByPicture}
                            alt={createdByDisplayName}
                            referrerPolicy="no-referrer"
                        />
                    }
                    <span className='text-xs text-gray-500'>{createdByDisplayName}</span>
                </div>
            }
            <div className='flex gap-1 flex-wrap'>
                {response}
            </div>
        </div>;
    }

    /**
     * The question list. Each row is a QuestionListItem, which parses the tag
     * taxonomy and renders subject/chapter/topic/difficulty/year as distinct
     * elements instead of a row of interchangeable grey pills.
     *
     * Row numbering is absolute across pages (page 3 at 10/page starts at 21),
     * derived from the pagination the API already returns. Per-page numbering
     * that restarts at 1 tells the reader nothing.
     */
    getQuestionListJSX = () => {
        const set = this.props.questionSet.questions;
        if (set == undefined || set.questions == undefined || set.questions.length === 0) {
            return <div className='py-6'>
                <EmptyState
                    title="No questions match those filters"
                    description="Try removing a filter, or widening your search."
                />
            </div>;
        }
        const currentUserGoogleId = UserDetailsUtil.getUserGoogleId();
        const pageSize = coercePageSize(this.props.questionSet.currentPageSize);
        const currentPage = this.props.questionSet.currentPage || 1;
        const firstIndex = (currentPage - 1) * pageSize + 1;
        return <div className='divide-y divide-gray-100'>
            {set.questions.map((question, index) => (
                <QuestionListItem
                    key={question.id}
                    question={question}
                    index={firstIndex + index}
                    href={currentURLHost + 'question/view?question_id=' + question.id}
                    isOwner={currentUserGoogleId != null && question.createdBy === currentUserGoogleId}
                    onEdit={this.openQuestionEditingViewInNewTab}
                />
            ))}
        </div>;
    }

    /**
     * Summary strip above the list: how many results, and which filters produced
     * them. Without this, a filtered list is indistinguishable from an unfiltered
     * one and users lose track of why they are seeing so few results.
     *
     * NOTE ON COUNTS: the API returns only `pageSize` and `pageCount`, with no
     * total-element count, and its pageCount is `floor(total/pageSize) + 1`. An
     * exact total therefore cannot be derived, so this deliberately reports the
     * range on the current page rather than inventing a total.
     */
    getResultSummaryJSX = () => {
        const set = this.props.questionSet || {};
        const page = set.questions;
        if (page == undefined || page.questions == undefined || page.questions.length === 0) {
            return <div />;
        }
        const pageSize = coercePageSize(set.currentPageSize);
        const currentPage = set.currentPage || 1;
        const first = (currentPage - 1) * pageSize + 1;
        const last = first + page.questions.length - 1;
        const searchedKey = set.searchedKey;
        // The API now returns the total number of matches, so this can finally say
        // "of 11,881" instead of leaving the range without context. The count query
        // was already being run server-side to work out the page count; it just was
        // not being sent. Still guarded rather than assumed: an older backend, or a
        // response that omits the field, falls back to the range alone rather than
        // rendering "of undefined".
        const totalCount = Number.isFinite(page.totalCount) && page.totalCount > 0
            ? page.totalCount
            : null;
        // The applied-filter chips used to be duplicated here as well as in the
        // filter toolbar above, from two different pieces of state that did not stay
        // in sync — so the two lists of chips regularly disagreed. They now live only
        // in the toolbar, where they are also removable.
        return <div className='flex items-center justify-between gap-4 flex-wrap px-4 md:px-5 py-3 border-b border-gray-100 bg-gray-50/60'>
            <p className='text-sm text-gray-600'>
                Showing <span className='font-semibold text-gray-900 tabular-nums'>{first}&ndash;{last}</span>
                {totalCount !== null
                    ? <> of <span className='font-semibold text-gray-900 tabular-nums'>{totalCount.toLocaleString()}</span></>
                    : null}
                {searchedKey ? <> for <span className='font-semibold text-gray-900'>&ldquo;{searchedKey}&rdquo;</span></> : null}
            </p>
        </div>;
    }

    /**
     * Papers list. A paper is a container of questions, so it gets a heavier
     * treatment than a question row: a leading glyph and a clear count, because
     * "start a timed paper" is a bigger commitment than "try one question" and
     * the UI should say so.
     */
    getPapersListJSX = () => {
        // `paperSet` is a separate redux slice filled by a second request, so it is
        // still undefined while that request is in flight. Reading `.papers` off it
        // threw and took the whole page down to a blank screen. That was unreachable
        // until the /papers route started actually selecting this view, because the
        // question list was always shown instead.
        if(this.props.paperSet == undefined) {
            return <div className='flex justify-center py-12'>
                <ClipLoader color="#2563EB" size={40}/>
            </div>;
        }
        if(this.props.paperSet.papers == undefined || this.props.paperSet.papers.length===0) {
            return <div className='py-6'>
                <EmptyState
                    title="No papers yet"
                    description="Timed papers assembled from the question bank will appear here."
                />
            </div>;
        }
        return <div className='divide-y divide-gray-100'>
            {this.props.paperSet.papers.map((paper) => {
                const questionCount = Array.isArray(paper.questionIds)
                    ? paper.questionIds.length
                    : (Array.isArray(paper.questions) ? paper.questions.length : null);
                const href = currentURLHost + 'paper/view?paper_id=' + paper.id
                    + '&paper_instance_id=' + MiscUtils.generateUUID();
                return <article key={paper.id} className='group flex items-start gap-4 px-4 md:px-5 py-4 bg-white transition-colors hover:bg-gray-50/70'>
                    <span className='shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center' aria-hidden="true">
                        <AiFillTags size={18} />
                    </span>
                    <div className='flex-1 min-w-0'>
                        <a href={href} className='block focus:outline-none'>
                            <div
                                className={typography.h3 + ' group-hover:text-primary-700 transition-colors'}
                                dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(paper.paper_name)}}
                            />
                        </a>
                        {questionCount !== null &&
                            <p className='mt-1 text-xs text-gray-500 tabular-nums'>{questionCount} questions</p>
                        }
                        {this.getTagsDivJSX(paper.tags)}
                    </div>
                    <a
                        href={href}
                        className='shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded'
                    >
                        Start
                        <span className='transition-transform group-hover:translate-x-0.5' aria-hidden="true">&rarr;</span>
                    </a>
                </article>;
            })}
        </div>;
    }

    getQuestionsTableJSX = () => {
        const isViewingQuestions = this.props.generalInfo == undefined || this.props.generalInfo.isViewingQuestions;
        return <div className='w-full'>
                {isViewingQuestions ? this.getResultSummaryJSX() : null}
                {isViewingQuestions ? this.getQuestionListJSX() : this.getPapersListJSX()}
            </div>
    } 

    refreshSearch = (pageNumber, updatedPageSize) => {
        let updatedPageNumber = pageNumber;
        if(pageNumber == null) {
            updatedPageNumber = this.props.questionSet.currentPage - 1;
        }
        this.loadQuestions({
            tags: this.props.questionSet.tags,
            searchText: this.props.questionSet.searchedKey,
            pageNumber: updatedPageNumber,
            pageSize: updatedPageSize,
        });
    }

    // A `getHelpSectionJSX` used to live here: four YouTube <iframe> embeds titled
    // "How to create a multiple choice question on educationalbridge ?" and
    // "What is educationalbridge ?", gated on a `helpSectionEnabled` flag. It had no
    // call site, so it never rendered, and it would have loaded third-party
    // tracking iframes onto the main content page if it had. Removed along with its
    // toggle handler.

    handlePageChange = (event, value) => {
        // Guard read the wrong path (questionSet.pageCount is undefined; the count
        // is on questionSet.questions.pageCount), so `value > undefined` was always
        // false and the upper bound was never enforced.
        const pageCount = (this.props.questionSet.questions || {}).pageCount;
        if(value<=0 || (pageCount != null && value>pageCount)) {
            return;
        }
        this.refreshSearch(value-1, this.props.questionSet.currentPageSize);
    }

    /**
     * Changing the page size returns to page 1. Staying on page 40 while moving
     * from 10 to 100 per page would silently jump the reader ~3,900 rows forward
     * from what they were looking at.
     */
    updatePageSize = (event) => {
        this.refreshSearch(0, coercePageSize(event.target.value));
    }

    /**
     * The pager belongs to the questions collection only.
     *
     * It used to render unconditionally, below whichever list was showing. Papers
     * are fetched by `loadPapers`, which calls `getAllFilteredPapers` with no paging
     * arguments at all — the endpoint returns every paper in one response. So the
     * Papers tab displayed a pager reporting the *questions* page count, and
     * clicking page 2 of it re-queried questions and left the paper list untouched.
     *
     * It is also suppressed when the current result set is empty, where a pager has
     * nothing to page through, and PagingSection itself returns null at one page.
     */
    getPagingSection = () => {
        const isViewingQuestions = !this.props.generalInfo || Boolean(this.props.generalInfo.isViewingQuestions);
        if (!isViewingQuestions) {
            return null;
        }
        const page = this.props.questionSet.questions;
        if (!page || !Array.isArray(page.questions) || page.questions.length === 0) {
            return null;
        }
        return <div className='w-full pt-6'>
            <PagingSection
                pageCount = {page.pageCount}
                currentPageNumber = {this.props.questionSet.currentPage}
                handlePageChange = {this.handlePageChange}
                currentPageSize = {this.props.questionSet.currentPageSize}
                updatePageSize = {this.updatePageSize}
            />
        </div>;
    }

    /**
     * Live search from the header, called on every keystroke.
     *
     * THREE THINGS WERE WRONG
     * -----------------------
     * 1. It fired a request per character. Typing "trigonometry" issued twelve
     *    searches, and because responses can arrive out of order, the list often
     *    settled on the results for a prefix rather than the full query — the
     *    displayed results simply did not match the box. Requests are now debounced
     *    and each response is checked against the latest query before being applied.
     *
     * 2. It passed empty tag and channel arrays, so searching silently dropped every
     *    active filter while the filter chips above the list carried on claiming to
     *    be applied. Searching within a subject was impossible. The active tags and
     *    the channel from the URL are now carried through.
     *
     * 3. It reset neither the page number nor the page size, so a search run from
     *    page 4 displayed page-1 results while the pager still read "page 4".
     */
    SEARCH_DEBOUNCE_MS = 300;

    updateSearchText = () => {
        const searchText = (this.props.generalInfo && this.props.generalInfo.searchText) || '';
        if (this.searchDebounceTimer != null) {
            clearTimeout(this.searchDebounceTimer);
        }
        this.searchDebounceTimer = setTimeout(() => this.runSearch(searchText), this.SEARCH_DEBOUNCE_MS);
    }

    runSearch = (searchText) => {
        this.latestSearchQuery = searchText;
        const set = this.props.questionSet || {};
        this.loadQuestions({
            tags: set.tags,
            searchText,
            pageNumber: 0,
            pageSize: coercePageSize(set.currentPageSize),
            // A slower earlier request must not overwrite a newer one's results.
            isStale: () => this.latestSearchQuery !== searchText,
        });
    }

    componentDidMount() {
        // Both of these used to run from inside render(): initializeQuestions
        // dispatches redux actions and resetResourceCreationSessionStorage writes to
        // sessionStorage, so a render was mutating application state. React may call
        // render more than once for a single commit, which made the number of list
        // requests on first paint non-deterministic.
        if (this.props.questionSet === undefined) {
            this.initializeQuestions();
        }
        this.resetResourceCreationSessionStorage();
        this.applyRouteDefaultView();
    }

    /**
     * `/questions` and `/papers` are the same component, and which collection it
     * showed was decided solely by `generalInfo.isViewingQuestions` — which the
     * header seeds to `true` unconditionally. So `/papers` rendered the question
     * list: every link to papers, including the one in the header nav and the
     * "Browse papers" links on the empty states, landed on questions with no
     * indication anything had been ignored.
     *
     * The route now sets the initial view. Clicking the segmented control still
     * overrides it, because this runs once on mount.
     */
    applyRouteDefaultView = () => {
        if (typeof window === 'undefined') {
            return;
        }
        const isPapersRoute = window.location.pathname.replace(/\/+$/, '') === '/papers';
        const generalInfo = {...(this.props.generalInfo || {})};
        if (generalInfo.isViewingQuestions === !isPapersRoute) {
            return;
        }
        generalInfo.isViewingQuestions = !isPapersRoute;
        generalInfo.isViewingPapers = isPapersRoute;
        this.props.updateGeneralInfo(generalInfo);
    }

    componentWillUnmount() {
        if (this.searchDebounceTimer != null) {
            clearTimeout(this.searchDebounceTimer);
        }
    }

    /**
     * Page heading. The list previously started immediately under the header with no
     * title or context, so the page gave no sense of what you were looking at.
     * The page indicator is derived from the pagination the API already returns
     * rather than a hardcoded total, so it cannot drift out of date.
     */
    getPageHeadingJSX = () => {
        const isViewingQuestions = typeof this.props.generalInfo == "undefined" || this.props.generalInfo.isViewingQuestions;
        const set = this.props.questionSet || {};
        const currentPage = set.currentPage;
        // pageCount lives on the response envelope (set.questions.pageCount), not
        // on the redux slice itself. Reading set.pageCount returned undefined, so
        // this indicator never rendered.
        //
        // It is also scoped to the questions collection and to result sets that
        // actually span more than one page. Papers are fetched unpaged, so on the
        // Papers tab this read "Page 1 of 468" — the *questions* page count, beside a
        // list of papers it had nothing to do with. And a search that matched nothing
        // reported "Page 1 of 1" above an empty state.
        const pageCount = isViewingQuestions ? (set.questions || {}).pageCount : null;
        const showPageIndicator = Number.isFinite(pageCount) && pageCount > 1;
        return <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
            <div>
                <h1 className={typography.h1}>
                    {isViewingQuestions ? 'Practice questions' : 'Practice papers'}
                </h1>
                <p className='mt-1 text-sm text-gray-500 max-w-2xl'>
                    {isViewingQuestions
                        ? 'Every question is tagged by subject, chapter, topic and difficulty, so you can drill exactly what you need instead of working front to back.'
                        : 'Full-length timed papers assembled from the question bank.'}
                </p>
            </div>
            {currentPage && showPageIndicator
                ? <div className='text-sm text-gray-500 shrink-0 tabular-nums'>
                    Page <span className='font-semibold text-gray-700'>{currentPage}</span> of {pageCount}
                </div>
                : null}
        </div>;
    }

    render() {
        // The small-screen fork is gone. This page used to hand mobile visitors off
        // to QuestionSetSmallScreen, a near-duplicate carrying the pre-redesign MUI
        // table, raw unparsed tag pills and unsanitised question HTML -- so none of
        // the work on this page reached mobile, which is the majority of the
        // audience. The layout below is responsive: the ad rails are already
        // `hidden xl:block`, the filter toolbar wraps, and QuestionListItem has its
        // own compact small-screen arrangement.
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.questionSet === undefined){
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader
                    updateSearchText = {this.updateSearchText}
                />
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size={60}/>
                </div>
            </div>
        }
        return <div className='bg-gray-50 min-h-screen'>
            <EducationalBridgeHeader
                updateSearchText = {this.updateSearchText}
            />
            {/* Single content column at the shared container width, lining up with
                the header wordmark. The flex row that used to sit here existed only
                to hold an advertising rail either side of the content. */}
            <div className={layout.container + ' py-8'}>
                <div className="min-w-0">
                    {this.getPageHeadingJSX()}
                    {/* Segmented control sits directly under the heading, then the
                        tag filters, then the list. Previously the tabs were welded
                        to the top of the list card, which made them look like part
                        of the results rather than a control over them. */}
                    {/* Horizontally scrollable on very narrow viewports so the
                        segmented control never wraps mid-set or clips. */}
                    <div className='mt-5 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto'>
                        {this.getQuestionsTableHeaderJSX()}
                    </div>
                    <div className='mt-4'>
                        {/* The toolbar is told which tags are applied and reports back
                            when they change, instead of running its own query against
                            its own copy of the filter state. */}
                        <TagFilterViewLarge
                            appliedTags = {this.props.questionSet.tags}
                            onFiltersChanged = {this.applyFilterTags}
                        />
                    </div>
                    <PageCard padding="p-0" className="mt-4 overflow-hidden">
                        {this.getQuestionsTableJSX()}
                    </PageCard>
                    {/* The pager returns null when it has nothing to offer, and its
                        own top padding goes with it — the wrapper here used to be an
                        always-present `py-8` centring row, which left 64px of empty
                        space under the empty state and under the Papers tab. */}
                    {this.getPagingSection()}
                </div>
            </div>
            <Footer />
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(QuestionSet);
