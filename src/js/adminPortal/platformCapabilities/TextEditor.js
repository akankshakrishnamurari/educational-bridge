import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { generalTextSize } from '../../../constants/TextSizeConstants';
import {JSXUtils} from "../../../utils/JSXUtils";


// NOTE: We use editor from source (not a build)!

const editorConfiguration = {
    toolbar: {
        items: [
            'heading', '|',
            'alignment', '|',
            'bold', 'italic', 'strikethrough', 'underline', 'subscript', 'superscript', '|',
            'link', '|',
            'ChemType', 'MathType' |
            'bulletedList', 'numberedList', 'todoList',
            // '-', // break point
            'fontfamily', 'fontsize', 'fontColor', 'fontBackgroundColor', '|',
            'code', 'codeBlock', '|',
            'insertTable', '|',
            'outdent', 'indent', '|',
            'uploadImage', 'blockQuote', '|',
            'undo', 'redo',
            'ckfinder'
        ],
        shouldNotGroupWhenFull: true
    }
};


class TextEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
        this.flipRichTextNeed = this.flipRichTextNeed.bind(this);
        this.flipSideBySideViewNeed = this.flipSideBySideViewNeed.bind(this);
    }

    componentDidMount(){
        this.setState(
            {
                documentLoaded:true,
                isRichTextNeeded:true,
                isSideBySideViewNeeded: false
            }
        );
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

    getEditorConfigurations = () => {
        return <div className='flex flex-row bg-white py-1 justify-center rounded-xl'>
            <div>
                {this.state.isRichTextNeeded
                    ?<input type='checkbox' checked onClick={this.flipRichTextNeed}/>
                    :<input type='checkbox' onClick={this.flipRichTextNeed}/>
                }
            </div>
            <div className={generalTextSize + " pl-1 pr-4"}>
                Rich Text
            </div>
            <div>
                {this.state.isSideBySideViewNeeded
                    ?<input type='checkbox' checked onClick={this.flipSideBySideViewNeed}/>
                    :<input type='checkbox' onClick={this.flipSideBySideViewNeed}/>
                }
            </div>
            <div className={generalTextSize + " pl-1 pr-4"}>
                Side Preview
            </div>
        </div>
    }
    render() {
        if(this.props.defaultEditor=="simple-text") {
            this.setState(
                {
                    documentLoaded:true,
                    isRichTextNeeded:false,
                    isSideBySideViewNeeded: false
                }
            );
        }
        return (
            <div className="">
                {this.state.isRichTextNeeded ?this.getRichTextEditorJSX() : this.simpleTextEditorJSX()}
            </div>
        );
    }

}

export default TextEditor;
