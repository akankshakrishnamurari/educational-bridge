import React from 'react';

// Status/tag pill. `variant` picks the color token; defaults to neutral (used for
// content tags). success/warning/danger map to the same tokens used everywhere else
// (fulfilled question = success, marked-for-review = warning, incorrect = danger).

const variantClasses = {
    neutral: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    danger: 'bg-danger-50 text-danger-700',
    gray: 'bg-gray-100 text-gray-600',
};

const Badge = ({ variant = 'neutral', className = '', children }) => {
    const classes = [
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant] || variantClasses.neutral,
        className,
    ].filter(Boolean).join(' ');
    return <span className={classes}>{children}</span>;
};

export default Badge;
