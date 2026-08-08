import { logError } from '../utils/logger';

// Shared transport for every API call.
//
// WHY THIS EXISTS
// ---------------
// The API classes each hand-rolled their own fetch, and between them they had
// four separate defects that all produced the same symptom: a page that either
// span forever or crashed with a TypeError somewhere far away from the cause.
//
//  1. `fetch` only rejects on a network-level failure. It resolves normally for
//     404, 422 and 500. Nothing here checked `response.ok`, so a server error
//     body was parsed as JSON and handed back to the caller as if it were real
//     data. A 500 from the question list became "questions" the page then tried
//     to iterate.
//
//  2. Failure was signalled inconsistently — some methods returned `null`,
//     others returned `{}`. Callers uniformly did `response.data`, so the first
//     group threw immediately and the second threw one property access later.
//     Neither was handled anywhere.
//
//  3. Several POST methods forgot to `await` the fetch, then called `.json()` on
//     the pending Promise. That always throws, so those methods always reported
//     failure — even when the request itself had succeeded.
//
//  4. Endpoints that legitimately return an empty body (the vote and comment
//     writes) were still run through `.json()`, which throws on "".
//
// The contract here is deliberately narrow so call sites stay simple:
//   success -> { data }   (data may be null for an empty body)
//   failure -> null       (always, for every kind of failure)
//
// Callers must therefore null-check the result. That is the whole point: a
// failure is now something the UI can see and report, rather than an exception
// thrown from inside a render.

const TIMEOUT_MS = 20000;

/**
 * Perform a JSON request.
 *
 * @param {string} context  Call site name, used only for logging.
 * @param {string} url      Fully-qualified URL.
 * @param {object} options  Optional fetch options.
 * @returns {Promise<{data: any}|null>} `{data}` on a 2xx, `null` on any failure.
 */
export const requestJson = async (context, url, options) => {
    // A hung request used to leave the spinner up permanently, because nothing
    // ever settled the promise. An abort surfaces as a normal failure instead.
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

    try {
        const response = await fetch(url, {
            ...(options || {}),
            ...(controller ? { signal: controller.signal } : {}),
        });

        if (!response.ok) {
            logError(context, new Error('HTTP ' + response.status + ' ' + response.statusText + ' for ' + url));
            return null;
        }

        // 204, and the several write endpoints that return an empty 200, have no
        // body to parse. Read as text first so "" is distinguishable from JSON.
        const text = await response.text();
        if (text === '' || text === null || text === undefined) {
            return { data: null };
        }

        try {
            return { data: JSON.parse(text) };
        } catch (parseError) {
            // Several write endpoints are declared as ResponseEntity<String> and
            // answer with a bare word like `Updated`, which is not valid JSON. The
            // request did succeed, so this is reported as success carrying the raw
            // text rather than as a failure. Callers of those endpoints ignore the
            // body; callers expecting an object will find their fields absent and
            // fall through their own null handling.
            return { data: text, isRawText: true };
        }
    } catch (e) {
        logError(context, e);
        return null;
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
};

/**
 * Convenience wrapper for JSON POST/PUT bodies.
 */
export const postJson = (context, url, body) => requestJson(context, url, {
    method: 'POST',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export default requestJson;
