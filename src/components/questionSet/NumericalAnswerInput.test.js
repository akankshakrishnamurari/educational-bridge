import {
    isEnterableNumber,
    parseAnswerNumber,
    isNumericalAnswerCorrect,
} from './NumericalAnswerInput';

// These helpers decide what the review screen tells a learner about a numerical
// answer, so they have to agree with AnswerEvaluator on the backend. The cases
// below mirror AnswerEvaluatorTest.

describe('parseAnswerNumber', () => {
    it('accepts the formats the question datasets use', () => {
        expect(parseAnswerNumber('4.0')).toBe(4);
        expect(parseAnswerNumber('0.01')).toBe(0.01);
        expect(parseAnswerNumber('-1080')).toBe(-1080);
        expect(parseAnswerNumber('441')).toBe(441);
        expect(parseAnswerNumber(' 4 ')).toBe(4);
        expect(parseAnswerNumber('+4')).toBe(4);
    });

    it('rejects anything that is not a finite number', () => {
        expect(parseAnswerNumber('')).toBeNull();
        expect(parseAnswerNumber('   ')).toBeNull();
        expect(parseAnswerNumber('four')).toBeNull();
        expect(parseAnswerNumber('\\frac{46}{3}')).toBeNull();
        expect(parseAnswerNumber('NaN')).toBeNull();
        expect(parseAnswerNumber('Infinity')).toBeNull();
        expect(parseAnswerNumber(null)).toBeNull();
        expect(parseAnswerNumber(undefined)).toBeNull();
    });
});

describe('isEnterableNumber', () => {
    it('allows a value being typed one character at a time', () => {
        ['', '-', '1', '1.', '1.5', '-0.25', '1e', '1e-', '1e-3', '+7']
            .forEach((partial) => expect(isEnterableNumber(partial)).toBe(true));
    });

    it('blocks characters that could never form a number', () => {
        ['abc', '1.2.3', '4 5', '1,000', '$4', '4%']
            .forEach((bad) => expect(isEnterableNumber(bad)).toBe(false));
    });
});

describe('isNumericalAnswerCorrect', () => {
    it('ignores formatting differences', () => {
        expect(isNumericalAnswerCorrect('4.0', '4', null)).toBe(true);
        expect(isNumericalAnswerCorrect('4.0', '4.00', null)).toBe(true);
        expect(isNumericalAnswerCorrect('4', ' 4 ', null)).toBe(true);
        expect(isNumericalAnswerCorrect('4', '+4', null)).toBe(true);
        expect(isNumericalAnswerCorrect('-1080', '-1080.0', null)).toBe(true);
    });

    it('rejects a different value', () => {
        expect(isNumericalAnswerCorrect('4.0', '5', null)).toBe(false);
        expect(isNumericalAnswerCorrect('4.0', '4.1', null)).toBe(false);
        expect(isNumericalAnswerCorrect('124.27', '124.28', null)).toBe(false);
    });

    it('honours a tolerance, including at the floating-point boundary', () => {
        // 124.28 - 124.27 computes as 0.010000000000005, so a bare <= would mark
        // this correct answer wrong.
        expect(isNumericalAnswerCorrect('124.27', '124.28', 0.01)).toBe(true);
        expect(isNumericalAnswerCorrect('124.27', '124.26', 0.01)).toBe(true);
        expect(isNumericalAnswerCorrect('124.27', '124.30', 0.01)).toBe(false);
    });

    it('is never correct without an answer', () => {
        expect(isNumericalAnswerCorrect('4', '', null)).toBe(false);
        expect(isNumericalAnswerCorrect('4', null, null)).toBe(false);
        expect(isNumericalAnswerCorrect(null, '4', null)).toBe(false);
    });

    it('falls back to text comparison when the expected answer is not numeric', () => {
        expect(isNumericalAnswerCorrect('Both A and B', 'both a and b', null)).toBe(true);
        expect(isNumericalAnswerCorrect('Both A and B', 'A only', null)).toBe(false);
    });
});
