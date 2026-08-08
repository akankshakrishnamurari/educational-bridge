import React from 'react';


// import InlineEditor from '@ckeditor/ckeditor5-editor-inline/src/inlineeditor';
import { CKEditor } from '@ckeditor/ckeditor5-react'

const editorConfiguration = {
    toolbar: {
        items: [
            'heading', '|',
            'alignment', '|',
            'bold', 'italic', 'strikethrough', 'underline', 'subscript', 'superscript', '|',
            'link', '|',
            'bulletedList', 'numberedList', 'todoList',
            // '-', // break point
            'fontfamily', 'fontsize', 'fontColor', 'fontBackgroundColor', '|',
            'code', 'codeBlock', '|',
            'insertTable', '|',
            'outdent', 'indent', '|',
            'uploadImage', 'blockQuote', '|',
            'undo', 'redo'
        ],
        shouldNotGroupWhenFull: true
    }
};


class CustomInlineEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    render() {
        return (
            <div>
                <div id="editor">
                    <p>This is the editor content.</p>
                </div>
                <CKEditor
                    onReady={ editor => {
                        console.log( 'Editor is ready to use!', editor );

                        // Insert the toolbar before the editable area.
                        editor.ui.getEditableElement().parentElement.insertBefore(
                            editor.ui.view.toolbar.element,
                            editor.ui.getEditableElement()
                        );

                        this.editor = editor;
                    } }
                    onError={ ( error, { willEditorRestart } ) => {
                        // If the editor is restarted, the toolbar element will be created once again.
                        // The `onReady` callback will be called again and the new toolbar will be added.
                        // This is why you need to remove the older toolbar.
                        if ( willEditorRestart ) {
                            this.editor.ui.view.toolbar.element.remove();
                        }
                    } }
                    onChange={ ( event, editor ) => console.log( { event, editor } ) }
                    // editor={ InlineEditor }
                    data="<p>Hello from CKEditor 5's decoupled editor!</p>"
                    config={editorConfiguration}
                />
            </div>
        );
    }

}

export default CustomInlineEditor;
