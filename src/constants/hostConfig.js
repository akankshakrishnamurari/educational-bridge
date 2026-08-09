// Production: frontend served from educationalbridge.com via the EC2 box
// (Nginx + Certbot, same host as the API) reverse-proxying to the Amplify
// app's default domain -- see infra/AWS_INFRA.md for why this bypasses
// Amplify's managed custom-domain/CloudFront flow (blocked by an AWS account
// verification gate on CreateDistribution). Backend is the same EC2 host at
// api.educationalbridge.com (HTTPS). Both origins must be HTTPS together or
// the browser blocks the API calls as mixed content.
export const currentHost = "https://api.educationalbridge.com/";
export const currentURLHost = "https://educationalbridge.com/";
// The OAuth 2.0 Web application client, from Google Cloud Console -> Google Auth
// Platform -> Clients (project `edforces`, number 507751144675 — the digits in
// front of the dash below are that project number).
//
// This is the client named "educationalbridge.com prod". The project holds more
// than one web client, and the app used to point at a different one
// (`...-ohhj1kuot7abh3kuagobek74anhk016l`) that still carried only the origins
// from before the site was renamed. That mismatch is what produced
//
//     Error 400: redirect_uri_mismatch
//
// Google validates the calling page's origin on every sign-in, against the
// "Authorized JavaScript origins" list on *this specific client*. So the list
// must contain every origin the app is served from — https://educationalbridge.com
// and https://www.educationalbridge.com in production, http://localhost:3000 for
// dev — and changing currentURLHost above is never just a code change. See the
// Google sign-in section of infra/AWS_INFRA.md.
//
// The client secret shown alongside this client in the console is irrelevant here
// and must never be added to this file: a browser cannot keep a secret, which is
// why the ID-token flow uses only the client ID.
//
// REACT_APP_GOOGLE_CLIENT_ID overrides this at build time (Create React App
// inlines REACT_APP_* vars), so the client can be rotated or pointed at a
// separate test client from Amplify's environment variables without a code
// change. The literal stays as the default so a plain `npm start` still works.
export const currentGoogleLoginAPIKey = process.env.REACT_APP_GOOGLE_CLIENT_ID
    || "507751144675-ds2pieq6ave04u6qv8d5esb2fpj352bd.apps.googleusercontent.com";

// Local dev (frontend + backend both running on localhost). Swap the two host
// lines above for these when developing locally. The Google client ID above needs
// no change — just make sure http://localhost:3000 is one of its authorized
// JavaScript origins.
// export const currentHost = "http://localhost:8080/";
// export const currentURLHost = "http://localhost:3000/";
