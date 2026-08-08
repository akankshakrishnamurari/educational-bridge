import React from 'react';

// Reserved advertising space.
//
// Sizes are the standard IAB units, and the slot reserves those exact dimensions
// up front. That matters: if the container has no height until the ad script
// injects one, the page visibly jumps when the ad loads (Cumulative Layout
// Shift). Reserving the box now means dropping in a real tag later changes
// nothing about the layout.
//
// To go live, pass the ad markup as children (or render the network's <ins> tag
// here). With no children it renders a neutral placeholder.

export const AD_SIZES = {
    leaderboard:      { w: 728,  h: 90,   label: '728 x 90' },
    mediumRectangle:  { w: 300,  h: 250,  label: '300 x 250' },
    largeRectangle:   { w: 336,  h: 280,  label: '336 x 280' },
    wideSkyscraper:   { w: 160,  h: 600,  label: '160 x 600' },
    halfPage:         { w: 300,  h: 600,  label: '300 x 600' },
    // 300 x 1050 "portrait" is the largest standard vertical unit. Nothing wider
    // than 300px is a standard vertical size, so going beyond it means a custom
    // slot most ad networks will not fill.
    portrait:         { w: 300,  h: 1050, label: '300 x 1050' },
    mobileBanner:     { w: 320,  h: 50,   label: '320 x 50' },
};

const AdSlot = ({
    size = 'mediumRectangle',
    className = '',
    label = 'Advertisement',
    children = null,
}) => {
    const unit = AD_SIZES[size] || AD_SIZES.mediumRectangle;

    // maxWidth (not width) so the slot can shrink on narrow viewports rather than
    // forcing horizontal scroll; height stays fixed to hold the space.
    const style = { maxWidth: unit.w, height: unit.h };

    if (children) {
        return (
            <div className={'mx-auto overflow-hidden ' + className} style={style}>
                {children}
            </div>
        );
    }

    return (
        <div
            className={'mx-auto w-full flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 border border-gray-200 select-none ' + className}
            style={style}
            aria-hidden="true"
        >
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                {label}
            </span>
            <span className="text-[10px] text-gray-300">{unit.label}</span>
        </div>
    );
};

export default AdSlot;
