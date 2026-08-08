// Turns a question's flat `tags[]` array into structured metadata.
//
// WHY THIS EXISTS
// ---------------
// A question has no first-class subject/chapter/topic/difficulty/year fields.
// `QuestionResponse` carries only `tags: [{ id, tagName, tagDescription }]`, and
// every piece of classification is encoded in the tag NAME using the convention
//
//     "<Prefix> : <Value>"          e.g. "Difficulty : Hard"
//
// (separator is space-colon-space). The importer in
// backend-master-main/tools/import_jee_questions.py is the authority for which
// prefixes exist -- see build_tag_names().
//
// The UI used to filter out two bookkeeping prefixes, strip the prefix off the
// rest, and render up to four identical grey pills. That threw away the whole
// taxonomy: "Subject : Mathematics" and "Difficulty : Hard" became visually
// indistinguishable chips in arbitrary order. Parsing here lets each dimension
// be presented as what it actually is.
//
// Everything is optional. Imported questions carry as few as 2 and as many as
// ~12 tags depending on which source fields were populated, so callers must
// tolerate nulls rather than assuming a fixed shape or index.

// Canonical prefixes, lower-cased for matching. Values are the keys we expose.
const PREFIX_TO_KEY = {
    'source': 'source',
    'created by': 'createdBy',
    'exam': 'exam',
    'subject': 'subject',
    'chapter group': 'chapterGroup',
    'chapter': 'chapter',
    'topic': 'topic',
    'year': 'year',
    'difficulty': 'difficulty',
    'paper': 'paper',
    'flag': 'flag',
};

// Provenance/bookkeeping dimensions: real data, but not something a student
// scanning a list needs to see. Kept in the parsed result (the solve page shows
// source and paper) but excluded from the generic chip overflow.
const BOOKKEEPING_KEYS = ['source', 'createdBy', 'paper'];

// `getQuestionsByQuestionIds` hits a backend code path that stubs every tag name
// to the literal string "DEFAULT" (QuestionResponseAdapter.adapt(List<QuestionDTO>)).
// Those carry no information and must never reach the UI as a visible chip.
const PLACEHOLDER_TAG_NAMES = ['default'];

const SEPARATOR = ' : ';

/**
 * Split "Difficulty : Hard" into ['Difficulty', 'Hard'].
 *
 * Splits on the FIRST separator only: "Paper : JEE Main 2023 : Shift 1" is a
 * legitimate value, because the importer passes paperTitle through unmodified.
 * Returns null when the tag carries no recognisable prefix.
 */
export const splitTagName = (tagName) => {
    if (typeof tagName !== 'string') {
        return null;
    }
    const idx = tagName.indexOf(SEPARATOR);
    if (idx === -1) {
        return null;
    }
    const prefix = tagName.slice(0, idx).trim();
    const value = tagName.slice(idx + SEPARATOR.length).trim();
    if (!prefix || !value) {
        return null;
    }
    return [prefix, value];
};

// The importer's pretty() only upper-cases the first letter of each word, so
// acronyms in the source arrive title-cased: "Jee Main", "Bitsat", "Ncert".
// Repairing that here (display-time only) avoids touching the imported data,
// which would mean re-running the import to fix cosmetics.
const ACRONYMS = {
    'jee': 'JEE',
    'neet': 'NEET',
    'bitsat': 'BITSAT',
    'viteee': 'VITEEE',
    'wbjee': 'WBJEE',
    'kcet': 'KCET',
    'mhtcet': 'MHT-CET',
    'aiims': 'AIIMS',
    'ncert': 'NCERT',
    'gate': 'GATE',
    'cat': 'CAT',
    'ssc': 'SSC',
    'upsc': 'UPSC',
    'nda': 'NDA',
    'ip': 'IP',
    'pyq': 'PYQ',
};

/**
 * Fix acronym casing in a display label, word by word. Leaves anything unknown
 * untouched, so source typos are preserved rather than guessed at.
 */
export const displayLabel = (value) => {
    if (!value) {
        return '';
    }
    return String(value)
        .split(' ')
        .map((word) => {
            const key = word.toLowerCase();
            return ACRONYMS[key] || word;
        })
        .join(' ');
};

/**
 * Difficulty arrives as a prettified string, so it is compared case-insensitively
 * and mapped to a 1-3 level for the meter. Unrecognised labels get level null:
 * the label still renders, it just does not claim a position on the scale. That
 * matters because the source data is scraped and we would rather show an honest
 * unknown than assert "Medium" for something we cannot classify.
 */
const DIFFICULTY_LEVELS = {
    'easy': 1,
    'beginner': 1,
    'medium': 2,
    'moderate': 2,
    'intermediate': 2,
    'hard': 3,
    'difficult': 3,
    'advanced': 3,
    'very hard': 3,
    'tough': 3,
};

export const difficultyLevel = (label) => {
    if (!label) {
        return null;
    }
    const level = DIFFICULTY_LEVELS[String(label).trim().toLowerCase()];
    return level === undefined ? null : level;
};

/**
 * Parse a question's tags into structured metadata.
 *
 * @param {Array<{id: string, tagName: string}>} tags raw `tags` off QuestionResponse
 * @returns {{
 *   subject: ?string, chapterGroup: ?string, chapter: ?string, topic: ?string,
 *   year: ?string, difficulty: ?string, difficultyLevel: ?number, exam: ?string,
 *   paper: ?string, source: ?string, createdBy: ?string,
 *   flags: string[], other: Array<{id: string, label: string}>,
 *   breadcrumb: string[]
 * }}
 */
export const parseQuestionTaxonomy = (tags) => {
    const parsed = {
        subject: null,
        chapterGroup: null,
        chapter: null,
        topic: null,
        year: null,
        difficulty: null,
        difficultyLevel: null,
        exam: null,
        paper: null,
        source: null,
        createdBy: null,
        flags: [],
        other: [],
        breadcrumb: [],
    };

    if (!Array.isArray(tags)) {
        return parsed;
    }

    tags.forEach((tag) => {
        if (!tag || typeof tag.tagName !== 'string') {
            return;
        }
        const rawName = tag.tagName.trim();
        if (!rawName || PLACEHOLDER_TAG_NAMES.includes(rawName.toLowerCase())) {
            return;
        }

        const split = splitTagName(rawName);
        if (split === null) {
            // A tag with no "Prefix : " convention. Hand-authored questions can
            // carry these, so surface them rather than dropping them.
            parsed.other.push({ id: tag.id || rawName, label: rawName });
            return;
        }

        const [prefix, value] = split;
        const key = PREFIX_TO_KEY[prefix.toLowerCase()];

        if (key === undefined) {
            // Unknown prefix: keep the whole string so nothing is silently lost.
            parsed.other.push({ id: tag.id || rawName, label: rawName });
            return;
        }
        if (key === 'flag') {
            parsed.flags.push(value);
            return;
        }
        // First value wins for single-valued dimensions. The importer emits one
        // tag per dimension, but a hand-edited question could carry duplicates
        // and we prefer stable rendering over concatenating them.
        if (parsed[key] === null) {
            // `paper` keeps its raw value: it is a proper title from the source
            // and already correctly cased. Everything else goes through the
            // acronym repair.
            parsed[key] = key === 'paper' ? value : displayLabel(value);
        }
    });

    parsed.difficultyLevel = difficultyLevel(parsed.difficulty);

    // Coarse-to-fine trail. Chapter Group is deliberately omitted: it is almost
    // always a near-duplicate of Chapter in the source data, so including it
    // makes the breadcrumb read redundantly ("Matrices > Matrices And
    // Determinants > Matrices").
    parsed.breadcrumb = [parsed.subject, parsed.chapter, parsed.topic].filter(Boolean);

    return parsed;
};

/**
 * Map a flat list of tags to `{ [tagId]: { subject, topic, chapter, label } }`.
 *
 * The paper analytics are keyed by tag id (`tagIdToCandidateScoreAnalysis`), but a
 * tag id is meaningless to a learner. This resolves ids back to readable names by
 * walking the tags attached to the paper's own questions.
 *
 * @param {Array<{id, tags: Array}>} questions questions carrying `tags`
 */
export const buildTagIdLabelMap = (questions) => {
    const map = {};
    if (!Array.isArray(questions)) {
        return map;
    }
    // Subject is recorded per question rather than per tag, so it is captured
    // alongside each topic/chapter tag found on the same question. That is what
    // lets a topic render as "Physics · Kinematics" instead of a bare topic name.
    questions.forEach((question) => {
        if (!question || !Array.isArray(question.tags)) {
            return;
        }
        let subject = null;
        question.tags.forEach((tag) => {
            const split = tag && typeof tag.tagName === 'string' ? splitTagName(tag.tagName) : null;
            if (split && split[0].toLowerCase() === 'subject') {
                subject = displayLabel(split[1]);
            }
        });
        question.tags.forEach((tag) => {
            if (!tag || typeof tag.tagName !== 'string' || !tag.id) {
                return;
            }
            const split = splitTagName(tag.tagName);
            if (split === null) {
                return;
            }
            const prefix = split[0].toLowerCase();
            if (prefix !== 'topic' && prefix !== 'chapter') {
                return;
            }
            const value = displayLabel(split[1]);
            map[tag.id] = {
                kind: prefix,
                subject,
                name: value,
                label: subject ? subject + ' · ' + value : value,
            };
        });
    });
    return map;
};

/**
 * Chips for dimensions that have no dedicated slot in a given layout.
 * Bookkeeping dimensions are excluded because "Created By :
 * jee-data-base-import" is noise to a student.
 *
 * @param {object} taxonomy result of parseQuestionTaxonomy
 * @param {string[]} alreadyShown keys the caller renders itself, e.g. ['subject']
 */
export const overflowChips = (taxonomy, alreadyShown = []) => {
    const skip = new Set([...BOOKKEEPING_KEYS, ...alreadyShown]);
    const ordered = ['exam', 'subject', 'chapterGroup', 'chapter', 'topic', 'year', 'difficulty'];
    const chips = [];
    ordered.forEach((key) => {
        if (!skip.has(key) && taxonomy[key]) {
            chips.push({ id: key, label: taxonomy[key] });
        }
    });
    taxonomy.other.forEach((entry) => chips.push(entry));
    return chips;
};

/**
 * Subject -> accent key. Returning a fixed key (rather than a colour) keeps the
 * hex values in the palette and lets callers decide how to apply the accent.
 * Matching is substring-based because subject labels vary in the source
 * ("Maths", "Mathematics").
 */
const SUBJECT_ACCENTS = [
    { match: ['math'], accent: 'primary' },
    { match: ['phys'], accent: 'warning' },
    { match: ['chem'], accent: 'success' },
    { match: ['bio', 'zool', 'botan'], accent: 'danger' },
];

export const subjectAccent = (subject) => {
    if (!subject) {
        return 'gray';
    }
    const normalized = String(subject).toLowerCase();
    const hit = SUBJECT_ACCENTS.find((entry) => entry.match.some((m) => normalized.includes(m)));
    return hit ? hit.accent : 'gray';
};

export default parseQuestionTaxonomy;
