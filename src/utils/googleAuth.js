import jwt_decode from 'jwt-decode';
import { currentGoogleLoginAPIKey } from '../constants/hostConfig';
import { logError } from './logger';
import UserAPIConnector from '../apis/UserAPIConnector';
import { UserDetailsUtil } from './UserDetailsUtil';

/*
  Google sign-in, on Google Identity Services (GIS).

  WHY THIS FILE EXISTS
  --------------------
  Sign-in used to go through `react-google-login`, which is a wrapper around the
  *Google Sign-In JavaScript Platform Library* (`gapi.auth2`). Google deprecated
  that library on 31 March 2023 and now blocks apps from using it; the block
  surfaces in the browser as

      Error 400: redirect_uri_mismatch
      "Access blocked: This app's request is invalid"

  which is misleading, because there is no redirect URI to correct. `gapi.auth2`
  asks Google for `redirect_uri=storagerelay://https/<your-origin>?id=auth2`, and
  `storagerelay://` is not a URI you can add to the OAuth client's allowlist in
  the Cloud Console. So the error is unfixable by configuration alone -- the
  library itself has to go.

  GIS replaces it. For the ID-token flow used here there is no redirect URI at
  all: Google checks the page's *Authorized JavaScript origin* and hands back a
  signed JWT in a callback. The origin allowlist still has to be right (see
  infra/AWS_INFRA.md), but the storagerelay dead end is gone.

  SHAPE OF THE SESSION USER
  -------------------------
  The old library returned `response.profileObj`, and the whole app was built on
  its field names -- `googleId` keys question ownership, comment authorship and
  votes; `imageUrl` is the avatar. GIS returns raw OIDC claims instead (`sub`,
  `picture`, `given_name`, `family_name`). `toSessionUser` maps one to the other
  so existing data keeps matching: `sub` is the very same value `profileObj.googleId`
  carried, so nobody loses authorship of anything they have already posted.
*/

const GSI_SRC = 'https://accounts.google.com/gsi/client';

// How long to wait for the GIS script before giving up and showing the fallback.
const LOAD_TIMEOUT_MS = 10000;

// Upper bound on how long sign-in waits for the server-side login record before
// reloading. The record is bookkeeping, not a precondition for being signed in.
const LOGIN_RECORD_TIMEOUT_MS = 2500;

let loadPromise = null;

const getIdClient = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    const google = window.google;
    if (google && google.accounts && google.accounts.id) {
        return google.accounts.id;
    }
    return null;
};

/**
 * Resolve with `google.accounts.id` once the GIS script is usable.
 *
 * public/index.html loads the script with `defer`, so on a fast mount it may not
 * have executed yet. Listening for the tag's `load` event alone is not enough --
 * if the event already fired before this ran, the listener never gets called and
 * sign-in would hang forever with no button and no error. So readiness is polled
 * against a deadline, which covers the script being early, late, or blocked
 * outright by an extension.
 *
 * @returns {Promise<object>} the `google.accounts.id` namespace.
 */
export const loadGoogleIdentityServices = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.reject(new Error('Google Identity Services needs a browser'));
    }

    const ready = getIdClient();
    if (ready !== null) {
        return Promise.resolve(ready);
    }

    if (loadPromise !== null) {
        return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
        const startedAt = Date.now();

        const poll = () => {
            const client = getIdClient();
            if (client !== null) {
                resolve(client);
                return;
            }
            if (Date.now() - startedAt > LOAD_TIMEOUT_MS) {
                // Reset so a later mount (or a retry after the user disables an
                // extension) gets a fresh attempt rather than the cached failure.
                loadPromise = null;
                reject(new Error('Google Identity Services did not load. It may be blocked by an extension or the network.'));
                return;
            }
            window.setTimeout(poll, 100);
        };

        if (document.querySelector('script[src="' + GSI_SRC + '"]') === null) {
            const script = document.createElement('script');
            script.src = GSI_SRC;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        poll();
    });

    return loadPromise;
};

/**
 * Translate a Google ID token into the session user the rest of the app reads.
 *
 * @param {string} credential The JWT from GIS (`response.credential`).
 * @returns {{googleId: string, email: string, name: string, givenName: string, familyName: string, imageUrl: string}}
 */
export const toSessionUser = (credential) => {
    const claims = jwt_decode(credential);
    return {
        googleId: claims.sub,
        email: claims.email,
        name: claims.name,
        givenName: claims.given_name,
        familyName: claims.family_name,
        imageUrl: claims.picture,
    };
};

/**
 * Render Google's own sign-in button into `container`.
 *
 * GIS draws the button inside an iframe, so unlike the old library there is no
 * way to supply custom markup for it -- appearance is configured through
 * `buttonOptions` (theme/size/shape/text/width) and nothing else.
 *
 * Synchronous, and separate from `loadGoogleIdentityServices` on purpose. The
 * caller needs somewhere to bail out between "script is ready" and "button is
 * drawn": `initialize` sets a single process-wide callback, so a caller that has
 * since unmounted must not get as far as calling it, or it would overwrite a
 * live callback with its own dead one and clicking the button would do nothing.
 *
 * @param {object} idClient         The `google.accounts.id` namespace.
 * @param {HTMLElement} container   Element to draw into. Emptied first.
 * @param {Function} onCredential   Called with the GIS credential response.
 * @param {object} [buttonOptions]  Overrides for renderButton's config.
 */
export const renderGoogleSignInButton = (idClient, container, onCredential, buttonOptions) => {
    idClient.initialize({
        client_id: currentGoogleLoginAPIKey,
        callback: onCredential,
        // No One Tap prompt: the only entry point is the button, so a returning
        // visitor is never signed in without having asked to be.
        auto_select: false,
        cancel_on_tap_outside: true,
        // NOTE: `initialize` has no `scope` option. A previous attempt at this
        // migration passed `scope: ['.../auth/user.birthday.read']` here, which GIS
        // silently ignores. Extra API scopes need google.accounts.oauth2 and a
        // separate consent step; the ID token below covers profile and email only.
    });

    // Guard against a repeat render leaving two stacked buttons.
    container.innerHTML = '';

    idClient.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin',
        shape: 'rectangular',
        logo_alignment: 'left',
        ...(buttonOptions || {}),
    });
};

/**
 * Store the session and record the login server-side.
 *
 * The server-side record was previously lost twice over. `EducationalBridgeHeader`
 * passes a `saveUserDetails` prop that posts to the backend, but both headers are
 * `connect`ed with a `saveUserDetails` of their own, and react-redux's default
 * merge puts dispatch props last -- so the parent's version was shadowed and the
 * POST never happened on sign-in. The one call site that did fire it (App.js) then
 * reloaded the page immediately without awaiting, cancelling the request in flight.
 *
 * Hence: post from here, and wait for it -- but only briefly, because being signed
 * in must not depend on the API being up.
 *
 * @param {object} user Session user from `toSessionUser`.
 */
export const completeGoogleSignIn = async (user) => {
    UserDetailsUtil.storeUserDetails(user);
    const recorded = UserAPIConnector.updateUserDetails(user);
    const timeout = new Promise((resolve) => {
        window.setTimeout(resolve, LOGIN_RECORD_TIMEOUT_MS);
    });
    await Promise.race([recorded, timeout]);
};

/**
 * Clear Google's client-side sign-in state.
 *
 * The old `GoogleLogout` component made a network round trip to Google and only
 * cleared the local session from its `onLogoutSuccess` callback, so a slow or
 * failed request left the user apparently still signed in. `disableAutoSelect` is
 * local and synchronous: it just tells GIS not to resume this account, which is
 * all that is needed given the session itself lives in sessionStorage.
 *
 * Deliberately NOT `revoke()`: that withdraws the app's consent entirely, so the
 * next sign-in would have to walk the consent screen again. Signing out is not
 * the same as revoking access.
 */
export const signOutOfGoogle = () => {
    const idClient = getIdClient();
    if (idClient === null) {
        return;
    }
    try {
        idClient.disableAutoSelect();
    } catch (error) {
        // Sign-out must never be blocked by Google's SDK. The local session is
        // cleared by the caller either way.
        logError('googleAuth.signOutOfGoogle', error);
    }
};
