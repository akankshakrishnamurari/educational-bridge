import React from 'react';
import '../App.css';
import { SocialIcon } from 'react-social-icons';
import EducationalBridgeHeader from './header/EducationalBridgeHeader';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { typography, layout } from '../constants/designTokens';
import { currentURLHost } from '../constants/hostConfig';
import { contributors } from '../constants/contributors';

// About page.
//
// WHY THIS WAS REWRITTEN RATHER THAN RESTYLED
// -------------------------------------------
// The previous copy was inherited from the project's earlier incarnation and had
// drifted badly out of step with the home page:
//
//   * "From the founder" described a different person entirely -- a 2018 NIT Patna
//     graduate from a village in Bihar, linking to a personal LinkedIn profile --
//     while the home page and src/constants/contributors.js name Akanksha Kumari
//     as founder and lead. A visitor moving between the two pages was told two
//     different stories about who runs this.
//   * The founder "portrait" was <img src="./../../../correct_sign.png">, i.e. a
//     tick icon, behind a relative path that resolves nowhere from this route.
//   * The positioning was a generic "peer to peer platform" illustrated with
//     learning English in Spain and German in India, rather than the competitive
//     exam preparation the product and its content actually address.
//   * It published a personal mobile number, a WhatsApp number and a full
//     residential street address.
//
// People now come from contributors.js -- the same source the home page reads --
// so the two can no longer disagree about the team. The removed phone numbers and
// postal address are deliberately not replaced with invented ones.

class AboutUs extends React.Component {

    getHeroJSX = () => (
        <div className="bg-white border-b border-gray-200">
            <div className={layout.marketing + ' py-14 md:py-20'}>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                        About us
                    </span>
                    <Badge variant="warning">Beta &middot; non-profit</Badge>
                </div>
                <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                    Preparation shouldn&rsquo;t depend on what you can pay.
                </h1>
                <p className="mt-5 text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl">
                    In India, serious exam preparation is largely sold. Question banks, mock tests,
                    timed papers and any kind of performance analysis sit behind coaching fees.
                    Students who cannot pay them compete against students who can, on the same
                    paper, on the same day. EducationalBridge exists to close that specific gap.
                </p>
            </div>
        </div>
    )

    getMissionJSX = () => (
        <div className="bg-primary-600">
            <div className={layout.marketing + ' py-14 md:py-20'}>
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                    <div className="lg:col-span-7">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-semibold uppercase tracking-wide">
                            Not for profit
                        </span>
                        <h2 className="mt-5 text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                            Free, and staying that way.
                        </h2>
                        <p className="mt-5 text-base md:text-lg text-primary-50 leading-relaxed">
                            This is run as a non-profit effort, not a business. No paywall on practice,
                            no subscription to see a solution, and no plan to add one later. The
                            students who need it most are the least able to pay for it, so charging
                            them would defeat the point.
                        </p>
                    </div>
                    <div className="lg:col-span-5 flex flex-col gap-3">
                        {[
                            { title: 'No paywall', body: 'Every question, paper and solution is free, signed in or not.' },
                            { title: 'Built around day jobs', body: 'Everyone here contributes in their own time. Nobody draws a salary from it.' },
                            { title: 'Open to contributors', body: 'Any teacher can publish. The bank grows because people give material away.' },
                        ].map((item) => (
                            <div key={item.title} className="rounded-xl bg-primary-700 p-4">
                                <div className="text-base font-semibold text-white">{item.title}</div>
                                <div className="mt-1 text-sm text-primary-100 leading-relaxed">{item.body}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    getWhatWeDoJSX = () => (
        <div className={layout.marketing + ' py-14 md:py-20'}>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                What we are building
            </span>
            <h2 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                A place to practise, and a place to publish.
            </h2>
            <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
                    <h3 className={typography.h3}>For students</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                        A question bank tagged by subject, chapter, topic and difficulty, so you can
                        drill exactly what is weak instead of working front to back. Worked solutions
                        where the source provides them, timed papers, and a report afterwards that
                        shows which topics cost you marks and where your time went.
                    </p>
                    <a
                        href={currentURLHost + 'questions'}
                        className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                        Start practising
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
                    <h3 className={typography.h3}>For teachers</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                        Author questions with full mathematical notation, group them into channels,
                        and assemble them into timed papers. Anything you publish is available to
                        every student on the platform, and you keep the credit for it.
                    </p>
                    <a
                        href={currentURLHost + 'question/upsert'}
                        className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                        Contribute a question
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>
            <p className="mt-6 text-sm text-gray-500 leading-relaxed max-w-3xl">
                Engineering entrance preparation is where we started, because it is the most
                content-dense and quality-sensitive place to begin. The same engine serves medical
                entrance, state-level exams and government recruitment as the question bank grows.
                Notes and video lessons are next.
            </p>
        </div>
    )

    /**
     * People, read from the shared contributors constant. Keeping this page and the
     * home page on one source is the entire reason the founder attribution can no
     * longer disagree between them.
     */
    getTeamJSX = () => {
        const lead = contributors.find((person) => person.lead) || contributors[0];
        const others = contributors.filter((person) => person !== lead);
        if (lead === undefined) {
            return <div />;
        }
        return (
            <div className="bg-white border-y border-gray-200">
                <div className={layout.marketing + ' py-14 md:py-20'}>
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                        The people behind it
                    </span>
                    <h2 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                        Built in spare hours by people who needed it.
                    </h2>

                    <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-7">
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                            <Avatar src={lead.image} name={lead.name} size="xl" />
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
                                <p className="text-sm font-semibold text-primary-700">{lead.role}</p>
                                {lead.headline &&
                                    <p className="mt-1 text-sm text-gray-600">{lead.headline}</p>
                                }
                                {lead.credentials &&
                                    <p className="text-xs text-gray-500">{lead.credentials}</p>
                                }
                                {lead.bio &&
                                    <p className="mt-3 text-sm text-gray-700 leading-relaxed">{lead.bio}</p>
                                }
                            </div>
                        </div>
                    </div>

                    {others.length > 0 &&
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            {others.map((person) => (
                                <div key={person.name} className="rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-start gap-3.5">
                                        <Avatar src={person.image} name={person.name} size="md" />
                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-gray-900">{person.name}</h3>
                                            <p className="text-sm font-semibold text-primary-700">{person.role}</p>
                                            {person.headline &&
                                                <p className="mt-1 text-xs text-gray-600">{person.headline}</p>
                                            }
                                        </div>
                                    </div>
                                    {person.bio &&
                                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{person.bio}</p>
                                    }
                                    {Array.isArray(person.links) && person.links.length > 0 &&
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {person.links.map((link) => (
                                                <a
                                                    key={link.url}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                                >
                                                    {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    }
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        );
    }

    /**
     * Contact. The previous version listed two personal phone numbers and a
     * residential street address; those are not reproduced here. Email is the only
     * channel stated, because it is the only one that can be answered without
     * publishing somebody's home.
     */
    getContactJSX = () => (
        <div className={layout.marketing + ' py-14 md:py-20'}>
            <div className="rounded-2xl bg-gray-900 p-7 md:p-10">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                    Get in touch
                </h2>
                <p className="mt-3 text-base text-gray-300 leading-relaxed max-w-2xl">
                    If you teach and want to publish here, spot a mistake in a question, or want to
                    help with the platform itself, we would like to hear from you.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => { window.location.href = 'mailto:akankshakrishnamurari2025@gmail.com'; }}
                    >
                        Email us
                    </Button>
                    <a
                        href={currentURLHost + 'questions'}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-200 hover:text-white"
                    >
                        Browse the question bank
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                    <SocialIcon
                        url="https://github.com/akankshakrishnamurari/educational-bridge"
                        style={{ height: 32, width: 32 }}
                        target="_blank"
                        rel="noreferrer noopener"
                    />
                </div>
            </div>
        </div>
    )

    render() {
        return <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader/>
            {/* Marketing width, matching the home page, rather than the 1800px
                content shell used by the list pages. This page is prose. */}
            {this.getHeroJSX()}
            {this.getWhatWeDoJSX()}
            {this.getMissionJSX()}
            {this.getTeamJSX()}
            {this.getContactJSX()}
        </div>
    }

}

export default AboutUs;
