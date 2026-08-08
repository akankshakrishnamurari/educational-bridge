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
 * Sanitize then typeset. Sanitising first means KaTeX output (which we generate
 * ourselves and trust) is not stripped by the sanitiser.
 */
export const prepareContent = (html) => {
    if (html === null || html === undefined || html === '') {
        return '';
    }
    const raw = typeof html === 'string' ? html : String(html);
    // Question content legitimately contains <img> diagrams, tables and sup/sub.
    const clean = DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: [
            'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's',
            'sup', 'sub', 'ul', 'ol', 'li', 'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'td', 'th', 'pre', 'code',
            'h1', 'h2', 'h3', 'h4', 'blockquote',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'style', 'class', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|data:image\/)/i,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
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
