import {
    createBlueprint,
    addSection,
    addSubject,
    removeSection,
    removeSubject,
    renameSubject,
    renameSection,
    setSectionMarks,
    setPaperField,
    toggleQuestion,
    moveQuestion,
    moveSection,
    selectSection,
    findSection,
    allSections,
    totalQuestionCount,
    totalMarks,
    selectedQuestionIds,
    sectionHoldingQuestion,
    validationProblems,
    isPublishable,
    toCreatePaperRequest,
} from './paperBlueprint';

// A blueprint that is one step from publishable: named, timed, one section with a
// question in it.
const publishableBlueprint = () => {
    let blueprint = createBlueprint();
    blueprint = setPaperField(blueprint, 'paperName', 'JEE Main Mock 1');
    blueprint = renameSubject(blueprint, blueprint.subjects[0].id, 'Physics');
    blueprint = toggleQuestion(blueprint, blueprint.activeSectionId, 'q1');
    return blueprint;
};

describe('paper blueprint', () => {

    // THE BUG THE OLD MODEL HAD. Selected questions used to be filed under the
    // subject and section NAME, so renaming either one orphaned them.
    it('keeps a section\'s questions when the subject is renamed', () => {
        let blueprint = createBlueprint();
        const sectionId = blueprint.activeSectionId;
        blueprint = toggleQuestion(blueprint, sectionId, 'q1');
        blueprint = toggleQuestion(blueprint, sectionId, 'q2');
        expect(findSection(blueprint, sectionId).questionIds).toEqual(['q1', 'q2']);

        blueprint = renameSubject(blueprint, blueprint.subjects[0].id, 'Physics');

        expect(findSection(blueprint, sectionId).questionIds).toEqual(['q1', 'q2']);
        expect(totalQuestionCount(blueprint)).toBe(2);
    });

    it('keeps a section\'s questions when the section is renamed', () => {
        let blueprint = createBlueprint();
        const sectionId = blueprint.activeSectionId;
        blueprint = toggleQuestion(blueprint, sectionId, 'q1');

        blueprint = renameSection(blueprint, sectionId, 'Mechanics');

        expect(findSection(blueprint, sectionId).name).toBe('Mechanics');
        expect(findSection(blueprint, sectionId).questionIds).toEqual(['q1']);
    });

    // The old builder named every new section "Section Name", so two of them shared
    // one map key and one entry in the publish payload.
    it('gives each new section a distinct default name', () => {
        let blueprint = createBlueprint();
        const subjectId = blueprint.subjects[0].id;
        blueprint = addSection(blueprint, subjectId);
        blueprint = addSection(blueprint, subjectId);
        const names = blueprint.subjects[0].sections.map((section) => section.name);
        expect(names).toEqual(['Section 1', 'Section 2', 'Section 3']);
        expect(new Set(names).size).toBe(3);
    });

    it('holds questions separately per section', () => {
        let blueprint = createBlueprint();
        const first = blueprint.activeSectionId;
        blueprint = addSection(blueprint, blueprint.subjects[0].id);
        const second = blueprint.activeSectionId;

        blueprint = toggleQuestion(blueprint, first, 'q1');
        blueprint = toggleQuestion(blueprint, second, 'q2');

        expect(findSection(blueprint, first).questionIds).toEqual(['q1']);
        expect(findSection(blueprint, second).questionIds).toEqual(['q2']);
        expect(totalQuestionCount(blueprint)).toBe(2);
    });

    it('toggles a question out of a section it is already in', () => {
        let blueprint = createBlueprint();
        const sectionId = blueprint.activeSectionId;
        blueprint = toggleQuestion(blueprint, sectionId, 'q1');
        blueprint = toggleQuestion(blueprint, sectionId, 'q1');
        expect(findSection(blueprint, sectionId).questionIds).toEqual([]);
    });

    // A paper must not ask the same question twice; it would be scored twice.
    it('moves a question rather than duplicating it across sections', () => {
        let blueprint = createBlueprint();
        const first = blueprint.activeSectionId;
        blueprint = addSection(blueprint, blueprint.subjects[0].id);
        const second = blueprint.activeSectionId;

        blueprint = toggleQuestion(blueprint, first, 'q1');
        blueprint = toggleQuestion(blueprint, second, 'q1');

        expect(findSection(blueprint, first).questionIds).toEqual([]);
        expect(findSection(blueprint, second).questionIds).toEqual(['q1']);
        expect(totalQuestionCount(blueprint)).toBe(1);
        expect(selectedQuestionIds(blueprint)).toEqual(['q1']);
        expect(sectionHoldingQuestion(blueprint, 'q1').id).toBe(second);
    });

    it('reorders questions within a section', () => {
        let blueprint = createBlueprint();
        const sectionId = blueprint.activeSectionId;
        ['q1', 'q2', 'q3'].forEach((id) => {
            blueprint = toggleQuestion(blueprint, sectionId, id);
        });

        blueprint = moveQuestion(blueprint, sectionId, 'q3', -1);
        expect(findSection(blueprint, sectionId).questionIds).toEqual(['q1', 'q3', 'q2']);
    });

    it('refuses to move a question past either end', () => {
        let blueprint = createBlueprint();
        const sectionId = blueprint.activeSectionId;
        blueprint = toggleQuestion(blueprint, sectionId, 'q1');
        blueprint = toggleQuestion(blueprint, sectionId, 'q2');

        expect(moveQuestion(blueprint, sectionId, 'q1', -1)).toBe(blueprint);
        expect(moveQuestion(blueprint, sectionId, 'q2', 1)).toBe(blueprint);
    });

    it('derives total marks from question counts and each section\'s scheme', () => {
        let blueprint = createBlueprint();
        const first = blueprint.activeSectionId;
        blueprint = setSectionMarks(blueprint, first, 'positiveMarks', 4);
        blueprint = toggleQuestion(blueprint, first, 'q1');
        blueprint = toggleQuestion(blueprint, first, 'q2');

        blueprint = addSection(blueprint, blueprint.subjects[0].id);
        const second = blueprint.activeSectionId;
        blueprint = setSectionMarks(blueprint, second, 'positiveMarks', 2);
        blueprint = toggleQuestion(blueprint, second, 'q3');

        // 2 questions at 4, plus 1 at 2.
        expect(totalMarks(blueprint)).toBe(10);
    });

    // Negative marks are a penalty, not part of the achievable maximum.
    it('excludes negative marks from the total', () => {
        let blueprint = createBlueprint();
        const sectionId = blueprint.activeSectionId;
        blueprint = setSectionMarks(blueprint, sectionId, 'positiveMarks', 4);
        blueprint = setSectionMarks(blueprint, sectionId, 'negativeMarks', -1);
        blueprint = toggleQuestion(blueprint, sectionId, 'q1');
        expect(totalMarks(blueprint)).toBe(4);
    });

    it('keeps the last subject and the last section of a subject', () => {
        let blueprint = createBlueprint();
        const subjectId = blueprint.subjects[0].id;
        const sectionId = blueprint.activeSectionId;

        expect(removeSubject(blueprint, subjectId)).toBe(blueprint);
        expect(removeSection(blueprint, sectionId)).toBe(blueprint);
    });

    it('repoints the selection when the selected section is removed', () => {
        let blueprint = createBlueprint();
        const firstSection = blueprint.activeSectionId;
        blueprint = addSection(blueprint, blueprint.subjects[0].id);
        const secondSection = blueprint.activeSectionId;

        blueprint = removeSection(blueprint, secondSection);

        expect(findSection(blueprint, secondSection)).toBeNull();
        expect(blueprint.activeSectionId).toBe(firstSection);
    });

    it('selects a section and its owning subject together', () => {
        let blueprint = createBlueprint();
        const original = blueprint.activeSectionId;
        blueprint = addSubject(blueprint);
        const added = blueprint.subjects[1];

        blueprint = selectSection(blueprint, original);
        expect(blueprint.activeSubjectId).toBe(blueprint.subjects[0].id);

        blueprint = selectSection(blueprint, added.sections[0].id);
        expect(blueprint.activeSubjectId).toBe(added.id);
    });

    it('never mutates the blueprint it is given', () => {
        const blueprint = createBlueprint();
        const snapshot = JSON.stringify(blueprint);
        toggleQuestion(blueprint, blueprint.activeSectionId, 'q1');
        renameSubject(blueprint, blueprint.subjects[0].id, 'Changed');
        addSection(blueprint, blueprint.subjects[0].id);
        expect(JSON.stringify(blueprint)).toBe(snapshot);
    });

    describe('validation', () => {

        it('reports an unnamed paper, an unnamed subject and an empty section', () => {
            const problems = validationProblems(createBlueprint());
            expect(problems).toContain('Give the paper a name.');
            expect(problems.some((p) => p.indexOf('Add at least one question') === 0)).toBe(true);
            expect(isPublishable(createBlueprint())).toBe(false);
        });

        it('accepts a complete paper', () => {
            expect(validationProblems(publishableBlueprint())).toEqual([]);
            expect(isPublishable(publishableBlueprint())).toBe(true);
        });

        // Duplicate names are not a style problem: the publish payload is keyed by
        // name, so a collision drops one section's questions entirely.
        it('rejects two sections in one subject sharing a name', () => {
            let blueprint = publishableBlueprint();
            blueprint = addSection(blueprint, blueprint.subjects[0].id);
            const added = blueprint.activeSectionId;
            blueprint = toggleQuestion(blueprint, added, 'q2');
            blueprint = renameSection(blueprint, added, 'Section 1');

            expect(validationProblems(blueprint).some((p) => p.indexOf('both called "Section 1"') !== -1)).toBe(true);
            expect(isPublishable(blueprint)).toBe(false);
        });

        it('rejects two subjects sharing a name', () => {
            let blueprint = publishableBlueprint();
            blueprint = addSubject(blueprint);
            const added = blueprint.subjects[1];
            blueprint = renameSubject(blueprint, added.id, 'Physics');
            blueprint = toggleQuestion(blueprint, added.sections[0].id, 'q2');

            expect(validationProblems(blueprint).some((p) => p.indexOf('both called "Physics"') !== -1)).toBe(true);
        });

        it('rejects a non-positive correct-answer mark and a positive wrong-answer mark', () => {
            let blueprint = publishableBlueprint();
            const sectionId = blueprint.activeSectionId;
            blueprint = setSectionMarks(blueprint, sectionId, 'positiveMarks', 0);
            blueprint = setSectionMarks(blueprint, sectionId, 'negativeMarks', 1);
            const problems = validationProblems(blueprint);
            expect(problems.some((p) => p.indexOf('correct answer') !== -1)).toBe(true);
            expect(problems.some((p) => p.indexOf('wrong answer') !== -1)).toBe(true);
        });

        it('rejects a non-positive duration', () => {
            const blueprint = setPaperField(publishableBlueprint(), 'allottedPaperTime', 0);
            expect(validationProblems(blueprint).some((p) => p.indexOf('how long') !== -1)).toBe(true);
        });
    });

    describe('publish payload', () => {

        it('keys by subject and section name, as the API expects', () => {
            let blueprint = publishableBlueprint();
            blueprint = renameSection(blueprint, blueprint.activeSectionId, 'Mechanics');
            blueprint = setSectionMarks(blueprint, blueprint.activeSectionId, 'positiveMarks', 4);
            blueprint = setSectionMarks(blueprint, blueprint.activeSectionId, 'negativeMarks', -1);
            blueprint = setPaperField(blueprint, 'allottedPaperTime', 120);

            const request = toCreatePaperRequest(blueprint, 'google-123');

            expect(request.paper_name).toBe('JEE Main Mock 1');
            expect(request.allotted_paper_time).toBe(120);
            expect(request.created_by).toBe('google-123');
            expect(request.subject_wise_section_wise_questions).toEqual({
                Physics: {
                    Mechanics: {
                        question_ids: ['q1'],
                        correct_answer_marks: 4,
                        incorrect_answer_marks: -1,
                    },
                },
            });
        });

        // The old builder looped to a separately-tracked count while indexing into
        // the id list, so drift between them put undefined into question_ids.
        it('sends exactly the ids the section holds, in order', () => {
            let blueprint = publishableBlueprint();
            const sectionId = blueprint.activeSectionId;
            blueprint = toggleQuestion(blueprint, sectionId, 'q2');
            blueprint = toggleQuestion(blueprint, sectionId, 'q3');

            const section = toCreatePaperRequest(blueprint, 'u')
                .subject_wise_section_wise_questions.Physics['Section 1'];

            expect(section.question_ids).toEqual(['q1', 'q2', 'q3']);
            expect(section.question_ids.every((id) => id !== undefined)).toBe(true);
        });

        it('trims names and maps tags to ids', () => {
            let blueprint = publishableBlueprint();
            blueprint = setPaperField(blueprint, 'paperName', '  Spaced  ');
            blueprint = renameSubject(blueprint, blueprint.subjects[0].id, '  Physics  ');
            blueprint = setPaperField(blueprint, 'tags', [{ id: 't1' }, { id: 't2' }]);

            const request = toCreatePaperRequest(blueprint, 'u');
            expect(request.paper_name).toBe('Spaced');
            expect(Object.keys(request.subject_wise_section_wise_questions)).toEqual(['Physics']);
            expect(request.tags).toEqual(['t1', 't2']);
        });

        it('falls back to a sane scheme when marks are blank', () => {
            let blueprint = publishableBlueprint();
            const sectionId = blueprint.activeSectionId;
            blueprint = setSectionMarks(blueprint, sectionId, 'positiveMarks', '');
            blueprint = setSectionMarks(blueprint, sectionId, 'negativeMarks', '');

            const section = toCreatePaperRequest(blueprint, 'u')
                .subject_wise_section_wise_questions.Physics['Section 1'];

            expect(section.correct_answer_marks).toBe(4);
            expect(section.incorrect_answer_marks).toBe(-1);
        });
    });

    it('reorders sections within their subject and keeps their questions', () => {
        let blueprint = createBlueprint();
        const first = blueprint.activeSectionId;
        blueprint = toggleQuestion(blueprint, first, 'q1');
        blueprint = addSection(blueprint, blueprint.subjects[0].id);
        const second = blueprint.activeSectionId;
        blueprint = toggleQuestion(blueprint, second, 'q2');

        blueprint = moveSection(blueprint, second, -1);

        expect(blueprint.subjects[0].sections.map((s) => s.id)).toEqual([second, first]);
        // Reordering must not disturb what each section holds.
        expect(findSection(blueprint, first).questionIds).toEqual(['q1']);
        expect(findSection(blueprint, second).questionIds).toEqual(['q2']);
    });

    it('refuses to move a section past either end of its subject', () => {
        let blueprint = createBlueprint();
        const only = blueprint.activeSectionId;
        expect(moveSection(blueprint, only, -1)).toBe(blueprint);
        expect(moveSection(blueprint, only, 1)).toBe(blueprint);
    });

    it('counts sections across every subject', () => {
        let blueprint = createBlueprint();
        blueprint = addSection(blueprint, blueprint.subjects[0].id);
        blueprint = addSubject(blueprint);
        expect(allSections(blueprint).length).toBe(3);
    });
});
