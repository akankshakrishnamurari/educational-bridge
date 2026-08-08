// Single place where a failed request is recorded.
//
// Every API method previously ended with `catch (e) { console.log(e); return null; }`.
// That had two problems. In production it printed raw exception objects, including
// internal request URLs and stack frames, to the console of anyone who opened
// devtools. And for the developer it was almost useless, because thirty identical
// logs gave no indication of which call had actually failed.
//
// logError takes the calling site as its first argument so the log says what broke,
// and stays silent outside development so shipped pages do not narrate their own
// internals. If error reporting is ever added, this is the one function to change.

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * @param {string} context  Call site name, so the log says what broke.
 * @param {Error}  error    The failure itself.
 * @param {object} [detail] Optional extra context. The error boundary passes the
 *                          React component stack here, which locates the throwing
 *                          component far more precisely than the JS stack does.
 */
export const logError = (context, error, detail) => {
    if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.error('[' + context + ']', error, detail !== undefined ? detail : '');
    }
};

export default logError;
