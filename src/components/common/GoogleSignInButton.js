import React, { useEffect, useRef, useState } from 'react';
import {
    loadGoogleIdentityServices,
    renderGoogleSignInButton,
    toSessionUser,
} from '../../utils/googleAuth';
import { logError } from '../../utils/logger';

/*
  The sign-in control, shared by both headers.

  Google Identity Services draws this button itself, inside an iframe, so there is
  no `render` prop here and no way to restyle it — that is a constraint of the SDK,
  not a choice. Appearance is configured through `buttonOptions`, which is passed
  straight to `renderButton` (theme, size, shape, text, width, type: 'icon' for a
  compact icon-only variant).

  The old control was a custom-styled button wired to `react-google-login`. It
  looked closer to the rest of the header, but it ran on the platform library
  Google has since blocked, so clicking it produced "Access blocked: this app's
  request is invalid" and nothing else.

  If the GIS script cannot load at all — an extension blocking accounts.google.com
  is the common case — a plain message takes the button's place. Previously that
  situation rendered a button that silently did nothing when clicked.
*/

const GoogleSignInButton = ({ onSignIn, onError, buttonOptions, className }) => {
    const containerRef = useRef(null);
    const [hasLoadFailed, setHasLoadFailed] = useState(false);

    // `onSignIn`/`onError` are read through refs so a parent re-render (the headers
    // re-render on every keystroke in the search box) does not tear down and redraw
    // Google's iframe, which flickers and loses the button's focus.
    const onSignInRef = useRef(onSignIn);
    const onErrorRef = useRef(onError);
    onSignInRef.current = onSignIn;
    onErrorRef.current = onError;

    useEffect(() => {
        const container = containerRef.current;
        if (container === null) {
            return undefined;
        }

        let isCancelled = false;

        const handleCredential = (response) => {
            if (isCancelled) {
                return;
            }
            if (!response || !response.credential) {
                // A dismissed popup arrives here with no credential. That is a
                // cancellation, not a failure, so it is not reported to the user.
                return;
            }
            try {
                onSignInRef.current(toSessionUser(response.credential));
            } catch (error) {
                logError('GoogleSignInButton.handleCredential', error);
                if (typeof onErrorRef.current === 'function') {
                    onErrorRef.current(error);
                }
            }
        };

        loadGoogleIdentityServices()
            .then((idClient) => {
                // Bail out before `initialize`, not after: it registers a single
                // process-wide callback, so an unmounted instance that got this far
                // would clobber the callback of whichever instance replaced it.
                if (isCancelled) {
                    return;
                }
                renderGoogleSignInButton(idClient, container, handleCredential, buttonOptions);
            })
            .catch((error) => {
                if (isCancelled) {
                    return;
                }
                logError('GoogleSignInButton.render', error);
                setHasLoadFailed(true);
                if (typeof onErrorRef.current === 'function') {
                    onErrorRef.current(error);
                }
            });

        return () => {
            isCancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (hasLoadFailed) {
        return (
            <div className={'text-xs text-gray-500 max-w-[12rem] ' + (className || '')} role="alert">
                Google sign-in couldn&rsquo;t load. Check for a blocker on
                accounts.google.com, then reload.
            </div>
        );
    }

    return <div ref={containerRef} className={className} />;
};

export default GoogleSignInButton;
