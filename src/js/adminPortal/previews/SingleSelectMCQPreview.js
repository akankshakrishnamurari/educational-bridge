import React from 'react';
import '../../../App.css';
import Collapsible from 'react-collapsible';
import { AiOutlineDownSquare } from 'react-icons/ai';
import SingleSelectMCQQuestion from '../../questionSet/largeScreen/SingleSelectMCQQuestion';
import MathContent from '../../../components/common/MathContent';
import Button from '../../../components/common/Button';
import { typography } from '../../../constants/designTokens';
import { currentURLHost } from '../../../constants/hostConfig';
import { UserDetailsUtil } from '../../../utils/UserDetailsUtil';
import QuestionsReceiver from '../../../apis/QuestionsReceiver';
import { logError } from '../../../utils/logger';

// Shared question preview, used by the paper-authoring surfaces and by the
// question review page.
//
// Cleaned up in this pass:
//  * Table, TableBody, TableCell, TableRow and react-google-charts' Chart were all
//    imported and never referenced. Chart in particular pulls a charting library
//    into every screen that previews a question.
//  * Every text block was a <div> nested inside a <p>, which is invalid HTML —
//    the browser closes the paragraph early, so the styling on the <p> silently
//    stopped applying to its own content.
//  * The "not yet updated" placeholder was passed through dangerouslySetInnerHTML
//    even though it is a static literal with no markup in it.
//  * One node used the raw HTML attribute `class` instead of `className`, so its
//    classes were dropped and React warned on every render.
//  * Several className strings ended in a literal "" — leftovers from a
//    truncated paste, emitting a meaningless class name.

class SingleSelectMCQPreview extends React.Component {

    doNothing = () => {}

    redirectToNextRecommendedQuestion = () => {
        const questionId = this.props.submittedQuestionDetails
            && this.props.submittedQuestionDetails.questionData
            && this.props.submittedQuestionDetails.questionData.id;
        if (!questionId) {
            return;
        }
        QuestionsReceiver.getNextRecommendedQuestion(questionId, UserDetailsUtil.getUserGoogleId())
            .then((questionsData) => {
                // The API returns null on failure (see apis/QuestionsReceiver), and a
                // recommendation is not guaranteed to exist, so both cases are checked
                // before navigating. Previously this threw on a null response and the
                // button appeared to do nothing.
                const nextId = questionsData && questionsData.data && questionsData.data.questionId;
                if (!nextId) {
                    return;
                }
                window.location.href = currentURLHost + 'question/view?question_id=' + nextId;
            })
            .catch((e) => logError('SingleSelectMCQPreview.redirectToNextRecommendedQuestion', e));
    }

    getAnswerDescriptionJSX = () => {
        const description = this.props.answerDescription;
        const hasDescription = description !== null
            && description !== undefined
            && String(description).trim().length > 1;

        if (!hasDescription) {
            return (
                <div className="px-4 md:px-10 py-6 border-t border-gray-200">
                    <p className={typography.caption + ' italic'}>
                        The author hasn&rsquo;t added a written solution for this question yet.
                    </p>
                </div>
            );
        }
        return (
            <div className="px-4 md:px-10 py-6 border-t border-gray-200">
                <MathContent
                    html={description}
                    className={typography.body + ' text-left leading-relaxed'}
                />
            </div>
        );
    }

    getAdditionalPreview = () => {
        const trigger = (
            <div className="flex flex-row items-center w-full bg-gray-50 px-3 py-2 cursor-pointer">
                <div className={typography.h3 + ' w-full'}>
                    Solution
                </div>
                <div className="flex justify-end text-gray-500">
                    <AiOutlineDownSquare size={22} />
                </div>
            </div>
        );

        // correctOption is a zero-based index, so it is displayed as a letter to match
        // how the options themselves are labelled everywhere else in the app.
        const index = Number(this.props.correctOption);
        const label = Number.isInteger(index) && index >= 0
            ? String.fromCharCode(65 + index)
            : null;

        return (
            <div>
                <Collapsible
                    trigger={trigger}
                    className="border-b-2 Collapsible__trigger"
                >
                    {label && (
                        <div className="flex justify-center px-4 py-3 bg-success-50 border-t border-success-100">
                            <span className="text-sm font-semibold text-success-700">
                                Correct answer: option {label}
                            </span>
                        </div>
                    )}
                    {this.getAnswerDescriptionJSX()}
                </Collapsible>
            </div>
        );
    }

    getNextSimilarQuestionButton = () => (
        <div className="pb-2 px-4 md:px-10 bg-white">
            <Button
                variant="secondary"
                size="sm"
                onClick={this.redirectToNextRecommendedQuestion}
            >
                Next question
            </Button>
        </div>
    )

    render() {
        // Was `needCompletePreview == false`, which also matched 0, "" and undefined.
        if (!this.props.needCompletePreview) {
            return (
                <div className="bg-white">
                    <div className="pb-10 md:px-24">
                        <SingleSelectMCQQuestion
                            questionDetails={this.props.questionDetails}
                            selectedOptionId={null}
                            updateQuestionAnswer={this.doNothing}
                            selectedOptionBackgroundColor={'bg-success-200'}
                            needCompletePreview={false}
                            optionIdToOptionResponseCount={null}
                            totalResponseCount={null}
                            submittedQuestionDetails={null}
                            options={this.props.options}
                        />
                    </div>
                </div>
            );
        }

        const submitted = this.props.submittedQuestionDetails;
        const wasCorrect = this.props.selectedOptionId === this.props.correctOptionId;

        return (
            <div className="bg-white">
                <div className="pb-4">
                    <SingleSelectMCQQuestion
                        questionDetails={submitted.questionData}
                        selectedOptionId={submitted.selectedOptionId}
                        updateQuestionAnswer={this.doNothing}
                        selectedOptionBackgroundColor={wasCorrect ? 'bg-success-200' : 'bg-danger-200'}
                        needCompletePreview={this.props.needCompletePreview}
                        optionIdToOptionResponseCount={submitted.optionIdToOptionResponseCount}
                        totalResponseCount={submitted.totalResponses}
                        submittedQuestionDetails={submitted}
                        options={this.props.options}
                    />
                </div>
                {this.getNextSimilarQuestionButton()}
                {this.getAdditionalPreview()}
            </div>
        );
    }

}

export default SingleSelectMCQPreview;
