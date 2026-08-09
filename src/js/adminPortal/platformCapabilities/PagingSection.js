import React from 'react';
import { AiOutlineLeft, AiOutlineRight, AiOutlineDown } from 'react-icons/ai';
import { PAGE_SIZE_OPTIONS, coercePageSize, DEFAULT_PAGE_SIZE } from '../../../constants/pagination';

/**
 * List pagination.
 *
 * WHAT THIS REPLACES
 * ------------------
 * A `@material-ui/lab/Pagination` (Material UI v4) sitting next to a gear icon
 * that opened a `react-tiny-popover`, inside which lived the page-size select and
 * a jump-to-page box. Five problems, in rough order of severity:
 *
 * 1. It was the app's only Material UI v4 consumer. The rest of the app is on
 *    @mui v5, so both major versions were being downloaded — two complete copies
 *    of the same component library, plus two copies of JSS/emotion — to render one
 *    row of page buttons. Built from tokens instead, v4 leaves the bundle
 *    entirely.
 *
 * 2. The page size and jump-to-page controls were hidden behind an unlabelled
 *    gear. Choosing how many results to see is a primary control on a list of
 *    ~11.9k rows, not a setting; nothing indicated it existed.
 *
 * 3. Class strings were concatenated without separators, so the resulting
 *    classNames contained fused tokens. `'text-gray-600 px-2' + generalTextSize`
 *    produced `px-2text-xs`, killing both the padding and the text size, and
 *    `pagesizeOptionTextSize + pagingSelectionButtonStyle` produced
 *    `xl:text-mdborder`, which is why the page-size select rendered with no
 *    border at all. Every class string here is joined through a helper.
 *
 * 4. The jump-to-page input fired the page change on every keystroke. Typing "12"
 *    requested page 1, then page 12; typing "125" requested 1, 12, then 125. It is
 *    now a form with an explicit submit, validated against the real page count.
 *
 * 5. Nothing closed the popover after a change, and no control reported which
 *    page you were on unless you opened the gear.
 *
 * PAGE NUMBERING
 * --------------
 * `currentPageNumber` is 1-based, matching what the user sees. The API's
 * `page_start_index` is 0-based, and the conversion stays where it already lived,
 * in the consumers' `handlePageChange`.
 */

const cx = (...parts) => parts.filter(Boolean).join(' ');

const range = (start, end) => {
    const out = [];
    for (let index = start; index <= end; index += 1) {
        out.push(index);
    }
    return out;
};

/**
 * Builds the visible page slots, with gaps where pages are elided.
 *
 * Always shows the first page, the last page, the current page and one page
 * either side of it, in a fixed number of slots so the control does not change
 * width as you move through the pages — a pager that reflows under the cursor
 * makes clicking "next" twice in a row unreliable.
 */
const buildPageItems = (current, total, siblings = 1) => {
    if (!Number.isFinite(total) || total < 1) {
        return [];
    }
    // first + last + current + siblings either side + two gap markers
    const maxSlots = siblings * 2 + 5;
    if (total <= maxSlots) {
        return range(1, total);
    }
    const left = Math.max(current - siblings, 1);
    const right = Math.min(current + siblings, total);
    // A gap standing in for a single page would be wider than the page it hides.
    const hasLeftGap = left > 3;
    const hasRightGap = right < total - 2;

    if (!hasLeftGap && hasRightGap) {
        return [...range(1, Math.max(maxSlots - 2, right)), 'gap-end', total];
    }
    if (hasLeftGap && !hasRightGap) {
        return [1, 'gap-start', ...range(Math.min(total - maxSlots + 3, left), total)];
    }
    return [1, 'gap-start', ...range(left, right), 'gap-end', total];
};

// Split so that no two of these set the same property. Tailwind runs with
// `important: true`, which means conflicting utilities in one className resolve by
// stylesheet order rather than the order they were written — so the active and
// idle states must not both declare a background, border colour or text colour.
const PAGE_BUTTON_BASE = 'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 '
    + 'text-sm font-semibold tabular-nums rounded-lg border transition-colors '
    + 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1';
const PAGE_BUTTON_ACTIVE = 'bg-primary-600 border-primary-600 text-white';
const PAGE_BUTTON_IDLE = 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400';

const NAV_BUTTON_BASE = 'inline-flex items-center gap-1.5 h-9 px-3 text-sm font-semibold '
    + 'rounded-lg border transition-colors '
    + 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1';
const NAV_BUTTON_IDLE = 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400';
const NAV_BUTTON_DISABLED = 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed';

const SELECT_CLASS = 'h-9 pl-3 pr-9 text-sm font-semibold text-gray-700 bg-white border border-gray-300 '
    + 'rounded-lg appearance-none cursor-pointer transition-colors hover:border-gray-400 '
    + 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

// The page-size <select> and the jump box need labels tied to them by id, and two
// pagers could in principle share a document, so ids are per-instance rather than
// a constant.
let instanceCount = 0;

class PagingSection extends React.Component {

    constructor(props) {
        super(props);
        instanceCount += 1;
        this.instanceId = 'paging-' + instanceCount;
        // Held locally and only committed on submit, so typing a page number does
        // not fire a request per digit.
        this.state = { jumpDraft: '', jumpError: null };
    }

    getPageCount = () => {
        const count = Number(this.props.pageCount);
        return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
    }

    getCurrentPage = () => {
        const current = Number(this.props.currentPageNumber);
        const pageCount = this.getPageCount();
        if (!Number.isFinite(current) || current < 1) {
            return 1;
        }
        return pageCount > 0 ? Math.min(current, pageCount) : current;
    }

    goToPage = (event, page) => {
        const pageCount = this.getPageCount();
        if (page < 1 || (pageCount > 0 && page > pageCount) || page === this.getCurrentPage()) {
            return;
        }
        this.props.handlePageChange(event, page);
    }

    commitJump = (event) => {
        event.preventDefault();
        const draft = this.state.jumpDraft.trim();
        if (draft === '') {
            this.setState({ jumpError: null });
            return;
        }
        const pageCount = this.getPageCount();
        const requested = Number(draft);
        // Rejected with a reason rather than silently ignored, which is what the
        // old input did for anything out of range.
        if (!Number.isInteger(requested) || requested < 1 || (pageCount > 0 && requested > pageCount)) {
            this.setState({ jumpError: 'Enter 1\u2013' + pageCount });
            return;
        }
        this.setState({ jumpDraft: '', jumpError: null });
        this.goToPage(event, requested);
    }

    updateJumpDraft = (event) => {
        // Digits only. Typed rather than pasted junk is filtered here so the field
        // cannot hold a value the submit handler would have to reject.
        this.setState({ jumpDraft: event.target.value.replace(/[^0-9]/g, ''), jumpError: null });
    }

    getPageSizeSelectorJSX = () => {
        const selectId = this.instanceId + '-size';
        const currentSize = coercePageSize(this.props.currentPageSize || DEFAULT_PAGE_SIZE);
        return <div className='flex items-center gap-2'>
            <label htmlFor={selectId} className='text-sm text-gray-500 whitespace-nowrap'>
                Per page
            </label>
            <div className='relative'>
                <select
                    id={selectId}
                    className={SELECT_CLASS}
                    value={currentSize}
                    onChange={(event) => this.props.updatePageSize(event)}
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
                {/* Native select arrows differ per platform and none of them match
                    the rest of the controls, so the field is `appearance-none` with
                    its own chevron. Not focusable and hidden from AT: the select
                    behind it is the control. */}
                <span
                    className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400'
                    aria-hidden="true"
                >
                    <AiOutlineDown size={12} />
                </span>
            </div>
        </div>;
    }

    getPageButtonsJSX = () => {
        const pageCount = this.getPageCount();
        const currentPage = this.getCurrentPage();
        const items = buildPageItems(currentPage, pageCount);
        return items.map((item) => {
            if (typeof item !== 'number') {
                return <span
                    key={item}
                    className='inline-flex items-center justify-center min-w-[2.25rem] h-9 text-sm text-gray-400 select-none'
                    aria-hidden="true"
                >
                    &hellip;
                </span>;
            }
            const isCurrent = item === currentPage;
            return <button
                key={item}
                type="button"
                className={cx(PAGE_BUTTON_BASE, isCurrent ? PAGE_BUTTON_ACTIVE : PAGE_BUTTON_IDLE)}
                // The old MUI pager marked the current page with `aria-current="true"`
                // on a nested span; a screen reader announced a row of identical
                // buttons with no indication of position.
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={'Page ' + item}
                onClick={(event) => this.goToPage(event, item)}
            >
                {item}
            </button>;
        });
    }

    getNavButtonJSX = (direction) => {
        const pageCount = this.getPageCount();
        const currentPage = this.getCurrentPage();
        const isPrevious = direction === 'previous';
        const target = isPrevious ? currentPage - 1 : currentPage + 1;
        const isDisabled = isPrevious ? currentPage <= 1 : currentPage >= pageCount;
        return <button
            type="button"
            className={cx(NAV_BUTTON_BASE, isDisabled ? NAV_BUTTON_DISABLED : NAV_BUTTON_IDLE)}
            disabled={isDisabled}
            aria-label={isPrevious ? 'Previous page' : 'Next page'}
            onClick={(event) => this.goToPage(event, target)}
        >
            {/* The word is dropped below `sm`, leaving the arrow.
                Not a style preference — a measurement. Below `sm` the pager is the
                readout row, and "Previous" + "Page 476 of 476" + "Next" comes to
                about 297px of content. A 320px phone offers 288px inside the page
                gutter, and 254px once the control sits in a card with its own
                padding, as it does in the paper builder's question picker. Keeping
                the labels there pushed the document wider than the window.
                Tuning the gaps instead would leave single-digit slack that the
                readout eats as soon as the page number reaches three digits, so the
                labels go. `aria-label` on the button already carries the full name,
                so nothing is lost to a screen reader. */}
            {isPrevious
                ? <><AiOutlineLeft size={12} aria-hidden="true" /><span className='hidden sm:inline'>Previous</span></>
                : <><span className='hidden sm:inline'>Next</span><AiOutlineRight size={12} aria-hidden="true" /></>}
        </button>;
    }

    /**
     * Direct entry, shown only once there are enough pages for stepping to be
     * impractical. Below that threshold every page is either visible as a button or
     * two clicks away, and the box is just another field to ignore.
     */
    getJumpFormJSX = () => {
        const pageCount = this.getPageCount();
        if (pageCount <= 12 || this.props.compact) {
            return null;
        }
        const inputId = this.instanceId + '-jump';
        const errorId = this.instanceId + '-jump-error';
        const hasError = this.state.jumpError !== null;
        const isJumpEmpty = this.state.jumpDraft.trim() === '';
        // `relative`, with the message absolutely placed: the nav row is
        // `items-center`, so a message that took part in layout would grow this cell
        // and shunt the page buttons upward the moment a bad number was entered.
        //
        // Hidden below `lg`. Measured at every breakpoint: the page-size select, the
        // numbered pager and this form together need about 800px of content width,
        // so between 768 and 1023 this was pushing the row past the right edge of the
        // list card. Direct entry is the least essential of the three — every page is
        // still reachable — so it is the one that goes.
        return <div className='relative hidden lg:flex items-center'>
            {/* `noValidate`, and a text input rather than `type="number"` with
                min/max.
                WHY: the first version used a number input bounded by min="1"
                max={pageCount}. Out-of-range values then made the field
                constraint-invalid, and the browser blocks implicit form submission
                on an invalid field — so pressing Enter on page 99999 did nothing at
                all, and the message below never rendered because the submit handler
                never ran. Two validation systems, and the native one silently won.
                Validation now lives in one place, and its outcome is visible. */}
            <form className='flex items-center gap-2' onSubmit={this.commitJump} noValidate>
                <label htmlFor={inputId} className='text-sm text-gray-500 whitespace-nowrap'>
                    Go to
                </label>
                <input
                    id={inputId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={String(pageCount).length}
                    className={cx(
                        'h-9 w-16 px-2 text-sm text-center tabular-nums text-gray-800 bg-white rounded-lg border',
                        'transition-colors focus:outline-none focus:ring-2',
                        hasError
                            ? 'border-danger-500 focus:ring-danger-500'
                            : 'border-gray-300 hover:border-gray-400 focus:ring-primary-500 focus:border-primary-500'
                    )}
                    placeholder={String(this.getCurrentPage())}
                    value={this.state.jumpDraft}
                    onChange={this.updateJumpDraft}
                    aria-label={'Go to page, 1 to ' + pageCount}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : undefined}
                />
                {/* An explicit submit rather than committing on blur. Blur-commit
                    means tabbing out of a half-typed number navigates the list,
                    and it leaves the control with no visible affordance at all. */}
                <button
                    type="submit"
                    className={cx(NAV_BUTTON_BASE, isJumpEmpty ? NAV_BUTTON_DISABLED : NAV_BUTTON_IDLE)}
                    disabled={isJumpEmpty}
                >
                    Go
                </button>
            </form>
            {hasError
                ? <span
                    id={errorId}
                    className='absolute top-full right-0 mt-1 text-xs font-medium text-danger-600 tabular-nums whitespace-nowrap'
                    role="alert"
                >
                    {this.state.jumpError}
                </span>
                : null}
        </div>;
    }

    render() {
        const pageCount = this.getPageCount();
        // A pager over a single page is decoration. The old one rendered
        // unconditionally, and because MUI defaults `count` to 1 when it is
        // undefined, a lone "1" button also appeared under empty result sets and
        // under lists that had failed to load.
        if (pageCount <= 1) {
            return null;
        }
        const currentPage = this.getCurrentPage();

        // `compact` exists because this component's responsive breakpoints are
        // viewport-based while its real constraint is the width of whatever column it
        // has been dropped into. Those are the same thing on the question and paper
        // lists, which give the pager the full content width — and they are not the
        // same thing in the paper builder, where the question picker occupies a 7/12
        // grid column, about 650px at a 1280px viewport. There, every `md:` and `lg:`
        // test passes while the space available is closer to what a phone has, so the
        // full pager was laid out in a column that could not hold it and pushed the
        // document 125px wider than the window.
        //
        // Tailwind 3.3 has no container queries without a plugin, so the container has
        // to say what it can afford rather than the pager guessing from the viewport.
        const isCompact = this.props.compact === true;

        // Two groups, not three: how much to show on the left, where to go on the
        // right. The jump box sits with the page buttons because it does the same
        // job as them; spread as a third column it wrapped onto its own line at
        // tablet widths and read as an unrelated field.
        return <nav
            className='w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
            aria-label="Pagination"
        >
            {this.getPageSizeSelectorJSX()}

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5'>
                {/* Numbered pager from `md` up, compact Prev/Next below it.
                    The switch was at `sm` (640px) first, which was too early: nine
                    buttons plus the page-size select need roughly 620px of content
                    width, and at 640px the card only offers about 590px, so the row
                    ran past the card's right edge and gave the whole page a
                    horizontal scrollbar. */}
                {isCompact ? null : (
                    <div className='hidden md:flex items-center gap-1.5'>
                        {this.getNavButtonJSX('previous')}
                        <div className='flex items-center gap-1.5 px-1'>
                            {this.getPageButtonsJSX()}
                        </div>
                        {this.getNavButtonJSX('next')}
                    </div>
                )}

                {/* Below `md` the page numbers are replaced by a position readout.
                    Prev/Next stay, because stepping is the only thing there is room
                    for, and without the readout there would be nothing on the page
                    saying where you are.
                    In compact mode this is the only pager, at every width, so the
                    `md:hidden` that would otherwise hide it has to come off — hence
                    two mutually exclusive strings rather than one string with a
                    conditional fragment. Tailwind runs with `important: true`, so
                    `flex` and `hidden` in the same className resolve by stylesheet
                    order, not by which was written last. */}
                <div className={isCompact
                    ? 'flex items-center justify-between gap-3'
                    : 'flex md:hidden items-center justify-between gap-3'}
                >
                    {this.getNavButtonJSX('previous')}
                    <span className='text-sm text-gray-500 tabular-nums whitespace-nowrap'>
                        Page <span className='font-semibold text-gray-800'>{currentPage}</span> of {pageCount}
                    </span>
                    {this.getNavButtonJSX('next')}
                </div>

                {this.getJumpFormJSX()}
            </div>
        </nav>;
    }

}

export default PagingSection;
