import React from "react";
import {generalTextSize} from "./../constants/TextSizeConstants";
import {prepareContent} from "./../components/common/MathContent";

// Small shared JSX helpers.
//
// FIVE HELPERS WERE REMOVED FROM HERE
// -----------------------------------
// `getQuestionRenderingJSX`, `getQuestionOptionRenderingJSX`,
// `showQuestionPagingSection` and `getQuestionNumberView` had no call sites left
// after the question and paper pages were rebuilt on real components. They were
// not merely unused, they were broken:
//
//   - getQuestionNumberView called `this.getRemainingTimeBlock()`, a method that
//     does not exist on this class, so it threw the moment it was rendered.
//   - showQuestionPagingSection drew four exam controls ("Save and Previous",
//     "Clear Response", "Mark For Review", "Save and Next") of which three had no
//     handler at all and the fourth pointed at a method that does not exist here
//     either. The real exam controls live in paperSet/PaperView.
//   - Both, plus the two rendering helpers, nested a <div> inside a <p>, which is
//     invalid HTML that React reports and the browser silently restructures.
//
// Keeping them meant every future reader had to work out which of two paging
// implementations was the live one.

export class JSXUtils {

    /**
     * Small pill used to display a tag name.
     *
     * The rich text goes in a <span>, not a <div> inside a <p>: the previous markup
     * put a block element inside a paragraph, so the browser closed the paragraph
     * early and the pill's padding applied to an empty element. The focus-ring
     * classes were also dropped, because this is not a focusable element and
     * advertising a focus style on one is misleading.
     */
    static getTagViewJSX(optionText) {
        return <span className="inline-flex items-center bg-white rounded text-gray-700 border border-gray-300 px-3">
            <span
                className={generalTextSize}
                dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(optionText)}}
            />
        </span>;
    }

    static buildMCQOptionsPreviewData = (questionOptions, numberOfOptions) => {
        let options = [];
        (questionOptions || []).forEach((option,index)=>{
            if(index>=numberOfOptions) {
                return options;
            }
            options.push(
                {
                    "text" : option.text,
                    "id" : index,
                    "optionId" : option.id
                }
            );
        });
        return options;
    }

    static getNormalisedPreviewOptionId = (options, optionId) => {
        let targetOption = -1;
        (options || []).forEach((option, index)=>{
            if(option.id === optionId) {
                targetOption = index;
            }
        });
        return targetOption;
    }

    /**
     * Prepare API content for dangerouslySetInnerHTML: sanitize, then typeset any
     * $$...$$ LaTeX via KaTeX. See components/common/MathContent.js.
     *
     * The previous implementation returned `e.childNodes[0].nodeValue`, i.e. only
     * the FIRST child node of the parsed markup, which silently discarded
     * everything after the first <br>. It also ran the deprecated unescape() over
     * the input. Both are gone; nothing is truncated now.
     */
    static htmlDecode = (input) => prepareContent(input);

}
