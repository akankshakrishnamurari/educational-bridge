import React from 'react';
import '../../../App.css';
import Collapsible from 'react-collapsible';
import { AiOutlineDownSquare } from 'react-icons/ai';
import MathContent from '../../../components/common/MathContent';
import NumericalAnswerInput from '../../../components/questionSet/NumericalAnswerInput';
import { typography } from '../../../constants/designTokens';

// Body of a NUMERICAL question: the stem, then a single numeric field.
//
// Deliberately mirrors SingleSelectMCQQuestion's shape -- same props, same
// authoring-preview branch, same collapsible solution -- so QuestionBody can
// swap between the two without any call site knowing which it got.
//
// The answer travels on the same `selectedOptionId` prop the MCQ path uses. That
// is a slight misnomer for a typed number, but it means the Redux shape, the
// submit gate and the paper answer map all keep working unchanged; the backend
// applies the same reasoning (see AnswerEvaluator).

const collapsibleTrigger = (label) => (
    <div className='flex flex-row items-center w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors cursor-pointer'>
        <div className={typography.h3 + ' w-full'}>{label}</div>
        <div className='flex justify-end text-gray-400'>
            <AiOutlineDownSquare size={20} />
        </div>
    </div>
);

class NumericalQuestion extends React.Component {

    isReviewMode = () => this.props.submittedQuestionDetails != null;

    onAnswerChange = (value) => {
        this.props.updateQuestionAnswer(this.props.questionDetails.id, value);
    }

    getAnswerView = () => {
        const details = this.props.questionDetails;
        const reviewMode = this.isReviewMode();
        return <NumericalAnswerInput
            value={this.props.selectedOptionId}
            // The expected answer is withheld until the learner has submitted.
            correctAnswer={reviewMode ? details.correctAnswer : null}
            answerTolerance={details.answerTolerance}
            onChange={this.onAnswerChange}
            reviewMode={reviewMode}
            inputId={'numerical-answer-' + (details.id || 'question')}
        />;
    }

    getAnswerDescriptionJSX = () => {
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
        const answer = this.props.questionDetails.correctAnswer;
        return <div className='mt-4'>
            <Collapsible trigger={collapsibleTrigger('Solution')} className='Collapsible__trigger'>
                <div className='border border-gray-100 border-t-0 rounded-b-lg overflow-hidden'>
                    <div className='px-4 py-3 bg-success-50 flex items-center gap-2'>
                        <span className={typography.label}>Correct answer</span>
                        {answer != null && String(answer).trim() !== ''
                            ? <MathContent
                                html={String(answer)}
                                as='span'
                                className='inline-flex items-center px-2 py-0.5 rounded-md bg-success-600 text-white text-xs font-bold tabular-nums'
                            />
                            : <span className='text-sm text-gray-500'>not recorded</span>
                        }
                    </div>
                    {this.getAnswerDescriptionJSX()}
                </div>
            </Collapsible>
        </div>;
    }

    render() {
        const details = this.props.questionDetails;

        // Authoring preview path, matching SingleSelectMCQQuestion: the editor
        // passes `isEditingQuestion` and keeps the stem on `questionDescription`.
        if (details.isEditingQuestion !== undefined) {
            return (
                <div>
                    <MathContent
                        html={details.questionDescription}
                        className={typography.h2 + ' pb-4'}
                    />
                    {this.getAnswerView()}
                    {this.getAdditionalPreview()}
                </div>
            );
        }

        return (
            <div>
                <MathContent
                    html={details.description}
                    className='text-base md:text-lg text-gray-900 pb-5 leading-relaxed'
                />
                <div className='w-full'>
                    {this.getAnswerView()}
                </div>
            </div>
        );
    }
}

export default NumericalQuestion;
