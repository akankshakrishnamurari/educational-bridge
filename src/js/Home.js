import React from 'react';
import { connect } from 'react-redux';
import EducationalBridgeHeader from './header/EducationalBridgeHeader';
import PageCard from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { typography, layout } from '../constants/designTokens';
import { currentURLHost } from '../constants/hostConfig';
import { UserDetailsUtil } from '../utils/UserDetailsUtil';
import QuestionsReceiver from '../apis/QuestionsReceiver';
import ChannelReceiver from '../apis/ChannelReceiver';
import {
    HiOutlineAcademicCap,
    HiOutlineChartBar,
    HiOutlineUserGroup,
    HiOutlineSparkles,
} from 'react-icons/hi';
import {
    BsPencilSquare,
    BsClipboardCheck,
    BsGraphUp,
} from 'react-icons/bs';
import { AiOutlinePlayCircle, AiOutlineFileText, AiOutlineArrowRight } from 'react-icons/ai';

// Home is the front door of the product, so unlike every other page it has to
// sell the *idea* (creators publish, learners practice, channels organize
// everything by subject) rather than just render a data list. JEE questions
// are today's content, not the ceiling of what the platform is — the roadmap
// section exists specifically so that reads correctly to a first-time visitor.
//
// Data on this page is intentionally real, not placeholder copy: the question
// count and channel list are pulled live from the same APIs the rest of the
// app uses, so the numbers never drift out of sync with what's actually in
// the database.

class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            totalQuestions: null,
            channels: [],
        };
    }

    componentDidMount() {
        QuestionsReceiver.getAllFilteredQuestions('', [], [], 0, 1).then(response => {
            const pageCount = response && response.data ? response.data.pageCount : null;
            this.setState({ totalQuestions: pageCount });
        });
        ChannelReceiver.getAllChannelsSummary().then(response => {
            this.setState({ channels: (response && response.data) || [] });
        });
    }

    goTo = (path) => {
        window.location.href = currentURLHost + path;
    }

    formatCount = (count) => {
        if (count === null || count === undefined) {
            return '—';
        }
        if (count >= 1000) {
            return Math.floor(count / 100) / 10 + 'k+';
        }
        return String(count);
    }

    getHeroSection = () => {
        const isLoggedIn = UserDetailsUtil.getUserGoogleId() != null;
        return (
            <div className="border-b border-gray-200 bg-white">
                <div className={layout.container + ' py-14 md:py-20'}>
                    <div className="max-w-3xl">
                        <Badge variant="warning">Beta &middot; JEE practice live today</Badge>
                        <h1 className={typography.hero + ' mt-4'}>
                            Where educators build the practice,
                            <br className="hidden md:block" /> and students build mastery.
                        </h1>
                        <p className={typography.lede + ' mt-5 max-w-2xl'}>
                            EducationalBridge is a peer-to-peer learning platform. Creators publish
                            questions, papers, and channels on any subject; learners solve them and get
                            real feedback on where they stand &mdash; think of it as a YouTube for
                            studying, built around practice and measurable progress instead of just
                            watching.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Button size="lg" variant="primary" onClick={() => this.goTo('questions')}>
                                Start practicing
                                <AiOutlineArrowRight size={18} />
                            </Button>
                            <Button size="lg" variant="secondary" onClick={() => this.goTo('question/upsert')}>
                                <BsPencilSquare size={16} />
                                Become a creator
                            </Button>
                        </div>
                        {!isLoggedIn && (
                            <p className={typography.caption + ' mt-4'}>
                                No account needed to browse. Sign in with Google to save progress,
                                vote, and comment.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    getStatsSection = () => {
        const stats = [
            { label: 'Practice questions', value: this.formatCount(this.state.totalQuestions) },
            { label: 'Subject channels', value: this.state.channels.length || '—' },
            { label: 'Exam covered today', value: 'JEE Main' },
            { label: 'More on the way', value: 'Notes & video' },
        ];
        return (
            <div className="bg-gray-50 border-b border-gray-200">
                <div className={layout.container + ' py-8'}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center md:text-left">
                                <div className={typography.stat}>{stat.value}</div>
                                <div className={typography.caption + ' mt-1'}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    getHowItWorksSection = () => {
        const creatorSteps = [
            { icon: <BsPencilSquare size={20} />, title: 'Write questions & papers', body: 'Use the built-in editor with math support to author single-select MCQs, full timed papers, and organize them with tags.' },
            { icon: <HiOutlineUserGroup size={20} />, title: 'Publish to a channel', body: 'Group your content into a channel by subject or topic so learners can discover everything you\'ve built in one place.' },
            { icon: <HiOutlineChartBar size={20} />, title: 'See how learners do', body: 'Every question tracks attempts, accuracy, and votes, so you know which content is actually helping people learn.' },
        ];
        const learnerSteps = [
            { icon: <AiOutlineFileText size={20} />, title: 'Browse or search', body: 'Find questions and papers by channel, tag, exam, or plain search &mdash; no account required to start.' },
            { icon: <BsClipboardCheck size={20} />, title: 'Solve & get scored', body: 'Answer individual questions or take a full timed paper, with instant correctness and worked solutions.' },
            { icon: <BsGraphUp size={20} />, title: 'Track your progress', body: 'Sign in to keep a history of everything you\'ve solved and see your accuracy improve over time.' },
        ];
        return (
            <div className={layout.container + ' py-14'}>
                <div className="max-w-2xl">
                    <h2 className={typography.display}>How EducationalBridge works</h2>
                    <p className={typography.lede + ' mt-3'}>
                        Two sides of the same platform: people who create practice material,
                        and people who use it to get better.
                    </p>
                </div>
                <div className="mt-10 grid md:grid-cols-2 gap-6">
                    <PageCard className="border-t-4 border-t-primary-600">
                        <div className="flex items-center gap-2">
                            <div className={typography.h2}>For creators</div>
                            <Badge variant="neutral">Teachers &middot; Mentors &middot; Institutes</Badge>
                        </div>
                        <div className="mt-5 flex flex-col gap-5">
                            {creatorSteps.map((step, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                    <div>
                                        <div className={typography.h3}>{step.title}</div>
                                        <div className={typography.body + ' mt-0.5'}>{step.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <Button variant="secondary" onClick={() => this.goTo('question/upsert')}>
                                Create your first question
                            </Button>
                        </div>
                    </PageCard>
                    <PageCard className="border-t-4 border-t-success-600">
                        <div className="flex items-center gap-2">
                            <div className={typography.h2}>For learners</div>
                            <Badge variant="success">Students &middot; Exam aspirants</Badge>
                        </div>
                        <div className="mt-5 flex flex-col gap-5">
                            {learnerSteps.map((step, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="shrink-0 w-9 h-9 rounded-lg bg-success-50 text-success-700 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                    <div>
                                        <div className={typography.h3}>{step.title}</div>
                                        <div className={typography.body + ' mt-0.5'}>{step.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <Button variant="secondary" onClick={() => this.goTo('questions')}>
                                Browse questions
                            </Button>
                        </div>
                    </PageCard>
                </div>
            </div>
        );
    }

    getChannelsSection = () => {
        if (this.state.channels.length === 0) {
            return null;
        }
        return (
            <div className="bg-gray-50 border-t border-gray-200">
                <div className={layout.container + ' py-14'}>
                    <div className="flex items-end justify-between flex-wrap gap-3">
                        <div>
                            <h2 className={typography.display}>Explore by channel</h2>
                            <p className={typography.lede + ' mt-3 max-w-2xl'}>
                                Channels group practice content by subject, the way a YouTube channel
                                groups videos by creator or topic.
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => this.goTo('channels')}>
                            View all channels
                            <AiOutlineArrowRight size={16} />
                        </Button>
                    </div>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {this.state.channels.slice(0, 6).map((channel) => (
                            <PageCard
                                key={channel.id}
                                hoverable
                                onClick={() => this.goTo('questions?channel_id=' + channel.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                                        <HiOutlineAcademicCap size={20} />
                                    </div>
                                    <div className={typography.h3}>{channel.channelName}</div>
                                </div>
                            </PageCard>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    getRoadmapSection = () => {
        const roadmapItems = [
            { icon: <AiOutlineFileText size={22} />, title: 'JEE Main practice', status: 'Live now', statusVariant: 'success', body: 'Thousands of previous-year JEE Main questions and full-length papers, organized by subject, topic, and difficulty.' },
            { icon: <HiOutlineSparkles size={22} />, title: 'Written notes', status: 'Coming soon', statusVariant: 'warning', body: 'Creators will be able to publish structured notes alongside their questions, so learners can study the concept before practicing it.' },
            { icon: <AiOutlinePlayCircle size={22} />, title: 'Video lessons', status: 'Coming soon', statusVariant: 'warning', body: 'Short video explanations attached to channels and questions &mdash; the "watch" half of the YouTube-for-studying idea.' },
        ];
        return (
            <div className={layout.container + ' py-14'}>
                <div className="max-w-2xl">
                    <h2 className={typography.display}>Built to grow beyond JEE</h2>
                    <p className={typography.lede + ' mt-3'}>
                        JEE Main is where we're starting, not where we stop. The same
                        creator &rarr; channel &rarr; learner model is meant to work for any subject
                        or exam.
                    </p>
                </div>
                <div className="mt-10 grid md:grid-cols-3 gap-6">
                    {roadmapItems.map((item, index) => (
                        <PageCard key={index}>
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <Badge variant={item.statusVariant}>{item.status}</Badge>
                            </div>
                            <div className={typography.h3 + ' mt-4'}>{item.title}</div>
                            <div className={typography.body + ' mt-1.5'}>{item.body}</div>
                        </PageCard>
                    ))}
                </div>
            </div>
        );
    }

    getFinalCtaSection = () => {
        const isLoggedIn = UserDetailsUtil.getUserGoogleId() != null;
        return (
            <div className="bg-primary-600">
                <div className={layout.container + ' py-14 flex flex-col md:flex-row items-center justify-between gap-6'}>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                            {isLoggedIn ? 'Pick up where you left off.' : 'Ready to get started?'}
                        </h2>
                        <p className="text-primary-50 mt-2 max-w-xl">
                            {isLoggedIn
                                ? 'Jump back into practice, or publish something new for other learners.'
                                : 'Browse instantly, no sign-up required. Sign in with Google whenever you want your progress saved.'}
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        {/* Not using the shared Button component here: its
                            variant classes and this section's on-brand-band
                            colors would both apply, and with Tailwind's
                            `important: true` config, which one wins on a tie
                            is determined by generated stylesheet order, not
                            by className order — too fragile to rely on. */}
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 text-base px-5 py-2.5 font-semibold rounded-lg transition-colors bg-white text-primary-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                            onClick={() => this.goTo('questions')}
                        >
                            Start practicing
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 text-base px-5 py-2.5 font-semibold rounded-lg transition-colors bg-primary-700 text-white border border-primary-400 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                            onClick={() => this.goTo('question/upsert')}
                        >
                            Create content
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="bg-white min-h-screen">
                <EducationalBridgeHeader />
                {this.getHeroSection()}
                {this.getStatsSection()}
                {this.getHowItWorksSection()}
                {this.getChannelsSection()}
                {this.getRoadmapSection()}
                {this.getFinalCtaSection()}
            </div>
        );
    }
}

export default connect(() => ({}))(Home);
