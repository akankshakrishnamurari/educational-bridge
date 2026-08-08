import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { generalTextSize } from '../../../constants/TextSizeConstants';
import {JSXUtils} from "../../../utils/JSXUtils";


// A leftover CKEditor toolbar config used to sit here. It was never referenced --
// this component renders TinyMCE, whose toolbar is configured inline below -- and
// it contained the expression `'ChemType', 'MathType' | 'bulletedList', ...`, where
// the `|` is a bitwise OR between two strings rather than the intended separator
// string, evaluating to 0. Removed rather than repaired, since nothing read it.


class TextEditor extends React.Component {

    constructor(props) {
        super(props)
        // Initialised here rather than in componentDidMount so the first render
        // already has a mode. Previously state started empty, so the very first
        // render fell through to the plain-textarea branch and then swapped to the
        // rich editor a tick later, remounting TinyMCE for no reason.
        this.state = {
            isRichTextNeeded: props.defaultEditor !== 'simple-text',
            isSideBySideViewNeeded: false,
        };
        this.flipRichTextNeed = this.flipRichTextNeed.bind(this);
        this.flipSideBySideViewNeed = this.flipSideBySideViewNeed.bind(this);
    }

    flipRichTextNeed = () => { 
        let state = {...this.state};
        state.isRichTextNeeded = !state.isRichTextNeeded;
        this.setState(state);
    }

    flipSideBySideViewNeed = () => {
        let state = {...this.state};
        state.isSideBySideViewNeeded = !state.isSideBySideViewNeeded;
        this.setState(state);
    }

    getPreview = () => {
        return <div className='w-full h-full md:w-5/12 px-2 py-2 md:py-4 md:px-4'>
            <div  className = "text-justify w-full h-full bg-gray-100 rounded-xl py-2 px-4 " dangerouslySetInnerHTML={{__html: JSXUtils.htmlDecode(this.props.data)}}></div>
        </div>
    }

    getRichTextEditorJSX = () => {
        let editorRef = this.props.editorRef;
        let editor = <Editor
            apiKey= "mg9hwaubygn0sxbrexswmvulezrt2bmf6djezddmu34w2qx3"
            // onInit={(evt, editor) => editorRef.current = editor}
            value={this.props.data}
            init={{
                height: 300,
                menubar: true,
                branding: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen image',
                    'insertdatetime media table paste code help wordcount'
                ],
                external_plugins: {
                    'tiny_mce_wiris': `https://www.wiris.net/demo/plugins/tiny_mce/plugin.js`,
                },
                toolbar: 'fullscreen undo redo | formatselect | subscript superscript underline | ' +
                'bold italic backcolor forecolor removeformat| alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'tiny_mce_wiris_formulaEditor tiny_mce_wiris_formulaEditorChemistry | image code help',
                draggable_modal: true,
                image_title: true,
                automatic_uploads: true,
                file_picker_types: 'image',
                file_picker_callback: function (cb, value, meta) {
                    var input = document.createElement("input");
                    input.setAttribute("type", "file");
                    input.setAttribute("accept", "image/*");
                    input.onchange = function () {
                        var file = this.files[0];
                        var reader = new FileReader();
                        reader.onload = function () {
                        var id = "blobid" + new Date().getTime();
                        var blobCache = editorRef.current.editorUpload.blobCache;
                        var base64 = reader.result.split(",")[1];
                        var blobInfo = blobCache.create(id, file, base64);
                        blobCache.add(blobInfo);
                        cb(blobInfo.blobUri(), { title: file.name });
                        };
                        reader.readAsDataURL(file);
                    };
                    input.click();
                },
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
            
            onEditorChange = {(data) => this.props.onChange(data)} 
        />
        if(this.state.isSideBySideViewNeeded) {
            return <div className='flex flex-col md:flex-row'>
                <div className='w-full h-full md:w-7/12 px-2 md:py-4 py-2'>
                    {editor}
                    {this.getEditorConfigurations()}
                </div>
                {this.getPreview()}
            </div>
        }
        else {
            return <div>
                {editor}
                {this.getEditorConfigurations()}
            </div>
        }
    }

    simpleTextEditorJSX = () => {
        let editor = <div className='w-full '>
            <textarea id="email" autoComplete="off"
                className={generalTextSize + " w-full rounded-xl px-4 py-4"}
                              placeholder= " Add details "
                              value = {this.props.data}
                              onChange={(event) => this.props.onChange(event.target.value)}
            />
        </div>
        if(this.state.isSideBySideViewNeeded) {
            return <div className='flex flex-col md:flex-row'>
                <div className='w-full md:w-7/12 px-2 md:py-4 py-2'>
                    {editor}
                    {this.getEditorConfigurations()}
                </div>
                {this.getPreview()}
            </div>
        }
        else {
            return <div>
                {editor}
                {this.getEditorConfigurations()}
            </div>
        }
    }

    // Toggles are real labelled checkboxes with onChange. They previously set
    // `checked` with only an onClick handler, which React treats as a controlled
    // input with no way to change -- it warns, and the checkbox fights the user.
    getEditorConfigurations = () => {
        const toggle = 'inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer select-none';
        return <div className='flex flex-row items-center gap-4 bg-white py-1.5 px-2 justify-end rounded-b-lg border-t border-gray-100'>
            <label className={toggle}>
                <input
                    type='checkbox'
                    className='accent-primary-600 w-3.5 h-3.5'
                    checked={this.state.isRichTextNeeded}
                    onChange={this.flipRichTextNeed}
                />
                Rich text
            </label>
            <label className={toggle}>
                <input
                    type='checkbox'
                    className='accent-primary-600 w-3.5 h-3.5'
                    checked={this.state.isSideBySideViewNeeded}
                    onChange={this.flipSideBySideViewNeed}
                />
                Side preview
            </label>
        </div>
    }
    render() {
        // INFINITE LOOP FIXED.
        //
        // This method used to call this.setState() directly whenever
        // `defaultEditor === "simple-text"`. setState during render schedules
        // another render, which calls setState again, without end. The option
        // editor passes exactly that prop, so opening an option for editing put the
        // component into a render loop. The mode is now decided once in the
        // constructor from the same prop.
        return (
            <div>
                {this.state.isRichTextNeeded ? this.getRichTextEditorJSX() : this.simpleTextEditorJSX()}
            </div>
        );
    }

}

export default TextEditor;
