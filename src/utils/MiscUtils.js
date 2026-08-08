// Pure helpers, no JSX, so React is not imported. It used to be.

export class MiscUtils {

    // Random (v4-shaped) identifier. `&` already binds tighter than `|`, so the
    // added parentheses change nothing at runtime — they just make the intent
    // ((r & 0x3) | 0x8) explicit, which is what pins the variant bits.
    static generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Width at which the app switches to the compact header. Matches Tailwind's
     * `md` breakpoint, so the header switches on the same boundary the page
     * content below it already uses.
     */
    static SMALL_SCREEN_MAX_WIDTH = 767;

    /**
     * True when the viewport is narrow enough to need the compact layout.
     *
     * This used to test `navigator.userAgent` against a device-name pattern, which
     * answers a different question ("is this a phone-branded device?") and answers
     * it badly: an iPad in landscape at 1024px was treated as a small screen, a
     * desktop window dragged down to 380px was not, and neither verdict changed
     * when the window did. Viewport width is the thing actually being asked about.
     */
    static isUserOnSmallScreen = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        if (typeof window.matchMedia === 'function') {
            return window.matchMedia('(max-width: ' + MiscUtils.SMALL_SCREEN_MAX_WIDTH + 'px)').matches;
        }
        return window.innerWidth <= MiscUtils.SMALL_SCREEN_MAX_WIDTH;
    }
}
