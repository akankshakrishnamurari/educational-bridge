import React from 'react';
import AdSlot from './AdSlot';

// Advertising rail flanking the main content column.
//
// Widths are the standard vertical units, 300px being the widest standard vertical
// size there is (half page / portrait). Anything wider is a custom slot most
// networks will not fill, so 300px is the ceiling here.
//
// Breakpoints are chosen so the rails never squeeze the content column:
//   below xl  hidden entirely (two 300px rails will not fit alongside a usable
//             list on a 1024px viewport)
//   xl        300 x 600  half page
//   2xl       300 x 1050 portrait, taller unit for large displays
//
// Sticky so the unit stays in view while the list scrolls.

const AdRail = ({ className = '', enabled = true, children = null }) => {
    if (!enabled) {
        return null;
    }
    return (
        <aside
            className={'hidden xl:block shrink-0 w-[300px] ' + className}
            aria-label="Advertisement"
        >
            <div className="sticky top-24">
                {/* xl only */}
                <div className="2xl:hidden">
                    <AdSlot size="halfPage">{children}</AdSlot>
                </div>
                {/* 2xl and up */}
                <div className="hidden 2xl:block">
                    <AdSlot size="portrait">{children}</AdSlot>
                </div>
            </div>
        </aside>
    );
};

export default AdRail;
