import React from 'react';
import EducationalBridgeHeader from './header/EducationalBridgeHeader';
import Footer from '../components/common/Footer';
import Button from '../components/common/Button';
import { currentURLHost } from '../constants/hostConfig';
import { layout } from '../constants/designTokens';

// Not-found page.
//
// There was no catch-all route, so any unmatched path rendered the header, an
// empty <Routes> outlet and nothing else — a blank page with no explanation and no
// way back. That is what a visitor saw for any mistyped URL, and also for every
// stale link from outside the site.
//
// Amplify's SPA rewrite rule serves index.html with a 200 for non-asset paths, so
// this page is reached client-side rather than by an HTTP 404. That means the
// status code is technically 200; the honest thing available at this layer is to
// tell the person plainly and give them somewhere to go.

const SUGGESTIONS = [
    { label: 'Question bank', href: 'questions', description: 'Practise by subject, chapter or difficulty' },
    { label: 'Practice papers', href: 'papers', description: 'Full-length timed papers' },
    { label: 'Channels', href: 'channels', description: 'Questions grouped by course or creator' },
];

const NotFound = () => (
    <div className="bg-gray-50 min-h-screen flex flex-col">
        <EducationalBridgeHeader />
        <div className={layout.reading + ' py-16 md:py-24 flex-1'}>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                Page not found
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                We couldn&rsquo;t find that page.
            </h1>
            <p className="mt-4 text-base text-gray-600 leading-relaxed">
                The link may be out of date, or the address might have a typo in it.
                Nothing is broken on your end.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => { window.location.href = currentURLHost; }}
                >
                    Go to the home page
                </Button>
                <a
                    href={currentURLHost + 'questions'}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                    Or start practising
                    <span aria-hidden="true">&rarr;</span>
                </a>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">
                    You might be looking for
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                    {SUGGESTIONS.map((item) => (
                        <li key={item.href}>
                            <a
                                href={currentURLHost + item.href}
                                className="group flex items-baseline gap-2 rounded-lg -mx-2 px-2 py-1.5 hover:bg-white transition-colors"
                            >
                                <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                                    {item.label}
                                </span>
                                <span className="text-xs text-gray-500">{item.description}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        <Footer />
    </div>
);

export default NotFound;
