import React from 'react';

// Standard white surface card used across pages instead of ad hoc borders/backgrounds.
// `hoverable` adds a shadow lift for clickable rows/cards (e.g. question list rows).

const PageCard = ({ className = '', hoverable = false, padding = 'p-4 md:p-6', children, ...rest }) => {
    const classes = [
        'bg-white rounded-xl shadow-sm border border-gray-100',
        hoverable ? 'hover:shadow-md transition-shadow cursor-pointer' : '',
        padding,
        className,
    ].filter(Boolean).join(' ');
    return <div className={classes} {...rest}>{children}</div>;
};

export default PageCard;
