import React from 'react';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

// Shared renderer for question bodies, options, solutions and comments.
//
// Question content is HTML with LaTeX embedded in $$...$$ delimiters, e.g.
//   "Let $$A$$ be a square matrix ... $${A^{ - 1}}$$ exists"
// Note the source uses $$ for INLINE maths, not display maths, so it is rendered
// with displayMode:false — otherwise every fragment would break onto its own
// centred line mid-sentence.
//
// Replaces the old JSXUtils.htmlDecode path, which returned only the first child
// node of the parsed HTML and therefore silently dropped everything after the
// first <br>.

const ENTITIES = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
};

// LaTeX inside $$...$$ arrives HTML-escaped (e.g. "\pi &lt; \alpha"). KaTeX needs
// the real characters, so entities are decoded before handing it the source.
const decodeEntities = (text) =>
    text.replace(/&(lt|gt|amp|quot|apos|nbsp|#39);/g, (m) => ENTITIES[m] || m);

const MATH = /\$\$([\s\S]*?)\$\$/g;

/**
 * Replace `\command{...}` with `open...close`, honouring nested braces.
 */
const replaceBraceCommand = (src, command, open, close) => {
    const token = `\\${command}{`;
    let out = '';
    let i = 0;
    while (i < src.length) {
        const idx = src.indexOf(token, i);
        if (idx === -1) {
            out += src.slice(i);
            break;
        }
        out += src.slice(i, idx);
        let depth = 1;
        let j = idx + token.length;
        while (j < src.length) {
            if (src[j] === '{') {
                depth += 1;
            } else if (src[j] === '}') {
                depth -= 1;
                if (depth === 0) {
                    break;
                }
            }
            j += 1;
        }
        const body = src.slice(idx + token.length, j);
        out += open + replaceBraceCommand(body, command, open, close) + close;
        i = j + 1;
    }
    return out;
};

/**
 * The source LaTeX is plain-TeX flavoured (it came out of a MathJax-era system):
 * matrices use `\matrix{ a & b \cr c & d }` and alignments use `\eqalign{...}`,
 * neither of which KaTeX supports. Rewrite them to the amsmath environments
 * KaTeX does understand. Without this, matrix questions render as raw source.
 */
export const normalizePlainTex = (latex) => {
    let out = latex;
    // Source corruption: an HTML-ification step somewhere turned `\over` into
    // `\<br>` inside a handful of expressions. Repair before parsing.
    if (out.indexOf('\\<br') !== -1) {
        out = out.replace(/\\<br\s*\/?>/g, ' \\over ');
    }
    if (out.indexOf('\\matrix{') !== -1) {
        out = replaceBraceCommand(out, 'matrix', '\\begin{matrix}', '\\end{matrix}');
    }
    if (out.indexOf('\\eqalign{') !== -1) {
        out = replaceBraceCommand(out, 'eqalign', '\\begin{aligned}', '\\end{aligned}');
    }
    if (out.indexOf('\\cr') !== -1) {
        out = out.replace(/\\cr\s*/g, ' \\\\ ');
    }
    // A trailing row separator before \end{...} is a syntax error in amsmath.
    out = out.replace(/\\\\\s*(\\end\{(?:matrix|aligned)\})/g, '$1');
    return out;
};

/**
 * Render every $$...$$ span with KaTeX, leaving surrounding HTML untouched.
 * Malformed LaTeX renders as-is rather than throwing — the source is scraped and
 * not guaranteed to be valid.
 */
export const renderMath = (html) => {
    if (!html || html.indexOf('$$') === -1) {
        return html || '';
    }
    return html.replace(MATH, (match, latex) => {
        const source = normalizePlainTex(decodeEntities(latex)).trim();
        if (!source) {
            return '';
        }
        try {
            return katex.renderToString(source, {
                displayMode: false,
                throwOnError: false,
                errorColor: '#B91C1C',
                strict: false,
                trust: false,
            });
        } catch (err) {
            // Fall back to the original delimited text so content is never lost.
            return match;
        }
    });
};

/**
 * Report the `$$...$$` spans KaTeX cannot parse.
 *
 * This lives beside renderMath deliberately. The authoring editor shows these
 * messages to whoever is writing the question, and the only useful guarantee is
 * that a span reported as fine here is a span that will typeset when a student
 * loads it. Duplicating the decode/normalise chain in the editor would let the
 * two drift, and the failure mode of drift is silent: an author is told their
 * formula is valid and it renders as red source text in the exam.
 *
 * `throwOnError` is flipped on here — the opposite of renderMath, which must never
 * throw because the imported bank is not guaranteed to be valid. Reporting is the
 * one place where a parse failure is the information wanted.
 *
 * @returns {Array<{latex: string, message: string}>}
 */
export const findMathErrors = (html) => {
    if (!html || html.indexOf('$$') === -1) {
        return [];
    }
    const problems = [];

    // MATH is non-greedy, so an odd number of delimiters leaves the last one
    // unpaired and it renders as a literal "$$" rather than as maths. That looks
    // like a rendering bug from the author's side, so name it.
    const delimiters = html.split('$$').length - 1;
    if (delimiters % 2 !== 0) {
        problems.push({
            latex: '',
            message: 'Unclosed $$ — maths must open and close with a pair of $$.',
        });
    }

    let match;
    // A fresh RegExp because MATH is module-level and stateful with /g.
    const scanner = new RegExp(MATH.source, 'g');
    while ((match = scanner.exec(html)) !== null) {
        const source = normalizePlainTex(decodeEntities(match[1])).trim();
        if (!source) {
            problems.push({ latex: match[0], message: 'Empty formula.' });
            continue;
        }
        try {
            katex.renderToString(source, {
                displayMode: false,
                throwOnError: true,
                strict: false,
                trust: false,
            });
        } catch (err) {
            problems.push({
                latex: source,
                // KaTeX prefixes its own messages with "KaTeX parse error: ".
                message: String((err && err.message) || 'Could not be typeset.')
                    .replace(/^KaTeX parse error:\s*/, ''),
            });
        }
    }
    return problems;
};

/**
 * Sanitize then typeset. Sanitising first means KaTeX output (which we generate
 * ourselves and trust) is not stripped by the sanitiser.
 */
export const prepareContent = (html) => {
    if (html === null || html === undefined || html === '') {
        return '';
    }
    const raw = typeof html === 'string' ? html : String(html);
    // Question content legitimately contains <img> diagrams, tables and sup/sub.
    //
    // NOTE ON `style`
    // ---------------
    // `style` used to be on the allowlist. DOMPurify does strip javascript: and
    // expression() out of a style attribute, so it was not a script-execution hole
    // — but this same function renders user-submitted comments and replies, and an
    // arbitrary style attribute is enough to lift an element out of the document
    // flow and cover the page with it:
    //
    //   <span style="position:fixed;inset:0;z-index:9999">
    //
    // That is a clickjacking primitive: whatever the visitor clicks next goes to
    // the attacker's element rather than the control they aimed at. Nothing in the
    // imported question bank needs inline style to render correctly (the maths goes
    // through KaTeX, which emits its own classed markup), so the attribute is gone
    // rather than filtered.
    //
    // FORBID_ATTR/FORBID_TAGS are kept as belt-and-braces. With ALLOWED_ATTR set,
    // DOMPurify already drops every attribute not on the allowlist, so the entries
    // below are redundant by construction — they are retained only so that the
    // intent survives if someone later widens the allowlist.
    const clean = DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: [
            'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's',
            'sup', 'sub', 'ul', 'ol', 'li', 'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'td', 'th', 'pre', 'code',
            'h1', 'h2', 'h3', 'h4', 'blockquote',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'class', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|data:image\/)/i,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
    });
    return renderMath(clean);
};

/**
 * @param {string} html   raw content from the API
 * @param {string} as     wrapper element, defaults to div
 */
const MathContent = ({ html, as: Tag = 'div', className = '', ...rest }) => (
    <Tag
        className={`math-content ${className}`}
        dangerouslySetInnerHTML={{ __html: prepareContent(html) }}
        {...rest}
    />
);

export default MathContent;
