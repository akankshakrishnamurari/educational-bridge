import React from 'react';
import { connect } from 'react-redux';
import {saveUserPapersSummary} from '../../store/actions/solgressAction';
import PaperAPIsConnector from "../../apis/PaperAPIsConnector";
import {currentURLHost} from './../../constants/hostConfig';
import ClipLoader from "react-spinners/ClipLoader";
import EducationalBridgeHeader from '../header/EducationalBridgeHeader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Footer from '../../components/common/Footer';
import StatTile from '../../components/common/StatTile';
import { UserDetailsUtil } from '../../utils/UserDetailsUtil';
import { typography, layout } from '../../constants/designTokens';
import { formatCount } from '../../utils/formatDuration';

// Personal paper history.
//
// Unlike the question history, this payload DOES carry a timestamp
// (`submissionDate`) and a completion flag (`paperSubmissionBlocked`), which makes
// two things possible that the question page cannot support:
//
//   1. Real chronological ordering, newest first.
//   2. Separating unfinished attempts from completed ones, and offering to resume
//      them. An in-progress paper is the single most actionable item a learner can
//      have on this platform, and it was previously buried as an "Ongoing" badge in
//      the third column of a table sorted in arbitrary order.
//
// `paperSubmissionBlocked` is the backend's name for "this attempt is closed", so
// blocked = submitted and unblocked = resumable. The old row handler already
// branched on it to choose between the report and the paper; that routing is kept
// but is now stated in the UI rather than hidden in a click handler.

class UserPaperSubmissionsSummary extends React.Component {

    constructor(props) {
        super(props)
        this.state = { hasRequested: false };
    }

    componentDidMount() {
        this.initializePapers();
    }

    initializePapers = async () => {
        if (this.state.hasRequested) {
            return;
        }
        this.setState({ hasRequested: true });
        const userEmail = UserDetailsUtil.getUserEmail();
        if (userEmail == null) {
            this.props.saveUserPapersSummary([]);
            return;
        }
        await PaperAPIsConnector.getUserSubmmittedPapersSummary(userEmail).then(papersSummaryData=>{
            const rows = (papersSummaryData && Array.isArray(papersSummaryData.data))
                ? papersSummaryData.data
                : [];
            this.props.saveUserPapersSummary(rows);
        });
    }

    formatDate = (value) => {
        const millis = parseInt(value, 10);
        if (!Number.isFinite(millis) || millis <= 0) {
            return null;
        }
        return new Date(millis).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    }

    /** Newest first, using the real submissionDate. */
    getSortedPapers = () => {
        const rows = [...(this.props.userPapersSummary || [])];
        return rows.sort((a, b) => {
            const left = parseInt(a && a.submissionDate, 10);
            const right = parseInt(b && b.submissionDate, 10);
            const safeLeft = Number.isFinite(left) ? left : 0;
            const safeRight = Number.isFinite(right) ? right : 0;
            return safeRight - safeLeft;
        });
    }

    getOverviewJSX = (papers) => {
        const submitted = papers.filter((paper) => paper.paperSubmissionBlocked).length;
        const ongoing = papers.length - submitted;
        return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
            <h1 className={typography.h1}>Your papers</h1>
            <p className="mt-1 text-sm text-gray-500">
                Every timed paper you have started, newest first.
            </p>
            <dl className="grid grid-cols-3 gap-2.5 mt-5">
                <StatTile label="Started" value={formatCount(papers.length)} />
                <StatTile label="Completed" value={formatCount(submitted)} tone={submitted > 0 ? 'success' : 'neutral'} />
                <StatTile
                    label="In progress"
                    value={formatCount(ongoing)}
                    tone={ongoing > 0 ? 'primary' : 'neutral'}
                />
            </dl>
        </div>;
    }

    /**
     * Unfinished attempts are lifted out into their own block above the history.
     * A half-finished timed paper is time already invested; it should not have to
     * be hunted for.
     */
    getResumeJSX = (papers) => {
        const ongoing = papers.filter((paper) => !paper.paperSubmissionBlocked);
        if (ongoing.length === 0) {
            return <div />;
        }
        return <section className="mt-5 bg-primary-50 rounded-xl border border-primary-200 p-5 md:p-6">
            <h2 className="text-base font-bold text-primary-900">
                {ongoing.length === 1 ? 'You have a paper in progress' : 'You have papers in progress'}
            </h2>
            <p className="mt-1 text-sm text-primary-800/80">
                Pick up where you left off. Your answers were saved as you went.
            </p>
            <div className="mt-4 flex flex-col gap-2">
                {ongoing.map((paper) => (
                    <a
                        key={paper.paperSubmissionId}
                        href={currentURLHost + 'paper/view?paper_id=' + paper.paperId + '&paper_instance_id=' + paper.paperSubmissionId}
                        className="group flex items-center justify-between gap-3 bg-white rounded-lg border border-primary-200 px-4 py-3 transition-colors hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    >
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-gray-900 truncate">
                                {paper.paperName || 'Untitled paper'}
                            </span>
                            {this.formatDate(paper.submissionDate) &&
                                <span className="block text-xs text-gray-500 mt-0.5">
                                    Started {this.formatDate(paper.submissionDate)}
                                </span>
                            }
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                            Resume
                            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">&rarr;</span>
                        </span>
                    </a>
                ))}
            </div>
        </section>;
    }

    getHistoryJSX = (papers) => {
        if (!UserDetailsUtil.isSignedIn()) {
            return <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <h2 className={typography.h2}>Sign in to see your papers</h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    Your timed attempts and scores are saved to your account.
                </p>
                <a
                    href={currentURLHost + 'papers'}
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                    Browse papers
                    <span aria-hidden="true">&rarr;</span>
                </a>
            </div>;
        }
        const completed = papers.filter((paper) => paper.paperSubmissionBlocked);
        if (papers.length === 0) {
            return <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                <EmptyState
                    title="No papers yet"
                    description="Timed papers you attempt will appear here with your score."
                />
                <div className="flex justify-center">
                    <a
                        href={currentURLHost + 'papers'}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                        Find a paper
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>;
        }
        if (completed.length === 0) {
            return <div />;
        }
        return <section className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 md:px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-semibold text-gray-900">Completed</h2>
            </div>
            <div className="divide-y divide-gray-100">
                {completed.map((paper) => (
                    <article key={paper.paperSubmissionId} className="group flex items-center justify-between gap-3 px-4 md:px-5 py-4 transition-colors hover:bg-gray-50/70">
                        <div className="min-w-0">
                            <a
                                href={currentURLHost + 'paper/submission/view?paper_submission_response_id=' + paper.paperSubmissionId}
                                className="block focus:outline-none"
                            >
                                <span className="block text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                                    {paper.paperName || 'Untitled paper'}
                                </span>
                            </a>
                            {this.formatDate(paper.submissionDate) &&
                                <span className="block text-xs text-gray-500 mt-0.5">
                                    {this.formatDate(paper.submissionDate)}
                                </span>
                            }
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                            <Badge variant="success" className="hidden sm:inline-flex">Submitted</Badge>
                            <a
                                href={currentURLHost + 'paper/submission/view?paper_submission_response_id=' + paper.paperSubmissionId}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                            >
                                Report
                                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </article>
                ))}
            </div>
        </section>;
    }

    render() {
        if(typeof window == `undefined`){
            return <div/>;
        }
        if(this.props.userPapersSummary === undefined){
            return <div className='bg-gray-50 min-h-screen'>
                <EducationalBridgeHeader/>
                <div className='flex justify-center py-20'>
                    <ClipLoader color="#2563EB" size={60}/>
                </div>
            </div>
        }
        const papers = this.getSortedPapers();
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            <div className={layout.reading + ' py-6 md:py-8'}>
                {this.getOverviewJSX(papers)}
                {this.getResumeJSX(papers)}
                {this.getHistoryJSX(papers)}
            </div>
            <Footer />
        </div>      
    }
}

const mapDispatchToProps = dispatch => ({
    saveUserPapersSummary: (payload) => dispatch(saveUserPapersSummary(payload))
})

const mapStateToProps = state => {
    return {
        userPapersSummary: state.solgressReducer.userPapersSummary
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserPaperSubmissionsSummary);
