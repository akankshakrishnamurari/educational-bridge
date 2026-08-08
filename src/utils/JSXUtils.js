import React from "react";
import {generalTextSize} from "./../constants/TextSizeConstants";
import {prepareContent} from "./../components/common/MathContent";

export class JSXUtils {

    static getQuestionRenderingJSX(questionText) {
        return <div>
            <p className="text-xl text-left pl-10 border border-slate-200">
                <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(questionText)}}></div>
            </p>
        </div>;
    }

    static getQuestionOptionRenderingJSX(optionNumber, optionText) {
        return <button className="flex mx-2 my-2 bg-white transition-colors rounded text-gray-700 border border-gray-300 px-6 py-2 text-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <div className="flex flex-row">
                <div>
                    <p className={generalTextSize + " px-2"}>
                        {optionNumber} :
                    </p>
                </div>
                <div>
                    <p className={generalTextSize}>
                        <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(optionText)}}></div>
                    </p>
                </div>
            </div>  
        </button>;
    }

    static getTagViewJSX( optionText) {
        return <div className="flex bg-white transition-colors rounded text-gray-700 border border-gray-300 px-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <p className={generalTextSize}>
                <div dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(optionText)}}></div>
            </p>
        </div>;
    }

    static showQuestionPagingSection = () => {
        return <div>
            <div className="flex items-center justify-center py-10 lg:px-0 sm:px-6 px-4">
                <div className="lg:w-5/5 w-full  flex items-center justify-between border-t border-gray-200">
                    <div className="flex items-center pt-3 text-gray-600 hover:text-primary-700 cursor-pointer">
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.1665 4H12.8332" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"
                                  stroke-linejoin="round"/>
                            <path d="M1.1665 4L4.49984 7.33333" stroke="currentColor" stroke-width="1.25"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M1.1665 4.00002L4.49984 0.666687" stroke="currentColor" stroke-width="1.25"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p className="text-sm ml-3 font-medium leading-none ">
                            <b>Save and Previous</b>
                        </p>
                    </div>
                    <div className="flex items-center pt-3 text-gray-600 hover:text-primary-700 cursor-pointer">
                        <p className="text-sm font-medium leading-none mr-3">
                            <b>Clear Response</b></p>
                    </div>
                    <div className="flex items-center pt-3 text-gray-600 hover:text-primary-700 cursor-pointer" onClick={this.markQuestionForReview}>
                        <p className="text-sm font-medium leading-none mr-3">
                            <b>Mark For Review</b></p>
                    </div>
                    <div className="flex items-center pt-3 text-gray-600 hover:text-primary-700 cursor-pointer">
                        <p className="text-sm font-medium leading-none mr-3">
                            <b>Save and Next</b></p>
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.1665 4H12.8332" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"
                                  stroke-linejoin="round"/>
                            <path d="M9.5 7.33333L12.8333 4" stroke="currentColor" stroke-width="1.25"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9.5 0.666687L12.8333 4.00002" stroke="currentColor" stroke-width="1.25"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>

                    </div>
                </div>
            </div>
        </div>;
    }

    static buildMCQOptionsPreviewData = (questionOptions, numberOfOptions) => {
        let options = [];
        questionOptions.forEach((option,index)=>{
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
        options.forEach((option, index)=>{
            if(option.id === optionId) {
                targetOption = index;
            }
        });
        return targetOption;
    }

    static getQuestionNumberView(questionNumber, color) {
        if(color === undefined) {
            color = "indigo-100";

        }
        return <div className="flex justify-between w-full">
            <div
                className={"flex flex-col lg:flex-row w-full items-start rounded shadow py-2 bg-" + color + " border"+ color}>
                <div className={"flex flex-row w-full  lg:w-12/12 "+  color}>
                    <div className="text-xs sm:text-base md:text-lg xl:text-xl">
                        Question Number : {questionNumber}
                    </div>
                    {this.getRemainingTimeBlock()}
                </div>
            </div>
        </div>;
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