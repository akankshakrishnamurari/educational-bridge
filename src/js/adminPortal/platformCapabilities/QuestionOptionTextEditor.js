import React from 'react';


import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
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


class QuestionOptionTextEditor extends React.Component {

    constructor(props) {
        super(props)
        this.state = {};
    }

    render() {
        return (
            <div className="mx-2">
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
                        if ( willEditorRestart ) {
                            this.editor.ui.view.toolbar.element.remove();
                        }
                    } }
                    onChange={ ( event, editor ) => this.props.onChange(event, editor, this.props.index) }
                    editor={ DecoupledEditor }
                    data={this.props.data}
                    config={editorConfiguration}
                />
            </div>
        );
    }

}

export default QuestionOptionTextEditor;
