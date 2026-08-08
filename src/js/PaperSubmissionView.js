import React from 'react';
import '../App.css';
import { connect } from 'react-redux';
import {saveSubmittedPaperDetails, savePaperDetails} from '../store/actions/solgressAction'
import PaperAPIsConnector from "../apis/PaperAPIsConnector";
import { PaperViewHelperUtil } from '../utils/PaperViewHelperUtil';
import {currentURLHost} from './../constants/hostConfig';
import EducationalBridgeHeader from './../js/header/EducationalBridgeHeader';
import ClipLoader from "react-spinners/ClipLoader";
import StatTile from '../components/common/StatTile';
import Footer from '../components/common/Footer';
import MeterBar from '../components/common/MeterBar';
import MathContent from '../components/common/MathContent';
import { typography, layout } from '../constants/designTokens';
import { buildTagIdLabelMap } from '../utils/questionTaxonomy';
import { formatDuration } from '../utils/formatDuration';

// Score report for a completed timed paper.
//
// THIS PAGE WAS BROKEN AND MOSTLY FABRICATED
// ------------------------------------------
//  1. It never loaded. The render guard required `generalInfo` to be defined, but
//     `generalInfo` is absent from the redux initial state and this page never set
//     it -- so a fresh visit rendered a spinner forever while re-firing the
//     fetch on every render.
//  2. The score was never shown. `getPaperScoreOverview()` existed but its call
//     site was commented out, so the one number a learner opens this page for was
//     not on it.
//  3. Most of what DID render was invented. The "time spent" bar chart used the
//     literal values [30,45],[20,3],[15,17]; the "marks per minute" chart listed
//     hardcoded topics (Physics: Kinematics 1.6 vs 2.3, and so on) unrelated to
//     the paper; the radar chart appended a synthetic "physics : topic" axis with
//     a hardcoded value of 1; and the compare-with panel offered a hardcoded
//     "Student : Krishna Murari" radio option next to radios that were all
//     statically `checked` and wired to nothing.
//
// The backend was already returning a genuinely rich analysis the whole time --
// PaperCategoryScoreAnalysis carries score, per-outcome question counts, and time
// split across correct/incorrect/skipped, for both the candidate AND the top
// scorer. Everything below is drawn from that. Nothing is synthesised: where a
// figure is unavailable the block is omitted.

const mapDispatchToProps = dispatch => ({
    saveSubmittedPaperDetails: (payload) => dispatch(saveSubmittedPaperDetails(payload)),
    savePaperDetails: (payload) => dispatch(savePaperDetails(payload))
})

const mapStateToProps = state => {
    return {
        submittedPaperDetails: state.solgressReducer.submittedPaperDetails,
        paperDetails: state.solgressReducer.paperDetails
    };
}

class PaperSubmissionView extends React.Component {

    constructor(props) {
        super(props)
        this.state = { hasRequested: false };
    }

    componentDidMount() {
        this.initializeSubmittedPaperDetails();
    }

    initializeSubmittedPaperDetails = () => {
        if (this.state.hasRequested) {
            return;
        }
        this.setState({ hasRequested: true });
        const search = window.location.search;
        const paperSubmissionId = new URLSearchParams(search).get('paper_submission_response_id');
        if (paperSubmissionId == null) {
            return;
        }
        PaperAPIsConnector.getSubmittedPaperDetails(paperSubmissionId).then( submittedPaperData => {
            if (submittedPaperData == null || submittedPaperData.data == null) {
                return;
            }
            this.props.saveSubmittedPaperDetails(submittedPaperData.data);
            this.props.savePaperDetails(PaperViewHelperUtil.normalise(submittedPaperData.data.paperDetails));
        });
    }

    /** Overall analysis for this candidate, or null when absent. */
    getCandidateAnalysis = () => {
        const analysis = this.props.submittedPaperDetails.paperResponseAnalysis;
        if (analysis == null || analysis.candidateScoreAnalysis == null) {
            return null;
        }
        return analysis.candidateScoreAnalysis.candidateScoreAnalysis || null;
    }

    getTopperAnalysis = () => {
        const analysis = this.props.submittedPaperDetails.paperResponseAnalysis;
        if (analysis == null || analysis.topperScoreAnalysis == null) {
            return null;
        }
        return analysis.topperScoreAnalysis.candidateScoreAnalysis || null;
    }

    /**
     * Score and maximum. Prefers the backend's computed figures; falls back to
     * summing the paper's own section marks so the hero still renders on older
     * submissions saved before the analysis existed.
     */
    getScoreTotals = () => {
        const candidate = this.getCandidateAnalysis();
        if (candidate != null && typeof candidate.totalScore === 'number' && typeof candidate.maximumScore === 'number') {
            return { score: candidate.totalScore, maximum: candidate.maximumScore };
        }
        const paper = this.props.submittedPaperDetails.paperDetails;
        const sections = (paper && paper.subject_wise_section_wise_questions) || {};
        let maximum = 0;
        Object.keys(sections).forEach((subject) => {
            Object.keys(sections[subject]).forEach((section) => {
                const data = sections[subject][section];
                const ids = data.question_ids || [];
                maximum += (Number(data.correct_answer_marks) || 0) * ids.length;
            });
        });
        return { score: null, maximum };
    }

    getHeroJSX = () => {
        const paper = this.props.submittedPaperDetails.paperDetails || {};
        const candidate = this.getCandidateAnalysis();
        const { score, maximum } = this.getScoreTotals();
        const correct = candidate ? candidate.correctQuestions : null;
        const incorrect = candidate ? candidate.incorrectQuestions : null;
        const skipped = candidate ? candidate.skippedQuestions : null;
        const attempted = (typeof correct === 'number' && typeof incorrect === 'number')
            ? correct + incorrect
            : null;
        const accuracy = (attempted != null && attempted > 0)
            ? Math.round((correct * 100) / attempted)
            : null;

        return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <a
                href={currentURLHost + 'papers'}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
                <span aria-hidden="true">&larr;</span>
                All papers
            </a>
            <h1 className={typography.h1 + ' mt-3'}>{paper.paper_name || 'Paper report'}</h1>

            {score !== null
                ? <div className="mt-5">
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                                {score}
                            </span>
                            <span className="text-lg font-semibold text-gray-400 tabular-nums">
                                / {maximum}
                            </span>
                        </div>
                        {accuracy !== null &&
                            <div className="text-right">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accuracy</p>
                                <p className="text-2xl font-bold text-gray-900 tabular-nums">{accuracy}%</p>
                            </div>
                        }
                    </div>
                    <MeterBar value={score} max={maximum} className="mt-3" height="h-2.5" />
                </div>
                : <p className="mt-4 text-sm text-gray-500">
                    A score breakdown is not available for this attempt.
                </p>
            }

            {candidate &&
                <dl className="grid grid-cols-3 gap-2.5 mt-5">
                    <StatTile label="Correct" value={correct} tone="success" />
                    <StatTile label="Incorrect" value={incorrect} tone="danger" />
                    <StatTile label="Skipped" value={skipped} />
                </dl>
            }
        </div>;
    }

    /**
     * Where the time went. This is the single most actionable view in exam prep --
     * time sunk into questions you got wrong is the classic strategy leak -- and
     * every figure here is a real field on the analysis object.
     */
    getTimeAnalysisJSX = () => {
        const candidate = this.getCandidateAnalysis();
        if (candidate == null) {
            return <div />;
        }
        const onCorrect = Number(candidate.timeSpentOnCorrectQuestions) || 0;
        const onIncorrect = Number(candidate.timeSpentOnIncorrectQuestions) || 0;
        const onSkipped = Number(candidate.timeSpentOnSkippedQuestions) || 0;
        const total = onCorrect + onIncorrect + onSkipped;
        if (total <= 0) {
            return <div />;
        }
        const segments = [
            { label: 'Correct', value: onCorrect, fill: 'bg-success-600' },
            { label: 'Incorrect', value: onIncorrect, fill: 'bg-danger-500' },
            { label: 'Skipped', value: onSkipped, fill: 'bg-gray-300' },
        ];
        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2}>Where your time went</h2>
            <p className="mt-1 text-sm text-gray-500">
                Total {formatDuration(total)} across the paper.
            </p>
            {/* Single stacked bar rather than three separate charts: the point is
                the proportion between them, which a stack shows directly. */}
            <div className="flex w-full h-3 rounded-full overflow-hidden mt-4 bg-gray-100">
                {segments.map((segment) => (
                    segment.value > 0
                        ? <div
                            key={segment.label}
                            className={segment.fill}
                            style={{ width: ((segment.value * 100) / total) + '%' }}
                            title={segment.label + ': ' + formatDuration(segment.value)}
                        />
                        : null
                ))}
            </div>
            <dl className="grid grid-cols-3 gap-2.5 mt-4">
                {segments.map((segment) => (
                    <StatTile
                        key={segment.label}
                        label={segment.label}
                        value={formatDuration(segment.value) || '0s'}
                        hint={Math.round((segment.value * 100) / total) + '% of total'}
                    />
                ))}
            </dl>
        </section>;
    }

    /**
     * Candidate against the paper's top scorer. Real figures from
     * topperScoreAnalysis -- the previous version drew this comparison with
     * invented numbers.
     */
    getComparisonJSX = () => {
        const candidate = this.getCandidateAnalysis();
        const topper = this.getTopperAnalysis();
        if (candidate == null || topper == null) {
            return <div />;
        }
        const rows = [
            ['Score', candidate.totalScore, topper.totalScore, candidate.maximumScore],
            ['Correct answers', candidate.correctQuestions, topper.correctQuestions, null],
            ['Incorrect answers', candidate.incorrectQuestions, topper.incorrectQuestions, null],
            ['Skipped', candidate.skippedQuestions, topper.skippedQuestions, null],
        ].filter((row) => typeof row[1] === 'number' && typeof row[2] === 'number');

        if (rows.length === 0) {
            return <div />;
        }

        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2}>You against the top scorer</h2>
            <p className="mt-1 text-sm text-gray-500">
                The dark marker shows where the highest scorer on this paper landed.
            </p>
            <div className="mt-4 flex flex-col gap-4">
                {rows.map(([label, mine, theirs, max]) => {
                    const scale = max != null ? max : Math.max(mine, theirs, 1);
                    return <div key={label}>
                        <div className="flex items-baseline justify-between text-sm mb-1.5">
                            <span className="font-medium text-gray-700">{label}</span>
                            <span className="tabular-nums text-gray-500">
                                <span className="font-bold text-gray-900">{mine}</span>
                                <span className="text-gray-300"> / </span>
                                {theirs}
                            </span>
                        </div>
                        <MeterBar
                            value={mine}
                            max={scale}
                            comparisonValue={theirs}
                            comparisonLabel={'Top scorer: ' + theirs}
                        />
                    </div>;
                })}
            </div>
        </section>;
    }

    /**
     * Per-topic performance, WEAKEST FIRST.
     *
     * Ordering is the whole design here. A report sorted by paper order tells you
     * what happened; a report sorted by weakness tells you what to do next, which
     * is the only reason to read it.
     */
    getTopicBreakdownJSX = () => {
        const analysis = this.props.submittedPaperDetails.paperResponseAnalysis;
        if (analysis == null || analysis.candidateScoreAnalysis == null) {
            return <div />;
        }
        const byTag = analysis.candidateScoreAnalysis.tagIdToCandidateScoreAnalysis || {};
        const topperByTag = (analysis.topperScoreAnalysis && analysis.topperScoreAnalysis.tagIdToCandidateScoreAnalysis) || {};
        const labels = buildTagIdLabelMap(this.props.paperDetails);

        const rows = Object.keys(byTag)
            .map((tagId) => {
                const entry = byTag[tagId];
                const label = labels[tagId];
                if (entry == null || label == null) {
                    // A tag with no resolvable name is dropped rather than shown as
                    // a raw id, which would be noise.
                    return null;
                }
                const maximum = Number(entry.maximumScore) || 0;
                const score = Number(entry.totalScore) || 0;
                return {
                    tagId,
                    label: label.label,
                    score,
                    maximum,
                    fraction: maximum > 0 ? score / maximum : 0,
                    topperScore: topperByTag[tagId] ? Number(topperByTag[tagId].totalScore) : null,
                    correct: entry.correctQuestions,
                    incorrect: entry.incorrectQuestions,
                    skipped: entry.skippedQuestions,
                };
            })
            .filter((row) => row !== null && row.maximum > 0)
            .sort((a, b) => a.fraction - b.fraction);

        if (rows.length === 0) {
            return <div />;
        }

        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2}>Topic by topic</h2>
            <p className="mt-1 text-sm text-gray-500">
                Ordered weakest first, so the topics worth revising are at the top.
            </p>
            <div className="mt-4 flex flex-col divide-y divide-gray-100">
                {rows.map((row) => (
                    <div key={row.tagId} className="py-3 first:pt-0">
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                            <span className="text-sm font-medium text-gray-800 min-w-0 truncate">
                                {row.label}
                            </span>
                            <span className="text-sm tabular-nums shrink-0">
                                <span className="font-bold text-gray-900">{row.score}</span>
                                <span className="text-gray-400"> / {row.maximum}</span>
                            </span>
                        </div>
                        <MeterBar
                            value={row.score}
                            max={row.maximum}
                            comparisonValue={row.topperScore}
                            comparisonLabel={row.topperScore != null ? 'Top scorer: ' + row.topperScore : null}
                        />
                        <p className="mt-1.5 text-xs text-gray-500 tabular-nums">
                            {row.correct} correct · {row.incorrect} incorrect · {row.skipped} skipped
                        </p>
                    </div>
                ))}
            </div>
        </section>;
    }

    /**
     * Question-by-question index. Each entry links to its own review page, which
     * is where the worked solution lives, so this is the route from "I scored 142"
     * to "here is the one I got wrong and why".
     */
    getQuestionIndexJSX = () => {
        const responses = this.props.submittedPaperDetails.questionSubmittedResponses || [];
        const questions = this.props.paperDetails || [];
        if (questions.length === 0) {
            return <div />;
        }
        const responseByQuestionId = {};
        responses.forEach((response) => {
            if (response && response.questionData) {
                responseByQuestionId[response.questionData.id] = response;
            }
        });

        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h2 className={typography.h2}>Every question</h2>
            <p className="mt-1 text-sm text-gray-500">
                Open any question to see the worked solution.
            </p>
            <ol className="mt-4 flex flex-col divide-y divide-gray-100">
                {questions.map((question, index) => {
                    const response = responseByQuestionId[question.id];
                    const selected = response ? response.selectedOptionId : null;
                    const isSkipped = selected == null;
                    const isCorrect = !isSkipped
                        && String(selected) === String(question.correctOptionId);
                    const href = response
                        ? currentURLHost + 'question/submission/view?response_id=' + response.responseId
                        : currentURLHost + 'question/view?question_id=' + question.id;

                    const badge = isSkipped
                        ? { classes: 'bg-gray-100 text-gray-500', glyph: '–', label: 'Skipped' }
                        : (isCorrect
                            ? { classes: 'bg-success-100 text-success-700', glyph: '✓', label: 'Correct' }
                            : { classes: 'bg-danger-100 text-danger-700', glyph: '✗', label: 'Incorrect' });

                    return <li key={question.id} className="py-2.5 first:pt-0">
                        <a href={href} className="group flex items-start gap-3 focus:outline-none">
                            <span className="shrink-0 text-xs font-semibold text-gray-400 tabular-nums pt-1.5 w-6 text-right">
                                {index + 1}
                            </span>
                            <span
                                className={'shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ' + badge.classes}
                                title={badge.label}
                            >
                                {badge.glyph}
                                <span className="sr-only">{badge.label}</span>
                            </span>
                            <MathContent
                                html={question.description}
                                className="math-content--preview flex-1 min-w-0 text-sm text-gray-700 group-hover:text-gray-900"
                            />
                        </a>
                    </li>;
                })}
            </ol>
        </section>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        // Guard reads only what this page actually needs. It previously also
        // required `generalInfo`, which nothing on this page ever set, so the
        // report could never render at all.
        if(this.props.submittedPaperDetails === undefined || this.props.paperDetails === undefined) {
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size="60"/>
                </div>
            </div>;
        }
        return (
            <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className={layout.wideReading + ' py-6 md:py-8'}>
                    <div>
                        {this.getHeroJSX()}
                        {this.getTimeAnalysisJSX()}
                        {this.getComparisonJSX()}
                        {this.getTopicBreakdownJSX()}
                        {this.getQuestionIndexJSX()}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(PaperSubmissionView);
