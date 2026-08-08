import React from 'react';
import { connect } from 'react-redux';
import EducationalBridgeHeader from './header/EducationalBridgeHeader';
import Badge from '../components/common/Badge';
import { typography, layout } from '../constants/designTokens';
import { currentURLHost } from '../constants/hostConfig';
import { UserDetailsUtil } from '../utils/UserDetailsUtil';
import QuestionsReceiver from '../apis/QuestionsReceiver';
import ChannelReceiver from '../apis/ChannelReceiver';
import { HiOutlineAcademicCap, HiOutlineSparkles } from 'react-icons/hi';
import { BsPencilSquare, BsCollectionPlay, BsFileEarmarkText } from 'react-icons/bs';
import {
    AiOutlinePlayCircle,
    AiOutlineFileText,
    AiOutlineArrowRight,
    AiOutlineCheck,
    AiOutlineLineChart,
    AiOutlineTags,
} from 'react-icons/ai';

// The front door. Every other page renders data; this one has to land an idea in
// about eight seconds: teaching already scaled to the whole internet, testing
// never did, and this is where that gap gets closed.
//
// Two deliberate departures from the rest of the app:
//
//  1. Width. Content pages use layout.container (1800px) because they carry two
//     300px ad rails. A landing page with no rails at that width has prose
//     running the full monitor with a 32px gutter, which reads as unfinished.
//     This page uses layout.marketing (1152px) so there is real space either
//     side. The header keeps its own full width, so the two are intentionally
//     different and that is fine.
//  2. No ad rails. This is the marketing surface, not a content surface.
//
// The sample question in the hero is written by hand on purpose. The real
// question bank is licensed third-party content and robots.txt deliberately
// keeps it out of search indexes, so shipping a real one onto the most
// crawlable page on the site would undercut that.

// Section eyebrow. Written out rather than `typography.label + ' text-primary-600'`
// because typography.label already sets text-gray-500, and with Tailwind's
// `important: true` config both colours compile to !important — which one wins is
// then decided by stylesheet order, not by the order they appear in className.
const EYEBROW = 'text-xs font-semibold text-primary-600 uppercase tracking-wide';

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
            return (Math.floor(count / 100) / 10) + 'k';
        }
        return String(count);
    }

    // ---------------------------------------------------------------- hero

    getSampleQuestionCard = () => {
        const options = [
            { label: 'A', text: '8' },
            { label: 'B', text: '11' },
            { label: 'C', text: '13', correct: true },
            { label: 'D', text: '16' },
        ];
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <span className={typography.caption + ' ml-2'}>Mathematics &middot; Functions</span>
                </div>
                <div className="p-5">
                    <div className="text-base font-medium text-gray-900">
                        If <span className="font-semibold">f(x) = 2x + 3</span>, what is <span className="font-semibold">f(f(1))</span>?
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                        {options.map((option) => (
                            <div
                                key={option.label}
                                className={
                                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ' +
                                    (option.correct
                                        ? 'border-success-200 bg-success-50 text-success-700 font-semibold'
                                        : 'border-gray-200 text-gray-600')
                                }
                            >
                                <span
                                    className={
                                        'shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold ' +
                                        (option.correct
                                            ? 'bg-success-600 text-white'
                                            : 'bg-gray-100 text-gray-500')
                                    }
                                >
                                    {option.correct ? <AiOutlineCheck size={14} /> : option.label}
                                </span>
                                {option.text}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className={typography.caption}>68% answered correctly</span>
                        <span className="text-xs font-semibold text-primary-600">View solution</span>
                    </div>
                </div>
            </div>
        );
    }

    getHeroSection = () => {
        return (
            <div className="bg-gradient-to-b from-primary-50 via-white to-white border-b border-gray-200">
                <div className={layout.marketing + ' py-16 md:py-24'}>
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        <div className="lg:col-span-7">
                            <Badge variant="warning">Beta &middot; free while we build</Badge>
                            <h1 className="mt-5 text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-gray-900 leading-[1.06]">
                                The classroom moved online.
                                <span className="text-primary-600"> The exam room never did.</span>
                            </h1>
                            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                                Teaching scaled to the entire internet. Testing didn't. A teacher can
                                reach ten thousand students and still have no idea which ten understood.
                                EducationalBridge is where educators publish real practice, and students
                                get an honest answer to <span className="text-gray-900 font-medium">&ldquo;do I actually know this?&rdquo;</span>
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    onClick={() => this.goTo('questions')}
                                >
                                    Start practicing &mdash; free
                                    <AiOutlineArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    onClick={() => this.goTo('question/upsert')}
                                >
                                    <BsPencilSquare size={16} />
                                    Publish a question
                                </button>
                            </div>
                            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                                    <AiOutlineCheck size={15} className="text-success-600" />
                                    No account needed to browse
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                                    <AiOutlineCheck size={15} className="text-success-600" />
                                    {this.formatCount(this.state.totalQuestions)} questions live
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                                    <AiOutlineCheck size={15} className="text-success-600" />
                                    Every subject, starting with JEE
                                </span>
                            </div>
                        </div>
                        <div className="lg:col-span-5">
                            {this.getSampleQuestionCard()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------ the thesis

    getThesisSection = () => {
        const points = [
            {
                heading: 'Content already travels',
                body: 'A student in a village can learn from a teacher on another continent, for free, today. That problem is solved.',
            },
            {
                heading: 'Evaluation doesn\u2019t',
                body: 'Lectures scale to millions. Marking a paper still happens one student at a time, which means most learning goes unmeasured.',
            },
            {
                heading: 'Practice closes the loop',
                body: 'Understanding is built by attempting, getting it wrong, and seeing why. That is the half of learning we are building for.',
            },
        ];
        return (
            <div className={layout.marketing + ' py-16 md:py-20'}>
                <div className="max-w-3xl">
                    <div className={EYEBROW}>Why this exists</div>
                    <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        Learning has two halves. The internet only scaled one of them.
                    </h2>
                </div>
                <div className="mt-12 grid md:grid-cols-3 gap-x-8 gap-y-10">
                    {points.map((point, index) => (
                        <div key={index}>
                            <div className="text-5xl font-extrabold text-primary-100 leading-none">
                                {'0' + (index + 1)}
                            </div>
                            <div className="mt-3 text-lg font-semibold text-gray-900">{point.heading}</div>
                            <div className="mt-2 text-base text-gray-600 leading-relaxed">{point.body}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------- how it works

    getAudienceColumn = (config) => {
        return (
            <div className={'rounded-2xl border p-7 md:p-8 ' + config.shellClass}>
                <div className="flex items-center gap-3">
                    <div className={'w-11 h-11 rounded-xl flex items-center justify-center ' + config.iconClass}>
                        {config.icon}
                    </div>
                    <div>
                        <div className="text-xl font-bold text-gray-900">{config.title}</div>
                        <div className={typography.caption}>{config.audience}</div>
                    </div>
                </div>
                <div className="mt-7 flex flex-col gap-6">
                    {config.steps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                            <div className={'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ' + config.stepClass}>
                                {index + 1}
                            </div>
                            <div>
                                <div className="text-base font-semibold text-gray-900">{step.title}</div>
                                <div className="mt-1 text-sm text-gray-600 leading-relaxed">{step.body}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className={'mt-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors ' + config.linkClass}
                    onClick={() => this.goTo(config.ctaPath)}
                >
                    {config.ctaLabel}
                    <AiOutlineArrowRight size={15} />
                </button>
            </div>
        );
    }

    getHowItWorksSection = () => {
        return (
            <div className="bg-gray-50 border-y border-gray-200">
                <div className={layout.marketing + ' py-16 md:py-20'}>
                    <div className="max-w-3xl">
                        <div className={EYEBROW}>How it works</div>
                        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                            One platform, two jobs to do.
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                            The people who make practice material and the people who need it are on the
                            same platform, which is exactly why the feedback loop works.
                        </p>
                    </div>
                    <div className="mt-12 grid lg:grid-cols-2 gap-6">
                        {this.getAudienceColumn({
                            title: 'If you teach',
                            audience: 'Teachers, mentors, institutes, toppers',
                            icon: <BsPencilSquare size={20} />,
                            shellClass: 'bg-white border-gray-200',
                            iconClass: 'bg-primary-600 text-white',
                            stepClass: 'bg-primary-100 text-primary-700',
                            linkClass: 'text-primary-600 hover:text-primary-700',
                            ctaLabel: 'Author your first question',
                            ctaPath: 'question/upsert',
                            steps: [
                                { title: 'Write it properly', body: 'A real editor with maths typesetting, worked solutions, and tagging \u2014 not LaTeX wrestled into a comment box.' },
                                { title: 'Build full papers', body: 'Bundle questions into timed, sectioned papers with your own marking scheme, negative marking included.' },
                                { title: 'Give it a home', body: 'Publish into a channel so everything you make sits in one place, discoverable by subject and topic.' },
                                { title: 'See what actually landed', body: 'Attempt counts, per-option accuracy, and votes show you which questions teach and which just confuse.' },
                            ],
                        })}
                        {this.getAudienceColumn({
                            title: 'If you\u2019re studying',
                            audience: 'Students and exam aspirants',
                            icon: <HiOutlineAcademicCap size={22} />,
                            shellClass: 'bg-white border-gray-200',
                            iconClass: 'bg-success-600 text-white',
                            stepClass: 'bg-success-100 text-success-700',
                            linkClass: 'text-success-700 hover:text-success-600',
                            ctaLabel: 'Find something to solve',
                            ctaPath: 'questions',
                            steps: [
                                { title: 'Narrow it down', body: 'Filter by subject, chapter, exam, year, or difficulty \u2014 or just type what you\u2019re stuck on.' },
                                { title: 'Solve on your schedule', body: 'One question when you have five minutes. A full timed paper when you have three hours.' },
                                { title: 'Understand the miss', body: 'Correct option, full explanation, and how everyone else answered \u2014 so a wrong answer teaches you something.' },
                                { title: 'Watch the line move', body: 'Your solved history and accuracy over time turn progress into a number instead of a feeling.' },
                            ],
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------- channels

    getChannelsSection = () => {
        if (this.state.channels.length === 0) {
            return null;
        }
        return (
            <div className={layout.marketing + ' py-16 md:py-20'}>
                <div className="flex items-end justify-between flex-wrap gap-4">
                    <div className="max-w-2xl">
                        <div className={EYEBROW}>Browse by channel</div>
                        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                            Channels keep it organised.
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                            A channel is a creator&rsquo;s shelf: everything they&rsquo;ve published on a
                            subject, in one place. Follow the subject, not the algorithm.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        onClick={() => this.goTo('channels')}
                    >
                        All channels
                        <AiOutlineArrowRight size={15} />
                    </button>
                </div>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {this.state.channels.slice(0, 6).map((channel) => (
                        <button
                            key={channel.id}
                            type="button"
                            className="group text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            onClick={() => this.goTo('questions?channel_id=' + channel.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    <HiOutlineAcademicCap size={20} />
                                </div>
                                <AiOutlineArrowRight
                                    size={16}
                                    className="text-gray-300 group-hover:text-primary-600 transition-colors"
                                />
                            </div>
                            <div className="mt-4 text-base font-semibold text-gray-900">
                                {channel.channelName}
                            </div>
                            <div className={typography.caption + ' mt-1'}>Questions &amp; papers</div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------- directory

    getDirectorySection = () => {
        const isLoggedIn = UserDetailsUtil.getUserGoogleId() != null;
        const entries = [
            { icon: <AiOutlineFileText size={20} />, title: 'Questions', body: 'Every published question, filterable by tag and channel.', path: 'questions' },
            { icon: <BsFileEarmarkText size={19} />, title: 'Papers', body: 'Full-length timed papers with sections and marking schemes.', path: 'papers' },
            { icon: <BsCollectionPlay size={19} />, title: 'Channels', body: 'Browse creators and subjects rather than individual questions.', path: 'channels' },
            { icon: <AiOutlineLineChart size={20} />, title: 'My progress', body: isLoggedIn ? 'Everything you\u2019ve solved, with accuracy over time.' : 'Sign in to keep a history of what you\u2019ve solved.', path: 'questions/instances/me' },
            { icon: <BsPencilSquare size={18} />, title: 'Create', body: 'Author a question, build a paper, or start a channel.', path: 'question/upsert' },
            { icon: <AiOutlineTags size={20} />, title: 'Tags', body: 'Add the subject, topic, or exam labels others browse by.', path: 'tags/new' },
        ];
        return (
            <div className="bg-gray-50 border-y border-gray-200">
                <div className={layout.marketing + ' py-16 md:py-20'}>
                    <div className="max-w-2xl">
                        <div className={EYEBROW}>Everything, in one place</div>
                        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                            Jump straight in.
                        </h2>
                    </div>
                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entries.map((entry, index) => (
                            <button
                                key={index}
                                type="button"
                                className="group text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                onClick={() => this.goTo(entry.path)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        {entry.icon}
                                    </div>
                                    <div className="text-base font-semibold text-gray-900">{entry.title}</div>
                                </div>
                                <div className="mt-3 text-sm text-gray-600 leading-relaxed">{entry.body}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------- roadmap

    getRoadmapSection = () => {
        const items = [
            {
                icon: <AiOutlineFileText size={20} />,
                title: 'Practice questions & papers',
                status: 'Live',
                statusVariant: 'success',
                body: 'Thousands of real previous-year JEE Main questions and full-length papers, tagged by subject, chapter, year, and difficulty.',
            },
            {
                icon: <HiOutlineSparkles size={20} />,
                title: 'Notes',
                status: 'Next',
                statusVariant: 'warning',
                body: 'Written explanations published alongside questions, so a learner can read the concept and immediately test it in the same place.',
            },
            {
                icon: <AiOutlinePlayCircle size={20} />,
                title: 'Video lessons',
                status: 'Planned',
                statusVariant: 'gray',
                body: 'Short explanations attached to channels and individual questions \u2014 the watching half, finally sitting next to the practising half.',
            },
        ];
        return (
            <div className={layout.marketing + ' py-16 md:py-20'}>
                <div className="max-w-3xl">
                    <div className={EYEBROW}>Where this is going</div>
                    <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                        JEE is the first subject, not the whole plan.
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                        We started with JEE Main because the need is sharpest and the material is
                        hardest to practise well. Nothing about the platform is exam-specific &mdash;
                        the same creator, channel, and learner model works for any subject anyone
                        wants to teach.
                    </p>
                </div>
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={
                                'rounded-2xl border p-6 ' +
                                (index === 0 ? 'bg-white border-success-200' : 'bg-white border-gray-200')
                            }
                        >
                            <div className="flex items-center justify-between">
                                <div
                                    className={
                                        'w-10 h-10 rounded-lg flex items-center justify-center ' +
                                        (index === 0 ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500')
                                    }
                                >
                                    {item.icon}
                                </div>
                                <Badge variant={item.statusVariant}>{item.status}</Badge>
                            </div>
                            <div className="mt-4 text-lg font-semibold text-gray-900">{item.title}</div>
                            <div className="mt-2 text-sm text-gray-600 leading-relaxed">{item.body}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --------------------------------------------------------- closing CTA

    getFinalCtaSection = () => {
        const isLoggedIn = UserDetailsUtil.getUserGoogleId() != null;
        return (
            <div className="bg-gray-900">
                <div className={layout.marketing + ' py-16 md:py-20'}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                                {isLoggedIn
                                    ? 'Pick up where you left off.'
                                    : 'Find out what you actually know.'}
                            </h2>
                            <p className="mt-4 text-lg text-gray-300 leading-relaxed">
                                {isLoggedIn
                                    ? 'Keep practising, or publish something the next student will need.'
                                    : 'Browse for free, no sign-up. Sign in with Google when you want your progress kept \u2014 or publish your own questions and help someone else along.'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
                                onClick={() => this.goTo('questions')}
                            >
                                Start practicing
                                <AiOutlineArrowRight size={18} />
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-400"
                                onClick={() => this.goTo('question/upsert')}
                            >
                                Publish content
                            </button>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap items-center gap-x-8 gap-y-3">
                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                            onClick={() => this.goTo('aboutus')}
                        >
                            About EducationalBridge
                        </button>
                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                            onClick={() => this.goTo('channels')}
                        >
                            Channels
                        </button>
                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                            onClick={() => this.goTo('questions')}
                        >
                            Questions
                        </button>
                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                            onClick={() => this.goTo('papers')}
                        >
                            Papers
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
                {this.getThesisSection()}
                {this.getHowItWorksSection()}
                {this.getChannelsSection()}
                {this.getDirectorySection()}
                {this.getRoadmapSection()}
                {this.getFinalCtaSection()}
            </div>
        );
    }
}

export default connect(() => ({}))(Home);
