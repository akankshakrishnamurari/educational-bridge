import React from 'react';
import EducationalBridgeHeader from '../../js/header/EducationalBridgeHeader';
import { layout } from '../../constants/designTokens';

// Standard page wrapper: gray-50 background, header, consistent max-width/padding.
// `fullWidth` opts out of the max-width constraint for layouts that need the
// full viewport (e.g. paper-taking view with a side rail).

const PageContainer = ({ fullWidth = false, className = '', children }) => {
    // layout.container is shared with the header so gutters line up.
    const contentClasses = fullWidth
        ? 'w-full'
        : layout.container + ' py-6';
    return (
        <div className="bg-gray-50 min-h-screen">
            <EducationalBridgeHeader />
            <div className={[contentClasses, className].filter(Boolean).join(' ')}>
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
