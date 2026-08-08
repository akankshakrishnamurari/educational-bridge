// Helpers for reading API results.
//
// Every method in apis/ resolves with `{data}` on success or `null` on failure,
// so `response.data` throws whenever a request fails. These helpers make the
// common cases safe without every call site repeating the same null dance.

/**
 * The payload from an API result, or `fallback` if the call failed.
 */
export const dataOf = (response, fallback = null) => {
    if (response === null || response === undefined) {
        return fallback;
    }
    if (response.data === null || response.data === undefined) {
        return fallback;
    }
    return response.data;
};

/**
 * An array payload, or `[]`. Guards the very common
 * `response.data.map(...)` / `.forEach(...)` pattern, which throws both when the
 * request failed and when the endpoint answered with a single object or null.
 */
export const listOf = (response, key) => {
    const data = dataOf(response);
    if (data === null) {
        return [];
    }
    const value = key === undefined ? data : data[key];
    return Array.isArray(value) ? value : [];
};

/**
 * True when the call succeeded. For write endpoints whose body is not useful.
 */
export const succeeded = (response) => response !== null && response !== undefined;

export default dataOf;
