// The classification dimensions an author can create and attach tags for.
//
// These prefixes are structural: a tag's name is stored as "<Prefix> : <Value>"
// and every filter on the platform matches on the prefix. Getting one wrong
// produces a tag that is silently unreachable.
//
// TWO PROBLEMS FIXED
// ------------------
// 1. The exam prefix was "Exam Name : ". Nothing in the database uses that; the
//    importer writes "Exam : " (see backend tools/import_jee_questions.py,
//    build_tag_names, and src/utils/questionTaxonomy.js which parses it). So the
//    Exam option in the tag-creation dropdown produced tags that no Exam filter
//    could ever match, and the Exam suggestion list on the authoring page was
//    permanently empty.
//
// 2. The list was missing Chapter, Chapter Group, Difficulty, Year and Source, all
//    of which the question list filters by and the solve page displays. An author
//    could not attach a difficulty or a year to their own question, which meant
//    hand-authored questions were invisible to the two filters learners reach for
//    most.
//
// The trailing empty-prefix "other tags" entry was removed: it created tags with no
// prefix at all, which parse into the "other" bucket and appear under no filter.
// If a genuinely unclassified label is needed, it belongs in the question body.
//
// Order here is the order shown in the UI, coarse to fine.
export const tagPrefixPairMap=[
    { prefix: "Subject : ",       tag: "subjectTag",      inputPlaceholder: "Subject",       searchPlaceholder: "Search subjects" },
    { prefix: "Chapter Group : ", tag: "chapterGroupTag", inputPlaceholder: "Chapter group", searchPlaceholder: "Search chapter groups" },
    { prefix: "Chapter : ",       tag: "chapterTag",      inputPlaceholder: "Chapter",       searchPlaceholder: "Search chapters" },
    { prefix: "Topic : ",         tag: "topicTag",        inputPlaceholder: "Topic",         searchPlaceholder: "Search topics" },
    { prefix: "Difficulty : ",    tag: "difficultyTag",   inputPlaceholder: "Difficulty",    searchPlaceholder: "Search difficulty" },
    { prefix: "Exam : ",          tag: "examTag",         inputPlaceholder: "Exam",          searchPlaceholder: "Search exams" },
    { prefix: "Year : ",          tag: "yearTag",         inputPlaceholder: "Year",          searchPlaceholder: "Search years" },
    { prefix: "Source : ",        tag: "sourceTag",       inputPlaceholder: "Source",        searchPlaceholder: "Search sources" },
    { prefix: "Created By : ",    tag: "authorTag",       inputPlaceholder: "Author",        searchPlaceholder: "Search authors" },
];

/** The one dimension a question must carry to be reachable by subject filters. */
export const MANDATORY_TAG_PREFIX = "Subject : ";

export default tagPrefixPairMap;
