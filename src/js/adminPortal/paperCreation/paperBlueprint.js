// The paper builder's data model.
//
// WHY THIS FILE EXISTS
// --------------------
// The builder's state was six parallel arrays that had to stay index-aligned:
//
//   subjectNames                          ["Physics"]
//   subjectWiseNumberOfSections           [2]
//   subjectWiseSectionNames               [["Section 1", "Section 2"]]
//   subjectWiseSectionPositiveMarks       [[3, 3]]
//   subjectWiseSectionNegativeMarks       [[-1, -1]]
//   subjectWiseSectionWiseNumberOfQuestions [[20, 5]]
//
// plus `subjectWiseSectionWiseSelectedQuestions`, a map keyed by subject NAME and
// then section NAME. Three separate defects followed from that shape:
//
// 1. RENAMING LOST WORK. Selected questions were filed under the name of the
//    subject and section. `updateNameOfSubject` wrote the new name into
//    subjectNames and did not touch the map, so the questions were still filed
//    under the old key. Every read went looking under the new name, found nothing,
//    and the author's selections silently disappeared from the picker while the
//    preview carried on listing them under a subject that no longer existed.
//
// 2. NEW SECTIONS COLLIDED. Sections were created with the literal default name
//    "Section Name". Two of them therefore produced the same map key, so both
//    shared one question list — and the publish payload, which is also keyed by
//    name, had the second section overwrite the first entirely.
//
// 3. THE COUNT AND THE LIST COULD DISAGREE. How many questions a section held was
//    tracked in subjectWiseSectionWiseNumberOfQuestions, separately from the list
//    of ids. The publish builder looped to the COUNT while indexing into the LIST,
//    so any drift between them pushed `undefined` into question_ids or silently
//    truncated the section.
//
// The model here has one source of truth. A section owns its own questionIds;
// counts are derived by reading that array's length. Identity is a generated id, so
// names are display text and nothing is keyed on them.
//
// The API is unchanged: it still receives the name-keyed nested object it always
// did. That shape is assembled at publish time by toCreatePaperRequest, which is
// also where duplicate names have to be rejected, because two sections sharing a
// name cannot both survive in that payload.

let idCounter = 0;

/**
 * Identity for a subject or section.
 *
 * Deliberately not the name, and deliberately not the array index: an index
 * changes when something before it is removed, which is the other way a list like
 * this loses track of what belongs to what.
 */
const nextId = (prefix) => {
    idCounter += 1;
    return prefix + '_' + idCounter + '_' + Date.now().toString(36);
};

export const DEFAULT_POSITIVE_MARKS = 4;
export const DEFAULT_NEGATIVE_MARKS = -1;
export const DEFAULT_PAPER_MINUTES = 180;

export const createSection = (name) => ({
    id: nextId('sec'),
    name: name || '',
    positiveMarks: DEFAULT_POSITIVE_MARKS,
    negativeMarks: DEFAULT_NEGATIVE_MARKS,
    // The one and only record of what is in this section.
    questionIds: [],
});

export const createSubject = (name) => ({
    id: nextId('sub'),
    name: name || '',
    sections: [createSection('Section 1')],
});

export const createBlueprint = () => {
    const subject = createSubject('General');
    return {
        paperName: '',
        allottedPaperTime: DEFAULT_PAPER_MINUTES,
        tags: [],
        subjects: [subject],
        activeSubjectId: subject.id,
        activeSectionId: subject.sections[0].id,
    };
};

// ---------------------------------------------------------------------------
// Reads. All derived, so they cannot fall out of step with the sections.
// ---------------------------------------------------------------------------

export const allSections = (blueprint) =>
    (blueprint.subjects || []).reduce((acc, subject) => acc.concat(subject.sections || []), []);

export const totalQuestionCount = (blueprint) =>
    allSections(blueprint).reduce((sum, section) => sum + section.questionIds.length, 0);

/**
 * Highest achievable score: every question answered correctly.
 *
 * Negative marks do not appear here on purpose — they are a penalty for a wrong
 * answer, not part of the maximum.
 */
export const totalMarks = (blueprint) =>
    allSections(blueprint).reduce(
        (sum, section) => sum + (section.questionIds.length * numberOr(section.positiveMarks, 0)),
        0
    );

/** Every question id used anywhere in the paper. */
export const selectedQuestionIds = (blueprint) => {
    const ids = [];
    allSections(blueprint).forEach((section) => {
        section.questionIds.forEach((id) => {
            if (ids.indexOf(id) === -1) {
                ids.push(id);
            }
        });
    });
    return ids;
};

export const findSubject = (blueprint, subjectId) =>
    (blueprint.subjects || []).filter((subject) => subject.id === subjectId)[0] || null;

export const findSection = (blueprint, sectionId) =>
    allSections(blueprint).filter((section) => section.id === sectionId)[0] || null;

export const activeSection = (blueprint) => findSection(blueprint, blueprint.activeSectionId);

/**
 * Which section a question sits in, or null. Used to stop the same question being
 * added to two sections, which would mean answering it twice in one paper.
 */
export const sectionHoldingQuestion = (blueprint, questionId) =>
    allSections(blueprint).filter((section) => section.questionIds.indexOf(questionId) !== -1)[0] || null;

/**
 * Coerce a form value to a number, falling back when it is absent.
 *
 * The blank check matters and is easy to miss: `Number('')` is 0, not NaN, so a
 * `Number.isFinite` test alone accepts an empty input as a legitimate zero. These
 * values come from `<input type="number">`, which holds '' while the author has
 * cleared the field to retype it — so without this, a section briefly mid-edit
 * would publish with a marking scheme of 0 rather than the intended default.
 */
const numberOr = (value, fallback) => {
    if (value === null || value === undefined) {
        return fallback;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

// ---------------------------------------------------------------------------
// Writes. Every one returns a new blueprint and never mutates its argument, so
// redux state stays comparable by reference.
// ---------------------------------------------------------------------------

const mapSubjects = (blueprint, mapper) => ({
    ...blueprint,
    subjects: blueprint.subjects.map(mapper),
});

const mapSection = (blueprint, sectionId, mapper) =>
    mapSubjects(blueprint, (subject) => ({
        ...subject,
        sections: subject.sections.map((section) => (section.id === sectionId ? mapper(section) : section)),
    }));

export const setPaperField = (blueprint, field, value) => ({ ...blueprint, [field]: value });

/**
 * Rename a subject. Nothing else has to move, which is the entire point of the
 * rewrite: previously this had to relocate the questions filed under the old name
 * and did not, so they were lost.
 */
export const renameSubject = (blueprint, subjectId, name) =>
    mapSubjects(blueprint, (subject) => (subject.id === subjectId ? { ...subject, name } : subject));

export const renameSection = (blueprint, sectionId, name) =>
    mapSection(blueprint, sectionId, (section) => ({ ...section, name }));

export const setSectionMarks = (blueprint, sectionId, field, value) =>
    mapSection(blueprint, sectionId, (section) => ({ ...section, [field]: value }));

export const addSubject = (blueprint) => {
    const subject = createSubject('');
    return {
        ...blueprint,
        subjects: blueprint.subjects.concat([subject]),
        activeSubjectId: subject.id,
        activeSectionId: subject.sections[0].id,
    };
};

/**
 * Remove a subject and everything in it.
 *
 * Refuses to remove the last one: a paper with no subject has nowhere to put a
 * question, and the old builder let the count go to zero and then rendered
 * nothing, with no way back other than reloading.
 */
export const removeSubject = (blueprint, subjectId) => {
    if (blueprint.subjects.length <= 1) {
        return blueprint;
    }
    const subjects = blueprint.subjects.filter((subject) => subject.id !== subjectId);
    return withValidSelection({ ...blueprint, subjects });
};

export const addSection = (blueprint, subjectId) => {
    const subject = findSubject(blueprint, subjectId);
    if (subject === null) {
        return blueprint;
    }
    // Numbered from the current length so the suggested name is unique on arrival.
    // The old builder pushed the literal "Section Name" every time, so a second
    // section shared a map key with the first.
    const section = createSection('Section ' + (subject.sections.length + 1));
    const next = mapSubjects(blueprint, (candidate) => (candidate.id === subjectId
        ? { ...candidate, sections: candidate.sections.concat([section]) }
        : candidate));
    return { ...next, activeSubjectId: subjectId, activeSectionId: section.id };
};

/**
 * Remove a section. Refuses to remove a subject's only section, for the same
 * reason removeSubject refuses the last subject.
 */
export const removeSection = (blueprint, sectionId) => {
    const owner = (blueprint.subjects || []).filter(
        (subject) => subject.sections.some((section) => section.id === sectionId)
    )[0];
    if (owner === undefined || owner.sections.length <= 1) {
        return blueprint;
    }
    const next = mapSubjects(blueprint, (subject) => (subject.id === owner.id
        ? { ...subject, sections: subject.sections.filter((section) => section.id !== sectionId) }
        : subject));
    return withValidSelection(next);
};

/**
 * Keep activeSubjectId/activeSectionId pointing at something that exists, after a
 * removal. Without this the builder holds a dangling id and the picker renders
 * against a section that is gone.
 */
const withValidSelection = (blueprint) => {
    const sections = allSections(blueprint);
    if (sections.some((section) => section.id === blueprint.activeSectionId)) {
        return blueprint;
    }
    const firstSubject = blueprint.subjects[0];
    return {
        ...blueprint,
        activeSubjectId: firstSubject ? firstSubject.id : null,
        activeSectionId: firstSubject && firstSubject.sections[0] ? firstSubject.sections[0].id : null,
    };
};

export const selectSection = (blueprint, sectionId) => {
    const owner = (blueprint.subjects || []).filter(
        (subject) => subject.sections.some((section) => section.id === sectionId)
    )[0];
    if (owner === undefined) {
        return blueprint;
    }
    return { ...blueprint, activeSubjectId: owner.id, activeSectionId: sectionId };
};

/**
 * Put a question in a section, or take it out if it is already there.
 *
 * A question may appear once in a paper. If it is already in a DIFFERENT section it
 * is moved rather than duplicated, because a paper that asks the same question
 * twice scores it twice and reads as a mistake.
 */
export const toggleQuestion = (blueprint, sectionId, questionId) => {
    const target = findSection(blueprint, sectionId);
    if (target === null) {
        return blueprint;
    }
    if (target.questionIds.indexOf(questionId) !== -1) {
        return mapSection(blueprint, sectionId, (section) => ({
            ...section,
            questionIds: section.questionIds.filter((id) => id !== questionId),
        }));
    }
    // Remove from wherever else it might be, then add here.
    const cleared = mapSubjects(blueprint, (subject) => ({
        ...subject,
        sections: subject.sections.map((section) => ({
            ...section,
            questionIds: section.questionIds.filter((id) => id !== questionId),
        })),
    }));
    return mapSection(cleared, sectionId, (section) => ({
        ...section,
        questionIds: section.questionIds.concat([questionId]),
    }));
};

/**
 * Reorder a section within its own subject. Sections do not move between subjects:
 * a section's marking scheme belongs to its subject's structure, and dragging one
 * across would raise questions this UI does not need to answer.
 */
export const moveSection = (blueprint, sectionId, offset) => {
    const owner = (blueprint.subjects || []).filter(
        (subject) => subject.sections.some((section) => section.id === sectionId)
    )[0];
    if (owner === undefined) {
        return blueprint;
    }
    const from = owner.sections.findIndex((section) => section.id === sectionId);
    const to = from + offset;
    if (to < 0 || to >= owner.sections.length) {
        return blueprint;
    }
    const sections = owner.sections.slice();
    sections.splice(to, 0, sections.splice(from, 1)[0]);
    return mapSubjects(blueprint, (subject) => (subject.id === owner.id ? { ...subject, sections } : subject));
};

export const moveQuestion = (blueprint, sectionId, questionId, offset) => {
    const section = findSection(blueprint, sectionId);
    if (section === null) {
        return blueprint;
    }
    const from = section.questionIds.indexOf(questionId);
    const to = from + offset;
    if (from === -1 || to < 0 || to >= section.questionIds.length) {
        return blueprint;
    }
    const questionIds = section.questionIds.slice();
    questionIds.splice(to, 0, questionIds.splice(from, 1)[0]);
    return mapSection(blueprint, sectionId, (candidate) => ({ ...candidate, questionIds }));
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Everything preventing this paper from being published, as reader-facing text.
 *
 * The old builder validated on the way out of each wizard step with a toast per
 * problem, so an author fixed one, moved on, and met the next. Returning the whole
 * list lets the UI show what is outstanding at all times.
 */
export const validationProblems = (blueprint) => {
    const problems = [];
    if (!blueprint.paperName || blueprint.paperName.trim() === '') {
        problems.push('Give the paper a name.');
    }
    const minutes = Number(blueprint.allottedPaperTime);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        problems.push('Set how long the paper should run, in minutes.');
    }
    (blueprint.subjects || []).forEach((subject, subjectIndex) => {
        const subjectLabel = subject.name && subject.name.trim() !== ''
            ? subject.name.trim()
            : 'Subject ' + (subjectIndex + 1);
        if (!subject.name || subject.name.trim() === '') {
            problems.push('Name ' + subjectLabel + '.');
        }
        const seen = {};
        (subject.sections || []).forEach((section, sectionIndex) => {
            const name = (section.name || '').trim();
            if (name === '') {
                problems.push('Name section ' + (sectionIndex + 1) + ' in ' + subjectLabel + '.');
                return;
            }
            // Not cosmetic. The publish payload is keyed by section name within a
            // subject, so two sections sharing one would silently collapse into a
            // single entry and one section's questions would never reach the API.
            if (seen[name] === true) {
                problems.push('Two sections in ' + subjectLabel + ' are both called "' + name + '". Names must differ.');
            }
            seen[name] = true;
            if (section.questionIds.length === 0) {
                problems.push('Add at least one question to ' + name + ' in ' + subjectLabel + '.');
            }
            if (!Number.isFinite(Number(section.positiveMarks)) || Number(section.positiveMarks) <= 0) {
                problems.push('Marks for a correct answer in ' + name + ' must be above zero.');
            }
            if (!Number.isFinite(Number(section.negativeMarks)) || Number(section.negativeMarks) > 0) {
                problems.push('Marks for a wrong answer in ' + name + ' must be zero or negative.');
            }
        });
    });
    const subjectNames = (blueprint.subjects || []).map((subject) => (subject.name || '').trim());
    subjectNames.forEach((name, index) => {
        if (name !== '' && subjectNames.indexOf(name) !== index) {
            problems.push('Two subjects are both called "' + name + '". Names must differ.');
        }
    });
    return problems;
};

export const isPublishable = (blueprint) => validationProblems(blueprint).length === 0;

/**
 * Assemble the create-paper request.
 *
 * The wire format is unchanged — a nested object keyed by subject name and then
 * section name — because that is what the backend reads. Names only become
 * significant at this boundary, and validationProblems has already guaranteed they
 * are present and unique by the time publishing is allowed.
 */
export const toCreatePaperRequest = (blueprint, createdBy) => {
    const subjectWiseSectionWiseQuestions = {};
    (blueprint.subjects || []).forEach((subject) => {
        const subjectName = (subject.name || '').trim();
        subjectWiseSectionWiseQuestions[subjectName] = {};
        (subject.sections || []).forEach((section) => {
            const sectionName = (section.name || '').trim();
            subjectWiseSectionWiseQuestions[subjectName][sectionName] = {
                // Taken straight from the section. The old builder looped to a
                // separately-tracked count while indexing into this list, so the two
                // could disagree and put undefined into the payload.
                question_ids: section.questionIds.slice(),
                correct_answer_marks: numberOr(section.positiveMarks, DEFAULT_POSITIVE_MARKS),
                incorrect_answer_marks: numberOr(section.negativeMarks, DEFAULT_NEGATIVE_MARKS),
            };
        });
    });
    return {
        paper_name: (blueprint.paperName || '').trim(),
        allotted_paper_time: numberOr(blueprint.allottedPaperTime, DEFAULT_PAPER_MINUTES),
        subject_wise_section_wise_questions: subjectWiseSectionWiseQuestions,
        tags: (blueprint.tags || []).map((tag) => tag.id),
        created_by: createdBy,
    };
};
