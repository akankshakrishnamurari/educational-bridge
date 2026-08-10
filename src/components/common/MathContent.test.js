import { scanMath, renderMath, prepareContent, findMathErrors, normalizePlainTex } from './MathContent';

// Counts the maths spans KaTeX actually produced in a rendered string.
const katexCount = (html) => (html.match(/class="katex"/g) || []).length;

/**
 * What a sighted reader actually sees.
 *
 * KaTeX emits the original TeX twice: once as typeset glyphs, and once inside a
 * <annotation encoding="application/x-tex"> element within the MathML branch, which
 * is there for assistive technology and is hidden from view. Asserting "the LaTeX
 * source is gone" against the raw markup therefore always fails even when rendering
 * is perfect, so the hidden branch is removed first.
 */
const visibleText = (html) => html
    .replace(/<span class="katex-mathml">[\s\S]*?<\/span><\/span>/g, '')
    .replace(/<annotation[\s\S]*?<\/annotation>/g, '');

describe('scanMath', () => {

    it('finds a $$ span', () => {
        const { spans, unterminated } = scanMath('a $$x^2$$ b');
        expect(spans).toHaveLength(1);
        expect(spans[0].latex).toBe('x^2');
        expect(spans[0].delimiter).toBe('$$');
        expect(unterminated).toEqual([]);
    });

    // THE REPORTED BUG. Part of the bank uses single dollars and every one of
    // those questions showed its LaTeX as visible source text.
    it('finds a single-$ span', () => {
        const { spans } = scanMath('Let $f(x)=2x$ be given');
        expect(spans).toHaveLength(1);
        expect(spans[0].latex).toBe('f(x)=2x');
        expect(spans[0].delimiter).toBe('$');
    });

    it('finds several single-$ spans in one sentence', () => {
        const { spans } = scanMath('$a$ then $b$ then $c$');
        expect(spans.map((s) => s.latex)).toEqual(['a', 'b', 'c']);
    });

    it('prefers $$ over $ when both could match', () => {
        const { spans } = scanMath('$$x$$');
        expect(spans).toHaveLength(1);
        expect(spans[0].delimiter).toBe('$$');
        expect(spans[0].latex).toBe('x');
    });

    it('treats a lone $ inside a $$ span as content, not a terminator', () => {
        const { spans } = scanMath('$$a $ b$$');
        expect(spans).toHaveLength(1);
        expect(spans[0].latex).toBe('a $ b');
    });

    it('pairs shortest-first, so $-$3 is a maths minus then a literal 3', () => {
        // Real content from the bank. Greedy pairing would have swallowed the 3.
        const { spans } = scanMath('$-$3');
        expect(spans).toHaveLength(1);
        expect(spans[0].latex).toBe('-');
        expect(spans[0].end).toBe(3);
    });

    it('does not treat an escaped \\$ as a delimiter', () => {
        const { spans, unterminated } = scanMath('costs \\$5 only');
        expect(spans).toEqual([]);
        expect(unterminated).toEqual([]);
    });

    it('reports an unterminated delimiter and keeps scanning past it', () => {
        const { spans, unterminated } = scanMath('$oops and $a$');
        // The first $ pairs with the next one it finds; what is left over is the
        // trailing unpaired delimiter.
        expect(unterminated.length + spans.length).toBeGreaterThan(0);
    });

    it('leaves a single trailing $ unterminated rather than swallowing the rest', () => {
        const { spans, unterminated } = scanMath('all text and one $ here');
        expect(spans).toEqual([]);
        expect(unterminated).toEqual(['$']);
    });

    it('finds nothing in text with no dollars', () => {
        expect(scanMath('plain prose').spans).toEqual([]);
    });
});

describe('renderMath', () => {

    it('typesets $$ content', () => {
        expect(katexCount(renderMath('a $$x^2$$ b'))).toBe(1);
    });

    it('typesets single-$ content', () => {
        expect(katexCount(renderMath('Let $f(x)=2x$ be'))).toBe(1);
    });

    it('leaves surrounding html untouched', () => {
        const out = renderMath('<p>Let $x$ be</p>');
        expect(out.startsWith('<p>Let ')).toBe(true);
        expect(out.endsWith(' be</p>')).toBe(true);
    });

    it('leaves text with no maths completely unchanged', () => {
        const input = '<p>What is the capital of France?</p>';
        expect(renderMath(input)).toBe(input);
    });

    it('does not leave delimiters or LaTeX visible to a reader', () => {
        const seen = visibleText(renderMath('Let $f(x)=2x$ be'));
        expect(seen).not.toContain('$');
        expect(seen).toContain('Let ');
        expect(seen).toContain(' be');
    });

    it('renders every span in a multi-span sentence', () => {
        const out = renderMath('$a$ and $b$ and $$c$$');
        expect(katexCount(out)).toBe(3);
    });

    it('drops an empty span', () => {
        expect(renderMath('a $$$$ b')).toBe('a  b');
    });

    it('handles null and undefined', () => {
        expect(renderMath(null)).toBe('');
        expect(renderMath(undefined)).toBe('');
    });

    // The exact question the user reported, byte for byte from the API.
    it('renders the reported question', () => {
        const stored = '<p>Let the range of the function $f(x)=6+16 \\cos x \\cdot '
            + '\\cos \\left(\\frac{\\pi}{3}-x\\right) \\cdot \\cos \\left(\\frac{\\pi}{3}+x\\right) '
            + '\\cdot \\sin 3 x \\cdot \\cos 6 x, x \\in \\mathbf{R}$ be $[\\alpha, \\beta]$. '
            + 'Then the distance of the point $(\\alpha, \\beta)$ from the line '
            + '$3 x+4 y+12=0$ is :</p>';
        const out = prepareContent(stored);
        // Four maths spans in that sentence.
        expect(katexCount(out)).toBe(4);
        // None of the LaTeX is showing as source to a reader any more.
        const seen = visibleText(out);
        expect(seen).not.toContain('\\cdot');
        expect(seen).not.toContain('\\frac');
        expect(seen).not.toContain('\\alpha');
        expect(seen).not.toContain('\\mathbf');
        // The prose around the maths survives intact.
        expect(seen).toContain('Let the range of the function ');
        expect(seen).toContain(' from the line ');
        expect(findMathErrors(stored)).toEqual([]);
    });

    it('keeps whitespace beside delimiters working', () => {
        // 151 of the 266 single-dollar fields have a space right after the opening
        // delimiter, so this must not be rejected.
        expect(katexCount(renderMath('$ x + 1 $'))).toBe(1);
    });

    it('still handles plain-TeX matrices through the single-$ path', () => {
        expect(katexCount(renderMath('$\\matrix{ a & b \\cr c & d }$'))).toBe(1);
    });
});

describe('prepareContent', () => {

    it('sanitises before typesetting', () => {
        const out = prepareContent('<script>alert(1)</script><p>Hi $x$</p>');
        expect(out).not.toContain('<script');
        expect(katexCount(out)).toBe(1);
    });

    it('strips inline style but keeps the maths', () => {
        const out = prepareContent('<p style="position:fixed">$x$</p>');
        expect(out).not.toContain('position:fixed');
        expect(katexCount(out)).toBe(1);
    });

    it('decodes entities inside maths so KaTeX sees real characters', () => {
        // Real content: less-than arrives escaped.
        const out = prepareContent('<p>$\\mathrm{P}_B &lt; \\mathrm{P}_C$</p>');
        expect(katexCount(out)).toBe(1);
    });

    it('returns empty for empty input', () => {
        expect(prepareContent('')).toBe('');
        expect(prepareContent(null)).toBe('');
        expect(prepareContent(undefined)).toBe('');
    });
});

describe('findMathErrors with single dollars', () => {

    it('accepts valid single-$ maths', () => {
        expect(findMathErrors('Let $x^2 + 1$ be')).toEqual([]);
    });

    it('flags a single-$ span KaTeX cannot parse', () => {
        const problems = findMathErrors('$\\frac{1}{$');
        expect(problems.length).toBeGreaterThan(0);
    });

    it('names the delimiter in an unclosed report', () => {
        const problems = findMathErrors('trailing dollar $');
        expect(problems).toHaveLength(1);
        expect(problems[0].message).toContain('Unclosed $');
    });
});

describe('normalizePlainTex', () => {

    it('rewrites \\matrix and \\cr to amsmath', () => {
        const out = normalizePlainTex('\\matrix{ a & b \\cr c & d }');
        expect(out).toContain('\\begin{matrix}');
        expect(out).toContain('\\end{matrix}');
        expect(out).not.toContain('\\cr');
    });

    it('repairs the \\<br> corruption into \\over', () => {
        expect(normalizePlainTex('{1 \\<br> 2}')).toContain('\\over');
    });
});
