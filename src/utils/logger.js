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

export const logError = (context, error) => {
    if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.error('[' + context + ']', error);
    }
};

export default logError;
