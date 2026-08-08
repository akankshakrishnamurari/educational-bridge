// Pure number helpers, no JSX, so React is not imported. It used to be.

export class MathUtils {

    static parserNumber(number) {
        try {
            return Number(number);
        } catch (e) {
            return 0;
        }
    }
}