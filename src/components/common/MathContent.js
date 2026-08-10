import React from 'react';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

// Shared renderer for question bodies, options, solutions and comments.
//
// Question content is HTML with LaTeX embedded in dollar delimiters, e.g.
//   "Let $$A$$ be a square matrix ... $${A^{ - 1}}$$ exists"
// Note the source uses the delimiters for INLINE maths, not display maths, so it
// is rendered with displayMode:false — otherwise every fragment would break onto
// its own centred line mid-sentence.
//
// Replaces the old JSXUtils.htmlDecode path, which returned only the first child
// node of the parsed HTML and therefore silently dropped everything after the
// first <br>.
//
// BOTH $$...$$ AND $...$ ARE SUPPORTED
// ------------------------------------
// This used to match only `$$...$$`, via the regex /\$\$([\s\S]*?)\$\$/g. Part of
// the imported bank is written with SINGLE dollar delimiters instead, and every
// one of those questions rendered its LaTeX as visible source text — e.g.
//
//   Let the range of $f(x)=6+16 \cos x \cdot \cos \left(\frac{\pi}{3}-x\right)...$
//
// appeared on the page exactly like that, backslashes and all. Measured across a
// 5,000-field sample of the live bank: 34.9% use `$$`, 5.3% use single `$` only,
// and 0.2% mix the two. So roughly one field in twenty was unreadable.
//
// WHY THE MATCHING IS A SCANNER AND NOT A REGEX
// ---------------------------------------------
// Three properties of the real content ruled out the obvious regex approaches,
// each verified by measurement rather than assumed:
//
//  * A "no whitespace beside the delimiter" heuristic — the usual way to stop
//    `$5 and $10` becoming maths — cannot be used. 151 of the 266 single-dollar
//    fields have a space directly after the opening `$`, so that rule would have
//    broken more content than it fixed. It is also unnecessary here: there is no
//    currency in the bank. The 17 fields that looked like money on a first pass
//    were all maths (`$-$3` is a math minus followed by a literal 3, `$37.3 \%$`
//    is a percentage).
//  * Maths legitimately contains bare `<` as a less-than operator
//    (`$\mathrm{P}_B<\mathrm{P}_C$`), so the scanner must not try to recognise
//    HTML tags — it would mistake those for markup.
//  * Conversely, no HTML attribute in the bank contains a `$`, so there is nothing
//    for tag-awareness to protect. Both facts point the same way: treat the input
//    as a flat character sequence.
//
// The scanner pairs delimiters left to right, shortest match, with `$$` taking
// precedence over `$`. An unterminated delimiter is left as literal text rather
// than swallowing the rest of the document.

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

/**
 * Locate every maths span in the source.
 *
 * @returns {{spans: Array<{start: number, end: number, latex: string, delimiter: string}>,
 *            unterminated: Array<string>}}
 */
export const scanMath = (source) => {
    const spans = [];
    const unterminated = [];
    let index = 0;

    while (index < source.length) {
        const character = source[index];
        // A backslash escapes whatever follows, so an escaped dollar can neither
        // open nor close a span. Nothing in the bank uses `\$` today, but getting
        // this wrong would turn one stray escape into a document-swallowing span.
        if (character === '\\') {
            index += 2;
            continue;
        }
        if (character !== '$') {
            index += 1;
            continue;
        }

        const delimiter = source[index + 1] === '$' ? '$$' : '$';
        const isDouble = delimiter === '$$';
        const bodyStart = index + delimiter.length;
        let cursor = bodyStart;
        let closeAt = -1;

        while (cursor < source.length) {
            if (source[cursor] === '\\') {
                cursor += 2;
                continue;
            }
            if (source[cursor] === '$') {
                if (isDouble) {
                    if (source[cursor + 1] === '$') {
                        closeAt = cursor;
                        break;
                    }
                    // A lone dollar inside a $$...$$ span is content, not a close.
                    cursor += 1;
                    continue;
                }
                closeAt = cursor;
                break;
            }
            cursor += 1;
        }

        if (closeAt === -1) {
            // Nothing closes it. Report it and step past the delimiter so the rest
            // of the document is still scanned and still rendered.
            unterminated.push(delimiter);
            index = bodyStart;
            continue;
        }

        spans.push({
            start: index,
            end: closeAt + delimiter.length,
            latex: source.slice(bodyStart, closeAt),
            delimiter,
        });
        index = closeAt + delimiter.length;
    }

    return { spans, unterminated };
};

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
    if (!html || html.indexOf('$') === -1) {
        return html || '';
    }
    const { spans } = scanMath(html);
    if (spans.length === 0) {
        return html;
    }

    let out = '';
    let cursor = 0;
    spans.forEach((span) => {
        out += html.slice(cursor, span.start);
        const source = normalizePlainTex(decodeEntities(span.latex)).trim();
        if (source) {
            try {
                out += katex.renderToString(source, {
                    displayMode: false,
                    throwOnError: false,
                    errorColor: '#B91C1C',
                    strict: false,
                    trust: false,
                });
            } catch (err) {
                // Fall back to the original delimited text so content is never lost.
                out += html.slice(span.start, span.end);
            }
        }
        cursor = span.end;
    });
    out += html.slice(cursor);
    return out;
};

/**
 * Report the maths spans KaTeX cannot parse.
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
    if (!html || html.indexOf('$') === -1) {
        return [];
    }
    const problems = [];
    const { spans, unterminated } = scanMath(html);

    // An unterminated delimiter renders as a literal dollar sign rather than as
    // maths, which reads as a rendering bug from the author's side. Reported from
    // the same scan that does the rendering, so the two cannot disagree about
    // which delimiters paired up.
    unterminated.forEach((delimiter) => {
        problems.push({
            latex: '',
            message: 'Unclosed ' + delimiter + ' — maths must open and close with '
                + (delimiter === '$$' ? 'a pair of $$' : 'a single $') + '.',
        });
    });

    spans.forEach((span) => {
        const source = normalizePlainTex(decodeEntities(span.latex)).trim();
        if (!source) {
            problems.push({
                latex: span.delimiter + span.latex + span.delimiter,
                message: 'Empty formula.',
            });
            return;
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
    });
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
