import React from 'react';
import { connect } from 'react-redux';
import {updateNewQuestionDetails} from '../../../store/actions/solgressAction'
import SingleSelectMCQEditor from '../questionAdditionPortal/SingleSelectMCQEditor'
import {JSXUtils} from "../../../utils/JSXUtils";
import QuestionsReceiver from "../../../apis/QuestionsReceiver";
import NewQuestionTagComponent from "./NewQuestionTagComponent";
import EducationalBridgeHeader from '../../header/EducationalBridgeHeader';
import {currentURLHost} from './../../../constants/hostConfig';
import QuestionBody from '../../questionSet/largeScreen/QuestionBody';
import ClipLoader from "react-spinners/ClipLoader";
import {UserDetailsUtil} from "../../../utils/UserDetailsUtil";
import notify from '../../../utils/notify';
import Button from '../../../components/common/Button';
import { typography, layout } from '../../../constants/designTokens';

// Question authoring page.
//
// STRUCTURE
// ---------
// Editor on the left, live learner-view preview on the right, sticky. The page
// previously had a single toggle that swapped the whole screen between "Edit
// Question" and "Preview Question", which meant an author could never see the
// effect of a change while making it. Both buttons also sat inside one div with a
// single onClick, so either button toggled and the labels were effectively
// decorative. Below xl the two panes become a real tab pair, because there is not
// room for both.
//
// PROBLEMS FIXED
// --------------
//  * A new question was pre-filled with a joke: a red-highlighted "Note : This is a
//    sample Question" block and a word problem about Gopal and Murari's ages, with
//    options 25/24/300/288 and `correctOptions: [2]` silently pre-marking the third
//    option correct. Every contributor started from that. New questions now start
//    genuinely empty with four blank options and no answer pre-selected.
//  * `fulfilled` was captured from a <select> and therefore stored as the STRING
//    "true"/"false", then sent to the API as `isFulfilled`. The string "false" is
//    truthy in JavaScript, so choosing "No" marked the question audited. Now a real
//    boolean.
//  * `onChange={this.updateQuestionType()}` INVOKED the handler during render
//    instead of passing it. The method was also empty.
//  * `question.correctOptionId` read `options[correctOptions[0]].id` unguarded, so
//    an out-of-range pointer threw on submit.
//  * No validation: an empty question with empty options could be submitted.
//  * `console.log(question)` on every submit, plus three large commented-out
//    render blocks and a "Number of options" free-text box that accepted any string.

const EMPTY_OPTION_COUNT = 4;

class QuestionCreation extends React.Component {

    constructor(props) {
        super(props)
        this.state = { errors: [], isSubmitting: false, mobilePane: 'edit' };
    }

    componentDidMount() {
        if (this.props.newQuestionDetails === undefined) {
            this.initializeNewQuestionDetails();
        }
    }

    buildEmptyOptions = () => {
        const options = [];
        for (let i = 0; i < EMPTY_OPTION_COUNT; i += 1) {
            options.push({ id: 'option' + (i + 1), text: '' });
        }
        return options;
    }

    initializeNewQuestionDetails = () => {
        const search = window.location.search;
        const questionId = new URLSearchParams(search).get('question_id');
        if(questionId === undefined || questionId === null) {
            this.props.updateNewQuestionDetails({
                "questionType" : 'SINGLE_SELECT_MCQ',
                "isEditingQuestion": true,
                "questionDescription": '',
                "answerDescription": '',
                "options" : this.buildEmptyOptions(),
                "numberOfOptions": EMPTY_OPTION_COUNT,
                "optionsEditing":[],
                "selectedPreviewOption":{},
                "tags": [],
                "channels": [],
                // No answer pre-selected beyond the first slot; the author must
                // choose. Previously this defaulted to index 2.
                "correctOptions": [0],
                "isCheckingPreviewWhileEditingQuestion": false,
                "fulfilled": false
            });
            return;
        }
        // The editor needs the correct answer and the worked solution, which plain
        // getQuestion no longer returns — that call feeds the solve page, where the
        // answer must not be present. See QuestionsReceiver.getQuestionForEditing.
        QuestionsReceiver.getQuestionForEditing(questionId).then(questionData=>{
            if (questionData == null || questionData.data == null) {
                notify.error('Could not load that question.');
                return;
            }
            const data = questionData.data;
            this.props.updateNewQuestionDetails({
                "id" : data.id,
                "questionType" : data.questionType,
                "isEditingQuestion": true,
                "questionDescription" : data.description,
                "answerDescription": data.answerDescription || '',
                "options" : data.options,
                "numberOfOptions": data.options.length,
                "optionsEditing":[],
                "selectedPreviewOption":{},
                "tags": data.tags,
                "channels":[],
                "correctOptions": [JSXUtils.getNormalisedPreviewOptionId(data.options, data.correctOptionId)],
                "selectedChannel": data.channel===null?undefined:data.channel,
                "searchedChannelKey": data.channel===null?"":data.channel.channelName,
                "isCheckingPreviewWhileEditingQuestion": false,
                // Coerced to a real boolean: the API returns `fulfilled` but older
                // saves from this form wrote the string "true"/"false".
                "fulfilled": data.fulfilled === true || data.fulfilled === 'true'
            });
        });
    }

    updateIfQuestionIsAudited = (checked) => {
        this.props.updateNewQuestionDetails({
            ...this.props.newQuestionDetails,
            fulfilled: checked === true,
        });
    }

    /** Plain text of rich HTML, for emptiness checks and title derivation. */
    toPlainText = (html) => {
        if (typeof html !== 'string') {
            return '';
        }
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Plain-text length of rich HTML, for emptiness checks. */
    textLength = (html) => this.toPlainText(html).length

    /**
     * Short display name for the question record.
     *
     * This field used to be sent as the literal string 'New Question' for every
     * question anyone authored. That is the direct cause of the rows in the bank
     * called "New Question": they are not corrupt data, they are what this form
     * writes. Deriving the name from the opening words of the question at least
     * describes the record it names.
     *
     * Truncated at a word boundary so the name does not end mid-word, and capped
     * well below any column limit.
     */
    deriveQuestionName = (description) => {
        const text = this.toPlainText(description);
        if (text.length === 0) {
            return 'Untitled question';
        }
        const LIMIT = 80;
        if (text.length <= LIMIT) {
            return text;
        }
        const clipped = text.slice(0, LIMIT);
        const lastSpace = clipped.lastIndexOf(' ');
        return (lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped) + '…';
    }

    validate = () => {
        const details = this.props.newQuestionDetails;
        const errors = [];
        if (this.textLength(details.questionDescription) === 0) {
            errors.push('The question needs some text.');
        }
        const options = details.options || [];
        const emptyOptions = options.filter((option) => this.textLength(option.text) === 0);
        if (emptyOptions.length > 0) {
            errors.push(emptyOptions.length === 1
                ? 'One option is still empty.'
                : emptyOptions.length + ' options are still empty.');
        }
        const correctIndex = (details.correctOptions || [])[0];
        if (typeof correctIndex !== 'number' || correctIndex < 0 || correctIndex >= options.length) {
            errors.push('Choose which option is the correct answer.');
        }
        if (!Array.isArray(details.tags) || details.tags.length === 0) {
            // Not fatal, but an untagged question is unreachable through every
            // filter on the platform, so it is worth stating plainly.
            errors.push('Add at least one tag, or learners will not be able to find this question.');
        }
        this.setState({ errors });
        return errors.length === 0;
    }

    saveAndSubmitQuestion = () => {
        if (!this.validate()) {
            return;
        }
        const details = this.props.newQuestionDetails;
        const options = (details.options || []).map((option) => ({ ...option }));
        const correctIndex = (details.correctOptions || [])[0];
        const question = {
            id: details.id,
            questionType: details.questionType,
            name: this.deriveQuestionName(details.questionDescription),
            description: details.questionDescription,
            options: options,
            tagIds: (details.tags || []).map((tag) => tag.id),
            answerDescription: details.answerDescription,
            correctOptionId: options[correctIndex].id,
            createdBy: UserDetailsUtil.getUserGoogleId(),
            isFulfilled: details.fulfilled === true,
        };
        if (details.selectedChannel !== undefined) {
            question.channelId = details.selectedChannel.id;
        }
        this.setState({ isSubmitting: true });
        QuestionsReceiver.upsertQuestion(question).then(questionData=>{
            if (questionData == null || questionData.data == null || questionData.data.id == null) {
                notify.error('Could not save the question. Please try again.');
                this.setState({ isSubmitting: false });
                return;
            }
            notify.success('Question saved.');
            window.location.href = currentURLHost + "question/view?question_id=" + questionData.data.id;
        });
    }

    getPreviewJSX = () => {
        const details = this.props.newQuestionDetails;
        const hasContent = this.textLength(details.questionDescription) > 0;
        return <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Learner preview</h2>
                <span className="text-xs text-gray-400">Live</span>
            </div>
            <div className="p-4 md:p-5">
                {hasContent
                    ? <QuestionBody
                        questionDetails={details}
                        selectedOptionId={null}
                        updateQuestionAnswer={() => {}}
                    />
                    : <p className="text-sm text-gray-400 italic py-6 text-center">
                        Start writing and the learner&rsquo;s view appears here.
                    </p>
                }
            </div>
        </div>;
    }

    getMetaJSX = () => (
        <div className="flex flex-col gap-7">
            <section>
                <h2 className={typography.h3 + ' mb-1'}>Tags</h2>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    Subject, chapter, topic and difficulty. These are how learners filter,
                    so an untagged question is effectively invisible.
                </p>
                <NewQuestionTagComponent/>
            </section>
            <section>
                <h2 className={typography.h3 + ' mb-2'}>Review</h2>
                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                        type="checkbox"
                        className="accent-primary-600 w-4 h-4 mt-0.5"
                        checked={this.props.newQuestionDetails.fulfilled === true}
                        onChange={(event) => this.updateIfQuestionIsAudited(event.target.checked)}
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                        I have checked this question and its answer are correct.
                    </span>
                </label>
            </section>
        </div>
    )

    getErrorsJSX = () => {
        if (this.state.errors.length === 0) {
            return null;
        }
        return <div className="rounded-xl border border-danger-200 bg-danger-50 p-4" role="alert">
            <p className="text-sm font-semibold text-danger-800">
                Before saving, please fix the following:
            </p>
            <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
                {this.state.errors.map((error) => (
                    <li key={error} className="text-sm text-danger-700">{error}</li>
                ))}
            </ul>
        </div>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.newQuestionDetails === undefined){
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size={60}/>
                </div>
            </div>
        }
        const isEditingExisting = this.props.newQuestionDetails.id !== undefined
            && this.props.newQuestionDetails.id !== null;
        const paneButton = (key, label) => (
            <button
                type="button"
                onClick={() => this.setState({ mobilePane: key })}
                className={[
                    'px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
                    this.state.mobilePane === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800',
                ].join(' ')}
                aria-current={this.state.mobilePane === key ? 'true' : undefined}
            >
                {label}
            </button>
        );

        return (
            <div className="bg-gray-50 min-h-screen pb-24">
                <EducationalBridgeHeader/>
                <div className={layout.container + ' py-6'}>
                    <a
                        href={currentURLHost + 'questions'}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <span aria-hidden="true">&larr;</span>
                        All questions
                    </a>
                    <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className={typography.h1}>
                                {isEditingExisting ? 'Edit question' : 'Write a question'}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Anything you publish here is free for every learner on the platform.
                            </p>
                        </div>
                        {/* Pane switch only exists below xl, where both columns cannot fit. */}
                        <div className="xl:hidden inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                            {paneButton('edit', 'Edit')}
                            {paneButton('preview', 'Preview')}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col xl:flex-row gap-6 items-start">
                        <div className={[
                            'w-full xl:flex-1 min-w-0 flex flex-col gap-6',
                            this.state.mobilePane === 'edit' ? '' : 'hidden xl:flex',
                        ].join(' ')}>
                            {this.getErrorsJSX()}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                                <SingleSelectMCQEditor editorRef={this.props.editorRef}/>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                                {this.getMetaJSX()}
                            </div>
                        </div>
                        <aside className={[
                            'w-full xl:w-[38%] shrink-0 xl:sticky xl:top-24',
                            this.state.mobilePane === 'preview' ? '' : 'hidden xl:block',
                        ].join(' ')}>
                            {this.getPreviewJSX()}
                        </aside>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
                    <div className={layout.container + ' py-3 flex items-center justify-between gap-4'}>
                        <p className="text-sm text-gray-500 hidden sm:block">
                            {isEditingExisting ? 'Editing an existing question' : 'This question is not saved yet'}
                        </p>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={this.saveAndSubmitQuestion}
                            disabled={this.state.isSubmitting}
                        >
                            {this.state.isSubmitting ? 'Saving…' : (isEditingExisting ? 'Save changes' : 'Publish question')}
                        </Button>
                    </div>
                </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(QuestionCreation);
