// Shared class strings. Colours here come from the token palette
// (src/constants/palette.js) — avoid Tailwind's default indigo/blue, which was
// left over from the previous theme and does not match the accent.
export const headerTextViewClass = "text-gray-600 hover:text-primary-700 transition-colors sm:text-sm md:text-md lg:text-base xl:text-base text-xs px-2  md:py-4 sm:py-2 py-1 font-medium";
export const headerLoginButtonViewClass = "text-gray-600 hover:text-primary-700 transition-colors sm:text-sm md:text-md lg:text-base xl:text-base text-xs pr-2  md:py-3 sm:py-1 font-medium";
export const headerLoginTextClass = "text-gray-700 text-xs md:text-sm xl:text-base px-2 font-semibold";
// Wordmark sits on a white header now, so it is dark rather than white, and
// capped at a saner size than the old text-4xl.
export const logoTextCSS = "text-gray-900 text-lg sm:text-lg md:text-xl lg:text-2xl xl:text-2xl ";
export const searchBoxCSS = "w-full bg-white xl:h-11 lg:h-10 h-9  w-full rounded-full z-0 focus:outline-none border border-gray-300 focus-within:border-primary-500 transition-colors ";
export const searchBoxInputCSS = "w-full bg-white px-2 text-gray-800 placeholder-gray-400 focus:outline-none ";
export const buttonBesideSearchBoxCSS = "px-2 xl:h-11 lg:h-10 h-9 transition-colors rounded-lg border border-transparent py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 bg-primary-600 hover:bg-primary-700 text-white";
export const clickableSearchTableBodyCellTextCSS = "text-xs md:text-sm xl:text-base text-left text-primary-700 hover:text-primary-800 hover:underline hover:underline-offset-2 text-justify ";
export const nonClickableSearchTableBodyCellTextCSS = "text-xs md:text-sm xl:text-base text-gray-700";
export const generalTextSize = "text-xs sm:text-xs md:text-sm lg:text-base 2xl:text-md ";
export const smallerTextSize = "text-xs md:text-xs lg:text-sm xl:text-base";
export const tableHeaderTextSize = "text-xs sm:text-xs md:text-sm lg:text-base 2xl:text-md ";
export const searchSuggestionTextSize = "text-xs xs:text-xs md:text-md xl:text-lg text-xs ";
export const pagesizeOptionTextSize = "py-1 text-xs lg:text-sm xl:text-md";
export const pagingSelectionButtonStyle = "border border-gray-300 bg-white rounded-lg outline-none";
export const searchTableHeaderCellCSS = generalTextSize + " text-bold ...";
