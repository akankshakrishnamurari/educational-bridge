import React from 'react';
import MathContent, { findMathErrors } from './MathContent';

// A maths-aware editor for question bodies, options and solutions.
//
// WHY THIS EXISTS RATHER THAN A THIRD-PARTY WYSIWYG
// ------------------------------------------------
// The stored format for every question in this bank is HTML with LaTeX between
// `$$` delimiters, typeset by KaTeX at read time (see MathContent.js). That is
// what the importer writes and what the student's browser renders.
//
// A general-purpose WYSIWYG has no idea about the `$$` convention, which produced
// three concrete problems on the authoring page:
//
//  1. Maths was invisible while writing. The author typed `$$\frac{a}{b}$$` into
//     a rich-text box that showed it as literal text, and only found out whether
//     it parsed after saving and reloading the question.
//  2. The toolbar promised fidelity it did not have. Its `forecolor`/`backcolor`
//     buttons emit `style="color:..."`, and `style` is not on the render-side
//     sanitiser's allowlist (it is a clickjacking vector on the comment surface).
//     So those two buttons silently did nothing to the published question — the
//     definition of a WYSIWYG that lies.
//  3. It was fetched from a vendor cloud with a domain-locked key inlined in the
//     bundle. That is a hard dependency on an external host for the ability to
//     author content, and a key that has to be reissued whenever the site's
//     domain changes.
//
// So the editor here writes the storage format directly and previews it through
// the *same* module the student's page uses. The preview is not an approximation
// of the result; it is the result. KaTeX and DOMPurify are already bundled for
// rendering, so this adds no dependency.
//
// The trade-off, stated plainly: the author sees markup, not styled text. For a
// maths question bank that is the better trade — the hard part of writing these
// questions is the formulae, not the bold runs — and every formatting action that
// survives sanitisation is on the toolbar, so the markup rarely needs typing.

// Only tags and attributes that survive MathContent's sanitiser are offered.
// Anything else would be a control that appears to work and then vanishes on
// publish, which is the exact failure this component was built to remove.
const INLINE_ACTIONS = [
    { key: 'bold', label: 'B', title: 'Bold  (Ctrl/Cmd+B)', tag: 'strong', className: 'font-bold' },
    { key: 'italic', label: 'I', title: 'Italic  (Ctrl/Cmd+I)', tag: 'em', className: 'italic' },
    { key: 'underline', label: 'U', title: 'Underline  (Ctrl/Cmd+U)', tag: 'u', className: 'underline' },
    { key: 'sup', label: 'x²', title: 'Superscript', tag: 'sup' },
    { key: 'sub', label: 'x₂', title: 'Subscript', tag: 'sub' },
];

// Grouped so an author can find a symbol by what it is for rather than scrolling
// one long strip. `$` marks where the caret should land after insertion.
export const MATH_PALETTE = [
    {
        group: 'Structure',
        items: [
            { label: '\\frac{a}{b}', insert: '\\frac{$}{}', hint: 'Fraction' },
            { label: 'x^{n}', insert: 'x^{$}', hint: 'Power' },
            { label: 'x_{n}', insert: 'x_{$}', hint: 'Subscript' },
            { label: '\\sqrt{x}', insert: '\\sqrt{$}', hint: 'Square root' },
            { label: '\\sqrt[n]{x}', insert: '\\sqrt[$]{}', hint: 'nth root' },
            { label: '\\left( \\right)', insert: '\\left( $ \\right)', hint: 'Sized brackets' },
        ],
    },
    {
        group: 'Greek',
        items: [
            { label: '\\alpha', insert: '\\alpha' },
            { label: '\\beta', insert: '\\beta' },
            { label: '\\gamma', insert: '\\gamma' },
            { label: '\\theta', insert: '\\theta' },
            { label: '\\lambda', insert: '\\lambda' },
            { label: '\\mu', insert: '\\mu' },
            { label: '\\pi', insert: '\\pi' },
            { label: '\\phi', insert: '\\phi' },
            { label: '\\omega', insert: '\\omega' },
            { label: '\\Delta', insert: '\\Delta' },
            { label: '\\Omega', insert: '\\Omega' },
        ],
    },
    {
        group: 'Relations',
        items: [
            { label: '\\times', insert: '\\times' },
            { label: '\\div', insert: '\\div' },
            { label: '\\pm', insert: '\\pm' },
            { label: '\\leq', insert: '\\leq' },
            { label: '\\geq', insert: '\\geq' },
            { label: '\\neq', insert: '\\neq' },
            { label: '\\approx', insert: '\\approx' },
            { label: '\\propto', insert: '\\propto' },
            { label: '\\infty', insert: '\\infty' },
            { label: '90^\\circ', insert: '^\\circ', hint: 'Degrees' },
        ],
    },
    {
        group: 'Calculus',
        items: [
            { label: '\\int', insert: '\\int_{$}^{} \\, dx', hint: 'Definite integral' },
            { label: '\\oint', insert: '\\oint' },
            { label: '\\sum', insert: '\\sum_{$}^{}', hint: 'Summation' },
            { label: '\\prod', insert: '\\prod_{$}^{}', hint: 'Product' },
            { label: '\\lim', insert: '\\lim_{$ \\to }', hint: 'Limit' },
            { label: '\\frac{d}{dx}', insert: '\\frac{d}{dx}', hint: 'Derivative' },
            { label: '\\partial', insert: '\\partial' },
            { label: '\\nabla', insert: '\\nabla' },
        ],
    },
    {
        group: 'Sets & logic',
        items: [
            { label: '\\in', insert: '\\in' },
            { label: '\\notin', insert: '\\notin' },
            { label: '\\subset', insert: '\\subset' },
            { label: '\\cup', insert: '\\cup' },
            { label: '\\cap', insert: '\\cap' },
            { label: '\\forall', insert: '\\forall' },
            { label: '\\exists', insert: '\\exists' },
            { label: '\\Rightarrow', insert: '\\Rightarrow' },
            { label: '\\Leftrightarrow', insert: '\\Leftrightarrow' },
        ],
    },
    {
        group: 'Vectors & matrices',
        items: [
            { label: '\\vec{a}', insert: '\\vec{$}', hint: 'Vector' },
            { label: '\\hat{i}', insert: '\\hat{$}', hint: 'Unit vector' },
            { label: '\\overline{AB}', insert: '\\overline{$}' },
            {
                label: '\\begin{matrix} a & b \\\\ c & d \\end{matrix}',
                insert: '\\begin{matrix} $ & \\\\ & \\end{matrix}',
                hint: '2x2 matrix',
            },
            {
                label: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
                insert: '\\begin{bmatrix} $ & \\\\ & \\end{bmatrix}',
                hint: 'Bracketed matrix',
            },
            {
                label: '\\begin{cases} x & \\\\ y & \\end{cases}',
                insert: '\\begin{cases} $ & \\text{if } \\\\ & \\text{otherwise} \\end{cases}',
                hint: 'Piecewise',
            },
        ],
    },
];

// Base64 images are inlined into the question document, so a large upload is
// carried in every API response that returns the question. 512 KB of source is
// roughly 700 KB of base64 — past that the author gets told rather than finding
// out from a slow question list.
const IMAGE_WARN_BYTES = 512 * 1024;

const CARET = '$';

const toolbarButton =
    'inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-md border border-gray-200 ' +
    'bg-white text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors ' +
    'text-xs font-medium';

class MathEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // The palette is opt-in: it is tall, and an author editing prose does
            // not need it on screen. Opening it is one click and it stays open for
            // the session of that editor instance.
            isPaletteOpen: false,
            activeGroup: MATH_PALETTE[0].group,
            imageNotice: '',
        };
        this.textareaRef = React.createRef();
        this.fileInputRef = React.createRef();
        // Where to put the caret once the parent's re-render has landed. The
        // component is controlled, so the DOM value does not change on the same
        // tick as the edit and the selection has to be reapplied afterwards.
        this.pendingSelection = null;
    }

    componentDidUpdate() {
        if (this.pendingSelection === null) {
            return;
        }
        const { start, end } = this.pendingSelection;
        this.pendingSelection = null;
        const node = this.textareaRef.current;
        if (!node) {
            return;
        }
        node.focus();
        node.setSelectionRange(start, end);
    }

    value = () => {
        const { value } = this.props;
        return typeof value === 'string' ? value : '';
    };

    /**
     * Replace the current selection (or insert at the caret) and say where the
     * caret should end up. Every mutation goes through here so there is one place
     * that understands the controlled-component timing.
     */
    replaceSelection = (text, caretOffsetFromStart) => {
        const node = this.textareaRef.current;
        const current = this.value();
        // Falling back to the end of the document matters: the palette can be
        // clicked before the textarea has ever been focused, and selectionStart is
        // 0 on an unfocused field in some browsers, which would silently prepend.
        const hasFocus = node && document.activeElement === node;
        const start = hasFocus ? node.selectionStart : current.length;
        const end = hasFocus ? node.selectionEnd : current.length;

        const next = current.slice(0, start) + text + current.slice(end);
        const caret = start + (caretOffsetFromStart === undefined ? text.length : caretOffsetFromStart);
        this.pendingSelection = { start: caret, end: caret };
        this.props.onChange(next);
    };

    selectedText = () => {
        const node = this.textareaRef.current;
        if (!node || document.activeElement !== node) {
            return '';
        }
        return this.value().slice(node.selectionStart, node.selectionEnd);
    };

    wrapInTag = (tag) => {
        const selection = this.selectedText();
        const open = `<${tag}>`;
        const close = `</${tag}>`;
        if (selection) {
            // Keep the wrapped text selected so a second click can unwrap-by-retyping
            // or another tag can be layered on.
            const node = this.textareaRef.current;
            const start = node.selectionStart;
            const next = `${open}${selection}${close}`;
            this.pendingSelection = {
                start: start + open.length,
                end: start + open.length + selection.length,
            };
            const current = this.value();
            this.props.onChange(current.slice(0, start) + next + current.slice(node.selectionEnd));
            return;
        }
        this.replaceSelection(open + close, open.length);
    };

    insertBlock = (text) => {
        this.replaceSelection(text);
    };

    insertList = (ordered) => {
        const tag = ordered ? 'ol' : 'ul';
        const body = `<${tag}>\n  <li></li>\n  <li></li>\n</${tag}>\n`;
        // Caret inside the first <li>.
        this.replaceSelection(body, body.indexOf('</li>'));
    };

    /**
     * Wrap the selection in `$$`, or drop an empty pair with the caret inside.
     * Selecting `x^2` and pressing the maths button is the common path when
     * pasting from a source document.
     */
    insertMathDelimiters = () => {
        const selection = this.selectedText();
        if (selection) {
            const node = this.textareaRef.current;
            const start = node.selectionStart;
            const current = this.value();
            const next = `$$${selection}$$`;
            this.pendingSelection = { start: start + 2, end: start + 2 + selection.length };
            this.props.onChange(current.slice(0, start) + next + current.slice(node.selectionEnd));
            return;
        }
        this.replaceSelection('$$$$', 2);
    };

    /**
     * Insert a palette snippet. If the caret already sits inside a `$$...$$` span
     * the bare LaTeX goes in; otherwise it is wrapped, so a symbol button never
     * produces LaTeX stranded outside maths delimiters (which renders as source).
     */
    insertMathSnippet = (snippet) => {
        const caretTarget = snippet.indexOf(CARET);
        const latex = caretTarget === -1 ? snippet : snippet.replace(CARET, '');

        if (this.isCaretInsideMath()) {
            this.replaceSelection(latex, caretTarget === -1 ? undefined : caretTarget);
            return;
        }
        const wrapped = `$$${latex}$$`;
        this.replaceSelection(wrapped, caretTarget === -1 ? wrapped.length : 2 + caretTarget);
    };

    /**
     * True when the caret is between an opening and closing `$$`. Counting
     * delimiters before the caret is enough: an odd count means one is still open.
     */
    isCaretInsideMath = () => {
        const node = this.textareaRef.current;
        if (!node || document.activeElement !== node) {
            return false;
        }
        const before = this.value().slice(0, node.selectionStart);
        return (before.split('$$').length - 1) % 2 === 1;
    };

    handleKeyDown = (event) => {
        if (!(event.metaKey || event.ctrlKey) || event.altKey) {
            return;
        }
        const key = event.key.toLowerCase();
        const shortcuts = { b: 'strong', i: 'em', u: 'u' };
        if (shortcuts[key]) {
            event.preventDefault();
            this.wrapInTag(shortcuts[key]);
            return;
        }
        if (key === 'm') {
            event.preventDefault();
            this.insertMathDelimiters();
        }
    };

    handleImagePicked = (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        // Reset immediately so picking the same file twice in a row still fires a
        // change event.
        input.value = '';
        if (!file) {
            return;
        }
        if (!/^image\//.test(file.type)) {
            this.setState({ imageNotice: 'That file is not an image.' });
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => this.setState({ imageNotice: 'The image could not be read.' });
        reader.onload = () => {
            const dataUri = String(reader.result || '');
            if (!dataUri) {
                this.setState({ imageNotice: 'The image could not be read.' });
                return;
            }
            const notice = file.size > IMAGE_WARN_BYTES
                ? `Inserted, but ${Math.round(file.size / 1024)} KB is large for an inline image — `
                  + 'it travels with the question in every API response. Consider resizing.'
                : '';
            this.setState({ imageNotice: notice });
            const alt = file.name.replace(/\.[^.]+$/, '').replace(/["<>]/g, '');
            this.insertBlock(`<img src="${dataUri}" alt="${alt}" />`);
        };
        reader.readAsDataURL(file);
    };

    renderToolbar = () => (
        <div className="flex flex-wrap items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-200">
            {INLINE_ACTIONS.map((action) => (
                <button
                    key={action.key}
                    type="button"
                    title={action.title}
                    aria-label={action.title}
                    className={`${toolbarButton} ${action.className || ''}`}
                    onClick={() => this.wrapInTag(action.tag)}
                >
                    {action.label}
                </button>
            ))}

            <span className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />

            <button
                type="button"
                title="Bulleted list"
                aria-label="Insert bulleted list"
                className={toolbarButton}
                onClick={() => this.insertList(false)}
            >
                &bull;&#8202;&mdash;
            </button>
            <button
                type="button"
                title="Numbered list"
                aria-label="Insert numbered list"
                className={toolbarButton}
                onClick={() => this.insertList(true)}
            >
                1.&#8202;&mdash;
            </button>
            <button
                type="button"
                title="Line break"
                aria-label="Insert line break"
                className={toolbarButton}
                onClick={() => this.insertBlock('<br />\n')}
            >
                &crarr;
            </button>
            <button
                type="button"
                title="Insert image"
                aria-label="Insert image"
                className={toolbarButton}
                onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
            >
                Image
            </button>

            <span className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />

            <button
                type="button"
                title="Wrap selection in maths delimiters  (Ctrl/Cmd+M)"
                className={`${toolbarButton} font-mono`}
                onClick={this.insertMathDelimiters}
            >
                $$
            </button>
            <button
                type="button"
                aria-expanded={this.state.isPaletteOpen}
                className={
                    this.state.isPaletteOpen
                        ? `${toolbarButton} bg-primary-50 border-primary-200 text-primary-700`
                        : toolbarButton
                }
                onClick={() => this.setState((s) => ({ isPaletteOpen: !s.isPaletteOpen }))}
            >
                {this.state.isPaletteOpen ? 'Hide symbols' : 'Symbols'}
            </button>

            <input
                ref={this.fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={this.handleImagePicked}
                tabIndex={-1}
            />
        </div>
    );

    renderPalette = () => {
        if (!this.state.isPaletteOpen) {
            return null;
        }
        const group = MATH_PALETTE.find((g) => g.group === this.state.activeGroup) || MATH_PALETTE[0];
        return (
            <div className="border-b border-gray-200 bg-white">
                <div className="flex flex-wrap gap-1 px-2 pt-2" role="tablist" aria-label="Symbol groups">
                    {MATH_PALETTE.map((entry) => (
                        <button
                            key={entry.group}
                            type="button"
                            role="tab"
                            aria-selected={entry.group === group.group}
                            className={
                                entry.group === group.group
                                    ? 'px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-600 text-white'
                                    : 'px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100'
                            }
                            onClick={() => this.setState({ activeGroup: entry.group })}
                        >
                            {entry.group}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1.5 px-2 py-2">
                    {group.items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            title={item.hint ? `${item.hint}  —  ${item.label}` : item.label}
                            className="px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-primary-50
                                hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500
                                focus:ring-offset-1 transition-colors"
                            onClick={() => this.insertMathSnippet(item.insert)}
                        >
                            {/* Rendered through the same pipeline as the question, so the
                                palette shows the glyph the student will see rather than a
                                picture of it. */}
                            <MathContent as="span" html={`$$${item.label}$$`} className="text-sm" />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    renderProblems = (problems) => {
        if (problems.length === 0) {
            return null;
        }
        return (
            <div className="px-3 py-2 bg-danger-50 border-t border-danger-200">
                <p className="text-xs font-semibold text-danger-700">
                    {problems.length === 1 ? '1 formula will not typeset' : `${problems.length} formulae will not typeset`}
                </p>
                <ul className="mt-1 space-y-1">
                    {problems.slice(0, 4).map((problem, index) => (
                        <li key={index} className="text-xs text-danger-700">
                            {problem.latex
                                ? <code className="font-mono bg-white px-1 rounded border border-danger-200">{problem.latex}</code>
                                : null}
                            <span className={problem.latex ? 'ml-1.5' : ''}>{problem.message}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    render() {
        const value = this.value();
        const problems = findMathErrors(value);
        const isEmpty = value.trim() === '';

        return (
            <div className="bg-white">
                {this.renderToolbar()}
                {this.renderPalette()}

                <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-200">
                    <div className="w-full lg:w-1/2">
                        <label className="sr-only" htmlFor={this.props.id || 'math-editor-source'}>
                            {this.props.label || 'Content'}
                        </label>
                        <textarea
                            id={this.props.id || 'math-editor-source'}
                            ref={this.textareaRef}
                            value={value}
                            onChange={(event) => this.props.onChange(event.target.value)}
                            onKeyDown={this.handleKeyDown}
                            spellCheck
                            autoComplete="off"
                            className="w-full px-3 py-3 font-mono text-sm text-gray-800 leading-relaxed
                                resize-y border-0 focus:outline-none focus:ring-0"
                            style={{ minHeight: this.props.minHeight || '14rem' }}
                            placeholder={this.props.placeholder
                                || 'Type the question. Put maths between $$ marks, e.g. $$\\frac{a}{b} = 1$$'}
                        />
                    </div>

                    <div className="w-full lg:w-1/2 bg-gray-50 border-t border-gray-200 lg:border-t-0">
                        <div className="flex items-center justify-between px-3 pt-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Preview
                            </span>
                            {/* Stating this is the point of the pane: it is not an
                                approximation, it is the student's render path. */}
                            <span className="text-xs text-gray-400">exactly as students see it</span>
                        </div>
                        <div
                            className="px-3 py-3 overflow-auto"
                            style={{ minHeight: this.props.minHeight || '14rem' }}
                        >
                            {isEmpty
                                ? <p className="text-sm text-gray-400 italic">Nothing to preview yet.</p>
                                : <MathContent html={value} className="text-sm text-gray-800 leading-relaxed" />}
                        </div>
                    </div>
                </div>

                {this.renderProblems(problems)}
            </div>
        );
    }
}

export default MathEditor;
