// Production: frontend on Amplify (its own domain, HTTPS), backend on EC2 behind
// Nginx + Certbot at api.educationalbridge.com (HTTPS). Both origins must be
// HTTPS together or the browser blocks the API calls as mixed content.
//
// currentURLHost is temporarily the raw Amplify domain, NOT
// www.educationalbridge.com. The custom domain's CNAME is stuck behind an
// AWS-side CloudFront "alias already in use by another distribution" issue
// (see infra/AWS_INFRA.md) and does not resolve to a working site yet.
// Every internal link in the app is built from currentURLHost, so pointing
// it at the broken custom domain sends users to a dead link on every click.
// Switch this back to https://www.educationalbridge.com/ once that domain
// association reaches AVAILABLE in Amplify.
export const currentHost = "https://api.educationalbridge.com/";
export const currentURLHost = "https://main.d2oetkkpgv0e71.amplifyapp.com/";
// The OAuth 2.0 Web application client from Google Cloud Console -> APIs &
// Services -> Credentials. One client covers every environment; what has to be
// per-environment is its "Authorized JavaScript origins" list, which must contain
// every origin the app is served from (http://localhost:3000 for dev, the Amplify
// domain and the custom domain for production). Google matches on origin, and an
// origin that is not listed is what produces:
//
//     Error 400: redirect_uri_mismatch
//
// REACT_APP_GOOGLE_CLIENT_ID overrides this at build time (Create React App
// inlines REACT_APP_* vars), so the client can be rotated or pointed at a
// separate test client from Amplify's environment variables without a code
// change. The literal stays as the default so a plain `npm start` still works.
export const currentGoogleLoginAPIKey = process.env.REACT_APP_GOOGLE_CLIENT_ID
    || "507751144675-ohhj1kuot7abh3kuagobek74anhk016l.apps.googleusercontent.com";

// Local dev (frontend + backend both running on localhost). Swap the two host
// lines above for these when developing locally. The Google client ID above needs
// no change — just make sure http://localhost:3000 is one of its authorized
// JavaScript origins.
// export const currentHost = "http://localhost:8080/";
// export const currentURLHost = "http://localhost:3000/";
