import React from "react";

export class MathUtils {

    static parserNumber(number) {
        try {
            return Number(number);
        } catch (e) {
            return 0;
        }
    }
}