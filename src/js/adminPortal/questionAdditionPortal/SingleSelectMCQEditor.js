import React from 'react';
import { connect } from 'react-redux';
import {updateNewQuestionDetails} from '../../../store/actions/solgressAction'
import MathEditor from "../../../components/common/MathEditor";
import MathContent from '../../../components/common/MathContent';
import Button from '../../../components/common/Button';
import { typography } from '../../../constants/designTokens';

// Question authoring: stem, options, and worked solution.
//
// WHAT WAS WRONG
// --------------
//  1. `renderOptionsSelectionsEditor` called `initializeAdditionalNumberOfOptions`
//     from inside render, which dispatched a redux update mid-render. Dispatching
//     during render is exactly the pattern React warns about and it made option
//     count changes unpredictable. Option creation is now an explicit action.
//  2. New option ids were built as `"option" + options.length + 1`, which is string
//     concatenation, not arithmetic: the fifth option got the id "option41". Ids
//     are now generated from a scan of existing ids so they are unique and sane.
//  3. Correct/incorrect was two large square buttons showing a tick or a cross,
//     with the cross rendered in red on every wrong option -- so a valid question
//     with one right answer looked like three errors. It is now a single radio
//     group, matching how the learner will actually see the question.
//  4. Options were labelled 1..n while learners see A..D on the solve page. Same
//     letters are now used on both sides, so an author and a student can talk
//     about "option C" and mean the same thing.
//  5. Buttons were nested inside clickable divs, and `<div>`s inside `<p>`s.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const optionLetter = (index) => (index < LETTERS.length ? LETTERS[index] : String(index + 1));

const MAX_OPTIONS = 8;
const MIN_OPTIONS = 2;

class SingleSelectMCQEditor extends React.Component {

    updateQuestionDetails = (data) => {
        this.patch({ questionDescription: data });
    }

    updateAnswerDetails = (data) => {
        this.patch({ answerDescription: data });
    }

    patch = (changes) => {
        this.props.updateNewQuestionDetails({ ...this.props.newQuestionDetails, ...changes });
    }

    saveOptionData = (index, data) => {
        const options = [...this.props.newQuestionDetails.options];
        options[index] = { ...options[index], text: data };
        this.patch({ options });
    }

    /**
     * Unique option id. Scans existing ids for the highest `optionN` suffix rather
     * than deriving one from array length, which broke when options were removed
     * and produced duplicates.
     */
    nextOptionId = (options) => {
        let highest = 0;
        options.forEach((option) => {
            const match = /^option(\d+)$/.exec(option.id || '');
            if (match) {
                highest = Math.max(highest, parseInt(match[1], 10));
            }
        });
        return 'option' + (highest + 1);
    }

    addOption = () => {
        const details = this.props.newQuestionDetails;
        const options = [...details.options];
        if (options.length >= MAX_OPTIONS) {
            return;
        }
        options.push({ id: this.nextOptionId(options), text: '' });
        this.patch({ options, numberOfOptions: options.length });
    }

    removeOption = (index) => {
        const details = this.props.newQuestionDetails;
        const options = [...details.options];
        if (options.length <= MIN_OPTIONS) {
            return;
        }
        options.splice(index, 1);
        // The correct-answer pointer is an INDEX, so removing an option above it
        // would silently reassign the correct answer to a different option.
        let correct = (details.correctOptions && details.correctOptions[0]) || 0;
        if (correct === index) {
            correct = 0;
        } else if (correct > index) {
            correct -= 1;
        }
        this.patch({ options, numberOfOptions: options.length, correctOptions: [correct] });
    }

    setCorrectOption = (index) => {
        this.patch({ correctOptions: [index] });
    }

    toggleOptionEditing = (index) => {
        const editing = this.props.newQuestionDetails.optionsEditing || [];
        this.patch({ optionsEditing: editing.includes(index) ? [] : [index] });
    }

    getQuestionEditorJSX = () => (
        <section>
            <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className={typography.h3}>Question</h2>
                <span className="text-xs text-gray-400">Required</span>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
                <MathEditor
                    id="question-body-editor"
                    label="Question"
                    onChange={this.updateQuestionDetails}
                    value={this.props.newQuestionDetails.questionDescription || ''}
                    placeholder={'State the question. Maths goes between $$ marks, '
                        + 'e.g. $$\\int_0^1 x^2 \\, dx$$'}
                />
            </div>
        </section>
    )

    getOptionRowJSX = (option, index) => {
        const details = this.props.newQuestionDetails;
        const isCorrect = (details.correctOptions || []).includes(index);
        const isEditing = (details.optionsEditing || []).includes(index);
        const hasText = typeof option.text === 'string' && option.text.trim().length > 0;

        return (
            <div
                key={option.id || index}
                className={[
                    'rounded-lg border transition-colors',
                    isCorrect ? 'border-success-400 bg-success-50/50' : 'border-gray-200 bg-white',
                ].join(' ')}
            >
                <div className="flex items-start gap-3 p-3">
                    {/* One radio group across all options: single-select is enforced
                        by the control itself rather than by handler logic. */}
                    <label className="flex items-center gap-2 shrink-0 cursor-pointer pt-0.5">
                        <input
                            type="radio"
                            name="correct-option"
                            className="accent-success-600 w-4 h-4"
                            checked={isCorrect}
                            onChange={() => this.setCorrectOption(index)}
                            aria-label={'Mark option ' + optionLetter(index) + ' as the correct answer'}
                        />
                        <span
                            className={[
                                'w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold',
                                isCorrect
                                    ? 'border-success-600 bg-success-600 text-white'
                                    : 'border-gray-300 text-gray-500 bg-white',
                            ].join(' ')}
                        >
                            {optionLetter(index)}
                        </span>
                    </label>

                    <div className="flex-1 min-w-0">
                        {hasText
                            ? <MathContent html={option.text} className="text-sm text-gray-800" />
                            : <p className="text-sm italic text-gray-400">Empty option</p>
                        }
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                        {isCorrect &&
                            <span className="hidden sm:inline text-xs font-semibold text-success-700 mr-1">
                                Correct
                            </span>
                        }
                        <Button size="sm" variant="ghost" onClick={() => this.toggleOptionEditing(index)}>
                            {isEditing ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => this.removeOption(index)}
                            disabled={details.options.length <= MIN_OPTIONS}
                            aria-label={'Remove option ' + optionLetter(index)}
                        >
                            Remove
                        </Button>
                    </div>
                </div>

                {isEditing &&
                    <div className="border-t border-gray-200">
                        <MathEditor
                            id={`option-editor-${index}`}
                            label={'Option ' + optionLetter(index)}
                            onChange={(data) => this.saveOptionData(index, data)}
                            value={option.text || ''}
                            minHeight="8rem"
                            placeholder={'Option ' + optionLetter(index)}
                        />
                    </div>
                }
            </div>
        );
    }

    getOptionsJSX = () => {
        const details = this.props.newQuestionDetails;
        const options = details.options || [];
        return (
            <section>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h2 className={typography.h3}>Options</h2>
                    <span className="text-xs text-gray-400">
                        Select the correct answer
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    {options.map((option, index) => this.getOptionRowJSX(option, index))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={this.addOption}
                        disabled={options.length >= MAX_OPTIONS}
                    >
                        Add option
                    </Button>
                    <span className="text-xs text-gray-400 tabular-nums">
                        {options.length} of {MAX_OPTIONS}
                    </span>
                </div>
            </section>
        );
    }

    getAnswerEditorJSX = () => (
        <section>
            <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className={typography.h3}>Worked solution</h2>
                <span className="text-xs text-gray-400">Optional but strongly encouraged</span>
            </div>
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                Shown to learners after they answer. A question without a solution
                tells someone they were wrong without telling them why.
            </p>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
                <MathEditor
                    id="answer-description-editor"
                    label="Solution"
                    onChange={this.updateAnswerDetails}
                    value={this.props.newQuestionDetails.answerDescription || ''}
                    placeholder="Explain how to get to the answer, step by step."
                />
            </div>
        </section>
    )

    render() {
        return (
            <div className="flex flex-col gap-7">
                {this.getQuestionEditorJSX()}
                {this.getOptionsJSX()}
                {this.getAnswerEditorJSX()}
            </div>
        );
    }

}

const mapDispatchToProps = dispatch => ({
    updateNewQuestionDetails: (payload) => dispatch(updateNewQuestionDetails(payload))
})

const mapStateToProps = state => {
    return {
        newQuestionDetails: state.solgressReducer.newQuestionDetails
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SingleSelectMCQEditor);
