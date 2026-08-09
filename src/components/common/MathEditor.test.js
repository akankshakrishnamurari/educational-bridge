import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MathEditor, { MATH_PALETTE } from './MathEditor';
import { findMathErrors } from './MathContent';

// A controlled wrapper, because MathEditor is controlled and most of what is worth
// testing is "what did onChange receive" plus "where did the caret land".
class Harness extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: props.initial || '' };
    }
    render() {
        return (
            <MathEditor
                value={this.state.value}
                onChange={(next) => this.setState({ value: next })}
                {...this.props.editorProps}
            />
        );
    }
}

const source = () => screen.getByRole('textbox');

const focusWithCaret = (start, end = start) => {
    const node = source();
    node.focus();
    node.setSelectionRange(start, end);
    return node;
};

describe('findMathErrors', () => {
    it('reports nothing for content without maths', () => {
        expect(findMathErrors('<p>Plain prose</p>')).toEqual([]);
        expect(findMathErrors('')).toEqual([]);
        expect(findMathErrors(null)).toEqual([]);
    });

    it('reports nothing for valid maths', () => {
        expect(findMathErrors('Let $$x^2 + 1$$ be given')).toEqual([]);
    });

    it('flags an unclosed delimiter pair', () => {
        const problems = findMathErrors('Let $$x^2 be given');
        expect(problems).toHaveLength(1);
        expect(problems[0].message).toMatch(/Unclosed/);
    });

    it('flags LaTeX KaTeX cannot parse', () => {
        const problems = findMathErrors('$$\\frac{1}{$$');
        // The unbalanced brace is a parse error; report it with the offending source.
        const parseErrors = problems.filter((p) => p.latex);
        expect(parseErrors.length).toBeGreaterThan(0);
        expect(parseErrors[0].latex).toContain('\\frac');
    });

    it('flags an empty formula', () => {
        const problems = findMathErrors('a $$  $$ b');
        expect(problems).toHaveLength(1);
        expect(problems[0].message).toMatch(/Empty/);
    });

    it('accepts the plain-TeX forms the renderer normalises', () => {
        // \matrix{...\cr...} is rewritten by normalizePlainTex, so the validator must
        // not report it — otherwise authors are told valid bank content is broken.
        expect(findMathErrors('$$\\matrix{ a & b \\cr c & d }$$')).toEqual([]);
    });

    it('reports every bad span, not just the first', () => {
        const problems = findMathErrors('$$\\frac{1}{$$ and $$\\sqrt{$$');
        expect(problems.filter((p) => p.latex).length).toBe(2);
    });
});

describe('MathEditor typing and preview', () => {
    it('passes typed text straight through to onChange', () => {
        const onChange = jest.fn();
        render(<MathEditor value="" onChange={onChange} />);
        fireEvent.change(source(), { target: { value: 'hello' } });
        expect(onChange).toHaveBeenCalledWith('hello');
    });

    it('renders the preview through the student render path', () => {
        render(<Harness initial="Let $$x^2$$ be" />);
        // KaTeX emits .katex markup; its presence proves the preview typeset rather
        // than showing the source.
        expect(document.querySelector('.math-content .katex')).not.toBeNull();
    });

    it('shows a placeholder instead of an empty preview', () => {
        render(<Harness initial="" />);
        expect(screen.getByText(/Nothing to preview yet/i)).toBeInTheDocument();
    });

    it('surfaces a formula that will not typeset', () => {
        render(<Harness initial="$$\\frac{1}{$$" />);
        expect(screen.getByText(/will not typeset/i)).toBeInTheDocument();
    });
});

describe('MathEditor toolbar', () => {
    it('wraps the selection in the chosen tag and keeps it selected', () => {
        render(<Harness initial="make this bold" />);
        focusWithCaret(5, 9); // "this"
        fireEvent.click(screen.getByLabelText(/^Bold/));
        const node = source();
        expect(node.value).toBe('make <strong>this</strong> bold');
        expect(node.value.slice(node.selectionStart, node.selectionEnd)).toBe('this');
    });

    it('inserts an empty tag pair with the caret between them when nothing is selected', () => {
        render(<Harness initial="ab" />);
        focusWithCaret(1);
        fireEvent.click(screen.getByLabelText(/^Italic/));
        const node = source();
        expect(node.value).toBe('a<em></em>b');
        expect(node.selectionStart).toBe('a<em>'.length);
    });

    it('wraps a selection in maths delimiters', () => {
        render(<Harness initial="x^2 is a square" />);
        focusWithCaret(0, 3);
        fireEvent.click(screen.getByTitle(/maths delimiters/i));
        expect(source().value).toBe('$$x^2$$ is a square');
    });

    it('puts the caret inside a new empty maths pair', () => {
        render(<Harness initial="" />);
        focusWithCaret(0);
        fireEvent.click(screen.getByTitle(/maths delimiters/i));
        const node = source();
        expect(node.value).toBe('$$$$');
        expect(node.selectionStart).toBe(2);
    });

    it('appends rather than prepends when the field was never focused', () => {
        // selectionStart is 0 on an unfocused textarea, so an unguarded insert would
        // silently push the snippet to the front of the question.
        render(<Harness initial="Given a triangle " />);
        fireEvent.click(screen.getByTitle(/maths delimiters/i));
        expect(source().value).toBe('Given a triangle $$$$');
    });

    it('inserts a line break as sanitiser-safe markup', () => {
        render(<Harness initial="" />);
        focusWithCaret(0);
        fireEvent.click(screen.getByLabelText(/line break/i));
        expect(source().value).toContain('<br />');
    });

    it('inserts a list with the caret in the first item', () => {
        render(<Harness initial="" />);
        focusWithCaret(0);
        fireEvent.click(screen.getByLabelText(/bulleted list/i));
        const node = source();
        expect(node.value).toContain('<ul>');
        expect(node.value).toContain('<li></li>');
        expect(node.selectionStart).toBe(node.value.indexOf('</li>'));
    });
});

describe('MathEditor symbol palette', () => {
    const openPalette = () => fireEvent.click(screen.getByText('Symbols'));

    it('is closed until asked for', () => {
        render(<Harness initial="" />);
        expect(screen.queryByRole('tablist')).toBeNull();
        openPalette();
        expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('wraps a snippet in delimiters when the caret is outside maths', () => {
        render(<Harness initial="" />);
        openPalette();
        focusWithCaret(0);
        fireEvent.click(screen.getByTitle(/Fraction/));
        // Bare \frac outside $$ would render as literal source, so it must be wrapped.
        expect(source().value).toBe('$$\\frac{}{}$$');
    });

    it('puts the caret in the first argument of the snippet', () => {
        render(<Harness initial="" />);
        openPalette();
        focusWithCaret(0);
        fireEvent.click(screen.getByTitle(/Fraction/));
        const node = source();
        expect(node.selectionStart).toBe('$$\\frac{'.length);
    });

    it('does not double-wrap when the caret is already inside maths', () => {
        render(<Harness initial="$$$$" />);
        openPalette();
        focusWithCaret(2);
        fireEvent.click(screen.getByTitle(/Square root/));
        expect(source().value).toBe('$$\\sqrt{}$$');
    });

    it('switches groups', () => {
        render(<Harness initial="" />);
        openPalette();
        fireEvent.click(screen.getByRole('tab', { name: 'Calculus' }));
        expect(screen.getByTitle(/Definite integral/)).toBeInTheDocument();
    });

    // The palette makes a promise: every button both *shows* real maths and *inserts*
    // maths that will publish. Checked against the table itself rather than through
    // the DOM, so it covers all six groups and not just the visible one.
    describe('every palette entry', () => {
        const entries = MATH_PALETTE.flatMap((group) =>
            group.items.map((item) => [`${group.group}: ${item.hint || item.label}`, item]));

        it.each(entries)('%s has a label that typesets', (_name, item) => {
            expect(findMathErrors(`$$${item.label}$$`)).toEqual([]);
        });

        it.each(entries)('%s inserts maths that typesets', (_name, item) => {
            const latex = item.insert.split('$').join('');
            expect(findMathErrors(`$$${latex}$$`)).toEqual([]);
        });

        it.each(entries)('%s marks the caret at most once', (_name, item) => {
            expect(item.insert.split('$').length - 1).toBeLessThanOrEqual(1);
        });
    });
});

describe('MathEditor keyboard shortcuts', () => {
    it('bolds on Ctrl+B', () => {
        render(<Harness initial="word" />);
        focusWithCaret(0, 4);
        fireEvent.keyDown(source(), { key: 'b', ctrlKey: true });
        expect(source().value).toBe('<strong>word</strong>');
    });

    it('opens a maths pair on Cmd+M', () => {
        render(<Harness initial="" />);
        focusWithCaret(0);
        fireEvent.keyDown(source(), { key: 'm', metaKey: true });
        expect(source().value).toBe('$$$$');
    });

    it('leaves plain typing alone', () => {
        const onChange = jest.fn();
        render(<MathEditor value="" onChange={onChange} />);
        fireEvent.keyDown(source(), { key: 'b' });
        expect(onChange).not.toHaveBeenCalled();
    });
});
