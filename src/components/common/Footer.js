import React from 'react';
import { currentURLHost } from '../../constants/hostConfig';
import { layout } from '../../constants/designTokens';

// Site footer.
//
// The app had none at all: every page simply stopped at its last card, which is
// one of the clearest signals that a site is unfinished. A footer also gives the
// secondary routes somewhere to live — authoring, channels and the personal
// dashboards were previously reachable only from the header dropdown.
//
// WHAT IS DELIBERATELY NOT HERE
// -----------------------------
// No "Privacy Policy" or "Terms of Service" links. Those pages do not exist, and
// a footer link to a 404 is worse than an absent link — particularly for a site
// aimed at minors, where a dead privacy link is actively misleading. They should
// be added here once the documents exist.
//
// The columns list only routes that are actually registered in src/route.js.

const NAV = [
    {
        heading: 'Practise',
        links: [
            { label: 'Question bank', href: 'questions' },
            { label: 'Practice papers', href: 'papers' },
            { label: 'Channels', href: 'channels' },
        ],
    },
    {
        heading: 'Your progress',
        links: [
            { label: 'Your questions', href: 'questions/instances/me' },
            { label: 'Your papers', href: 'papers/instances/me' },
        ],
    },
    {
        heading: 'Contribute',
        links: [
            { label: 'Write a question', href: 'question/upsert' },
            { label: 'Build a paper', href: 'paper/new' },
            { label: 'Create a channel', href: 'channel/new' },
        ],
    },
];

const Footer = () => (
    <footer className="bg-white border-t border-gray-200 mt-12">
        <div className={layout.container + ' py-12'}>
            <div className="grid gap-10 md:grid-cols-12">
                <div className="md:col-span-4">
                    <a
                        href={currentURLHost}
                        className="inline-flex items-center gap-2 text-lg tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
                    >
                        <img src="/logo.svg" alt="" className="h-8 w-auto" />
                        <span className="whitespace-nowrap">
                            <span className="font-normal">Educational</span>
                            <span className="font-extrabold text-primary-600">Bridge</span>
                        </span>
                    </a>
                    <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
                        A free, non-profit question bank and practice platform for competitive
                        exam preparation. No paywall, and no plan to add one.
                    </p>
                </div>

                {NAV.map((group) => (
                    <nav key={group.heading} className="md:col-span-2" aria-label={group.heading}>
                        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                            {group.heading}
                        </h2>
                        <ul className="mt-3 flex flex-col gap-2">
                            {group.links.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={currentURLHost + link.href}
                                        className="text-sm text-gray-500 hover:text-primary-700 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}

                <nav className="md:col-span-2" aria-label="About">
                    <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                        About
                    </h2>
                    <ul className="mt-3 flex flex-col gap-2">
                        <li>
                            <a
                                href={currentURLHost + 'aboutus'}
                                className="text-sm text-gray-500 hover:text-primary-700 transition-colors"
                            >
                                About us
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://github.com/akankshakrishnamurari/educational-bridge"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-sm text-gray-500 hover:text-primary-700 transition-colors"
                            >
                                Source code
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-gray-400">
                    {/* Derived, not hardcoded, so it does not silently go stale. */}
                    &copy; {new Date().getFullYear()} EducationalBridge. Run as a non-profit effort.
                </p>
                <p className="text-xs text-gray-400">
                    Built and maintained by volunteers.
                </p>
            </div>
        </div>
    </footer>
);

export default Footer;
