import React from 'react';
import EducationalBridgeHeader from '../../js/header/EducationalBridgeHeader';
import { currentURLHost } from '../../constants/hostConfig';

// Shell for a single-purpose creation form.
//
// Every authoring form previously hand-rolled its own page: its own max width, its
// own padding, its own heading treatment, no back link, and no explanation of what
// the thing being created is for. Contributors are the supply side of this
// platform, so the authoring surfaces deserve the same care as the learner ones --
// a form that does not explain itself gets abandoned or filled in wrongly.
//
// `backTo` / `backLabel` give every form an exit that is not the browser button.

const FormPage = ({
    title,
    description = null,
    backTo = null,
    backLabel = 'Back',
    width = 'max-w-2xl',
    children,
    footer = null,
}) => (
    <div className="bg-gray-50 min-h-screen">
        <EducationalBridgeHeader/>
        <div className={['mx-auto px-4 sm:px-6 py-6 md:py-10', width].join(' ')}>
            {backTo &&
                <a
                    href={backTo.startsWith('http') ? backTo : currentURLHost + backTo}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                >
                    <span aria-hidden="true">&larr;</span>
                    {backLabel}
                </a>
            }
            <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                {title}
            </h1>
            {description &&
                <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-prose">
                    {description}
                </p>
            }
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                {children}
            </div>
            {footer &&
                <div className="mt-4">{footer}</div>
            }
        </div>
    </div>
);

export default FormPage;
