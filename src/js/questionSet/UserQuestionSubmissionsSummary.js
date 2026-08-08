import React from 'react';
import { connect } from 'react-redux';
import {saveUserQuestionsSummary} from '../../store/actions/solgressAction';
import {currentURLHost} from './../../constants/hostConfig';
import QuestionsReceiver from '../../apis/QuestionsReceiver';
import ClipLoader from "react-spinners/ClipLoader";
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import AdRail from '../../components/common/AdRail';
import MathContent from '../../components/common/MathContent';
import StatTile from '../../components/common/StatTile';
import MeterBar from '../../components/common/MeterBar';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import { typography, layout } from '../../constants/designTokens';
import { formatCount } from '../../utils/formatDuration';

// Personal attempt history for individual questions.
//
// WHAT THE ENDPOINT ACTUALLY RETURNS
// ----------------------------------
// `question/submission/summary/user` returns one row PER SUBMISSION, not per
// question, with only four fields: responseId, questionId, questionDescription and
// correctSubmission. There is no timestamp and no score, and the query is hard
// capped at 200 rows server-side.
//
// The old page rendered that list verbatim under the heading "My Solved
// Questions", which was doubly misleading: attempting a question is not solving
// it, and a question attempted four times appeared four times as four unrelated
// rows. Someone with 30 attempts across 8 questions saw a 30-row table and no
// way to tell how many distinct questions that represented.
//
// So the log is folded by question here: one row per question, carrying the
// attempt count and whether it was ever answered correctly. That is a genuinely
// different and more useful statement, and it is derivable from exactly the four
// fields available.
//
// WHAT IS DELIBERATELY ABSENT
// ---------------------------
// No streaks, no accuracy-over-time chart, no "questions this week". The payload
// has no timestamps, so any of those would be invented.

class UserQuestionSubmissionsSummary extends React.Component {

    constructor(props) {
        super(props)
        this.state = { hasRequested: false };
    }

    componentDidMount() {
        this.initializeQuestions();
    }

    initializeQuestions = async () => {
        if (this.state.hasRequested) {
            return;
        }
        this.setState({ hasRequested: true });
        const userEmail = UserDetailsUtil.getUserEmail();
        if (userEmail == null) {
            // Signed out: render the prompt rather than throwing on JSON.parse.
            this.props.saveUserQuestionsSummary([]);
            return;
        }
        await QuestionsReceiver.getUserSubmmittedQuestionsSummary(userEmail).then(questionsSummaryData=>{
            const rows = (questionsSummaryData && Array.isArray(questionsSummaryData.data))
                ? questionsSummaryData.data
                : [];
            this.props.saveUserQuestionsSummary(rows);
        });
    }

    /**
     * Fold the submission log into one entry per question.
     * Insertion order is preserved because the payload carries no timestamp to
     * sort by, so imposing an order would imply information we do not have.
     */
    getGroupedQuestions = () => {
        const rows = this.props.userQuestionsSummary || [];
        const byQuestion = new Map();
        rows.forEach((row) => {
            if (row == null || row.questionId == null) {
                return;
            }
            const existing = byQuestion.get(row.questionId);
            if (existing === undefined) {
                byQuestion.set(row.questionId, {
                    questionId: row.questionId,
                    description: row.questionDescription,
                    attempts: 1,
                    correctAttempts: row.correctSubmission ? 1 : 0,
                    // Kept so the row can deep-link to a specific review page.
                    latestResponseId: row.responseId,
                });
                return;
            }
            existing.attempts += 1;
            if (row.correctSubmission) {
                existing.correctAttempts += 1;
            }
            existing.latestResponseId = row.responseId;
        });
        return Array.from(byQuestion.values());
    }

    getOverviewJSX = (grouped) => {
        const rows = this.props.userQuestionsSummary || [];
        const totalAttempts = rows.length;
        const solved = grouped.filter((entry) => entry.correctAttempts > 0).length;
        const correctAttempts = rows.filter((row) => row.correctSubmission).length;
        const accuracy = totalAttempts > 0 ? Math.round((correctAttempts * 100) / totalAttempts) : null;

        return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h1 className={typography.h1}>Your question practice</h1>
            <p className="mt-1 text-sm text-gray-500">
                Every question you have attempted, folded together so each one appears once.
            </p>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5">
                <StatTile label="Questions tried" value={formatCount(grouped.length)} />
                <StatTile
                    label="Solved"
                    value={formatCount(solved)}
                    hint="answered correctly at least once"
                    tone={solved > 0 ? 'success' : 'neutral'}
                />
                <StatTile label="Total attempts" value={formatCount(totalAttempts)} />
                {accuracy !== null &&
                    <StatTile
                        label="Accuracy"
                        value={accuracy + '%'}
                        hint={formatCount(correctAttempts) + ' of ' + formatCount(totalAttempts) + ' attempts'}
                    />
                }
            </dl>
            {grouped.length > 0 &&
                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-gray-600">Solved</span>
                        <span className="text-gray-500 tabular-nums">{solved} of {grouped.length} attempted</span>
                    </div>
                    <MeterBar value={solved} max={grouped.length} />
                </div>
            }
            {/* The server caps this query at 200 rows. Saying so is better than
                silently presenting a truncated history as complete. */}
            {totalAttempts >= 200 &&
                <p className="mt-4 text-xs text-gray-400">
                    Showing your most recent 200 attempts.
                </p>
            }
        </div>;
    }

    getListJSX = (grouped) => {
        if (!UserDetailsUtil.isSignedIn()) {
            return <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <h2 className={typography.h2}>Sign in to see your history</h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    Once you are signed in, every question you attempt is recorded here with your accuracy.
                </p>
                <a
                    href={currentURLHost + 'questions'}
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                    Browse questions
                    <span aria-hidden="true">&rarr;</span>
                </a>
            </div>;
        }
        if (grouped.length === 0) {
            return <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <EmptyState
                    title="No attempts yet"
                    description="Questions you attempt will appear here, with your accuracy on each one."
                />
                <div className="flex justify-center">
                    <a
                        href={currentURLHost + 'questions'}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                        Start practising
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>;
        }
        return <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {grouped.map((entry) => {
                    const isSolved = entry.correctAttempts > 0;
                    return <article key={entry.questionId} className="group flex items-start gap-3.5 px-4 md:px-5 py-4 transition-colors hover:bg-gray-50/70">
                        <span
                            className={[
                                'shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mt-0.5',
                                isSolved ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700',
                            ].join(' ')}
                            title={isSolved ? 'Solved' : 'Not yet solved'}
                        >
                            {isSolved ? '✓' : '✗'}
                            <span className="sr-only">{isSolved ? 'Solved' : 'Not yet solved'}</span>
                        </span>
                        <div className="flex-1 min-w-0">
                            <a
                                href={currentURLHost + 'question/view?question_id=' + entry.questionId}
                                className="block focus:outline-none"
                            >
                                <MathContent
                                    html={entry.description}
                                    className="math-content--preview text-sm text-gray-800 group-hover:text-gray-900"
                                />
                            </a>
                            <div className="flex items-center gap-2.5 flex-wrap mt-2">
                                <span className="text-xs text-gray-500 tabular-nums">
                                    {entry.attempts} {entry.attempts === 1 ? 'attempt' : 'attempts'}
                                </span>
                                {entry.attempts > 1 &&
                                    <span className="text-xs text-gray-400 tabular-nums">
                                        {entry.correctAttempts} correct
                                    </span>
                                }
                                {entry.latestResponseId &&
                                    <a
                                        href={currentURLHost + 'question/submission/view?response_id=' + entry.latestResponseId}
                                        className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                    >
                                        View last attempt
                                    </a>
                                }
                            </div>
                        </div>
                        <Badge variant={isSolved ? 'success' : 'danger'} className="shrink-0 hidden sm:inline-flex">
                            {isSolved ? 'Solved' : 'Unsolved'}
                        </Badge>
                    </article>;
                })}
            </div>
        </div>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.userQuestionsSummary === undefined){
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>
        }
        const grouped = this.getGroupedQuestions();
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className={layout.container + ' py-6 md:py-8 flex gap-6 items-start'}>
                <AdRail />
                <div className="flex-1 min-w-0 max-w-3xl mx-auto">
                    {this.getOverviewJSX(grouped)}
                    {this.getListJSX(grouped)}
                </div>
                <AdRail />
            </div>
        </div> 
    }
}

const mapDispatchToProps = dispatch => ({
    saveUserQuestionsSummary: (payload) => dispatch(saveUserQuestionsSummary(payload))
})

const mapStateToProps = state => {
    return {
        userQuestionsSummary: state.solgressReducer.userQuestionsSummary
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserQuestionSubmissionsSummary);
