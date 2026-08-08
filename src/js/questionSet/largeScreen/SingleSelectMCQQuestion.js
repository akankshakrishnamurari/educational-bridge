import React from 'react';
import '../../../App.css';
import Collapsible from "react-collapsible";
import { AiOutlineDownSquare } from "react-icons/ai";
import MathContent from '../../../components/common/MathContent';
import OptionList from '../../../components/questionSet/OptionList';
import Badge from '../../../components/common/Badge';
import { typography } from '../../../constants/designTokens';
import { parseQuestionTaxonomy } from '../../../utils/questionTaxonomy';

// Single-select MCQ body: question stem, answer options, and (on the review
// path) the solution and classification.
//
// WHAT CHANGED AND WHY
// --------------------
// 1. Options no longer render inside a MUI <Table>. See OptionList -- the old
//    markup put <div>s directly inside <TableRow>, which is invalid HTML and
//    caused the browser to foster-parent them out of the table, leaving an empty
//    table box behind. That was the source of the large blank gap on this page.
//
// 2. The review path used to render a react-google-charts column chart fed from a
//    HARDCODED array (22.94, 39.49, 31.3, 1.45, 3.45). Those numbers had no
//    relationship to the question being viewed, so every learner was shown the
//    same invented distribution as if it were real data. Removed. Real
//    per-option response counts, when the API supplies them, now render as a
//    quiet bar inside each option row instead.
//
// 3. Content is rendered through MathContent rather than
//    dangerouslySetInnerHTML + JSXUtils.htmlDecode, so question and option HTML
//    is DOMPurify-sanitised on the way in. These bodies are author-supplied, so
//    unsanitised injection here was an XSS vector.

const collapsibleTrigger = (label) => (
    <div className='flex flex-row items-center w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors cursor-pointer'>
        <div className={typography.h3 + " w-full"}>{label}</div>
        <div className='flex justify-end text-gray-400'>
            <AiOutlineDownSquare size={20} />
        </div>
    </div>
);

class SingleSelectMCQQuestion extends React.Component {

    selectOptionById = (optionId) => {
        this.props.updateQuestionAnswer(this.props.questionDetails.id, optionId);
    }

    isReviewMode = () => this.props.submittedQuestionDetails != null;

    /**
     * Percentage of respondents per option, or null when unavailable.
     *
     * Keyed off the ids in `questionDetails.options` so a mismatch between the
     * analytics keys and the option ids yields no distribution at all rather than
     * a misattributed one. Silence is the correct failure mode for statistics.
     */
    getDistribution = () => {
        if (this.props.needCompletePreview === undefined || this.props.needCompletePreview === false) {
            return null;
        }
        const counts = this.props.optionIdToOptionResponseCount;
        const total = this.props.totalResponseCount;
        if (counts == null || !total || total <= 0) {
            return null;
        }
        const options = this.props.questionDetails.options || [];
        const distribution = {};
        options.forEach((option) => {
            const count = counts[option.id];
            if (typeof count === 'number') {
                distribution[option.id] = (count * 100) / total;
            }
        });
        return Object.keys(distribution).length > 0 ? distribution : null;
    }

    getOptionsView = () => {
        const reviewMode = this.isReviewMode();
        return <OptionList
            options={this.props.questionDetails.options}
            selectedOptionId={this.props.selectedOptionId}
            // The correct answer is only disclosed once the learner has submitted.
            correctOptionId={reviewMode ? this.props.questionDetails.correctOptionId : null}
            onSelect={this.selectOptionById}
            reviewMode={reviewMode}
            distribution={this.getDistribution()}
            groupName={'answer-' + (this.props.questionDetails.id || 'question')}
        />;
    }

    /**
     * Letter of the correct option, derived from the options array.
     *
     * The previous implementation read `questionDetails.correctOptions[0] + 1`,
     * but the wire format has no `correctOptions` array -- it has a single
     * `correctOptionId` string -- so that expression threw on any question that
     * reached it. Deriving the index from the options list works for both the
     * saved shape and the in-progress authoring shape.
     */
    getCorrectOptionLabel = () => {
        const details = this.props.questionDetails;
        const options = details.options || [];
        let index = -1;
        if (details.correctOptionId != null) {
            index = options.findIndex((option) => option.id === details.correctOptionId);
        }
        if (index === -1 && Array.isArray(details.correctOptions) && details.correctOptions.length > 0) {
            index = Number(details.correctOptions[0]);
        }
        if (index === -1 || Number.isNaN(index) || index < 0 || index >= options.length) {
            return null;
        }
        return String.fromCharCode(65 + index);
    }

    getAnswerDescriptionJSX = () => {
        // Previously guarded on questionDetails.answerDescription but then rendered
        // this.props.answerDescription, which is not a prop this component receives
        // -- so the solution text never appeared even when the API returned one.
        const description = this.props.questionDetails.answerDescription;
        const hasDescription = typeof description === 'string' && description.trim().length > 0;
        if (!hasDescription) {
            return <div className='px-4 py-4 border-t border-gray-100'>
                <p className={typography.caption}>
                    No worked solution has been added for this question yet.
                </p>
            </div>;
        }
        return <div className='px-4 py-4 border-t border-gray-100'>
            <MathContent html={description} className='text-sm md:text-base text-gray-700' />
        </div>;
    }

    getAdditionalPreview = () => {
        const correctLabel = this.getCorrectOptionLabel();
        return <div className='mt-4'>
            <Collapsible trigger={collapsibleTrigger('Solution')} className="Collapsible__trigger">
                <div className='border border-gray-100 border-t-0 rounded-b-lg overflow-hidden'>
                    <div className='px-4 py-3 bg-success-50 flex items-center gap-2'>
                        <span className={typography.label}>Correct answer</span>
                        {correctLabel
                            ? <span className='inline-flex items-center justify-center w-6 h-6 rounded-md bg-success-600 text-white text-xs font-bold'>
                                {correctLabel}
                            </span>
                            : <span className='text-sm text-gray-500'>not recorded</span>
                        }
                    </div>
                    {this.getAnswerDescriptionJSX()}
                </div>
            </Collapsible>
        </div>;
    }

    /**
     * Classification, rendered from the parsed tag taxonomy rather than as a
     * column of raw "Prefix : Value" strings.
     */
    showSelectedTags = () => {
        const taxonomy = parseQuestionTaxonomy(this.props.questionDetails.tags);
        const rows = [
            ['Exam', taxonomy.exam],
            ['Subject', taxonomy.subject],
            ['Chapter', taxonomy.chapter],
            ['Topic', taxonomy.topic],
            ['Year', taxonomy.year],
            ['Difficulty', taxonomy.difficulty],
            ['Paper', taxonomy.paper],
            ['Source', taxonomy.source],
        ].filter((row) => row[1]);

        if (rows.length === 0 && taxonomy.other.length === 0) {
            return <div />;
        }

        return <div className='mt-4'>
            <Collapsible trigger={collapsibleTrigger('Classification')} className="Collapsible__trigger">
                <div className='border border-gray-100 border-t-0 rounded-b-lg bg-white px-4 py-3'>
                    <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
                        {rows.map(([label, value]) => (
                            <div key={label} className='flex items-baseline justify-between gap-3 py-1 border-b border-gray-50'>
                                <dt className={typography.label}>{label}</dt>
                                <dd className='text-sm text-gray-800 text-right'>{value}</dd>
                            </div>
                        ))}
                    </dl>
                    {taxonomy.other.length > 0 &&
                        <div className='flex flex-wrap gap-1.5 mt-3'>
                            {taxonomy.other.map((tag) => (
                                <Badge key={tag.id} variant="gray">{tag.label}</Badge>
                            ))}
                        </div>
                    }
                </div>
            </Collapsible>
        </div>;
    }

    render() {
        // NO USER-AGENT BRANCH.
        //
        // This used to delegate to SmallScreenSingleSelectMCQQuestion whenever the UA
        // string matched a mobile device. Three problems with that:
        //
        //   a) It sniffed the device, not the viewport, so an iPad or a narrowed
        //      desktop window got the wrong layout while a large Android tablet got
        //      the phone one.
        //   b) It forked the question renderer in two, and the mobile copy had
        //      drifted: it reads `questionDetails.correctOption` (a field that does
        //      not exist on the wire, so it printed "option NaN"), caps the tag
        //      taxonomy at the first 5 prefixes out of 11, and renders unsanitised
        //      HTML.
        //   c) Every improvement had to be made twice, which is why it was not.
        //
        // This component is responsive by construction -- OptionList uses fluid
        // padding and MathContent is width-agnostic -- so one implementation now
        // serves every viewport and the fork is gone.

        // Authoring preview path: the editor passes `isEditingQuestion`, and the
        // stem lives on `questionDescription` rather than `description`.
        if(this.props.questionDetails.isEditingQuestion !== undefined) {
            return (
                <div>
                    <MathContent
                        html={this.props.questionDetails.questionDescription}
                        className={typography.h2 + ' pb-4'}
                    />
                    {this.getOptionsView()}
                    {this.getAdditionalPreview()}
                    {this.showSelectedTags()}
                </div>
            );
        }
        return (
            <div>
                <MathContent
                    html={this.props.questionDetails.description}
                    className='text-base md:text-lg text-gray-900 pb-5 leading-relaxed'
                />
                <div className='w-full'>
                    {this.getOptionsView()}
                </div>
            </div>
        );
    }

}

export default SingleSelectMCQQuestion;
