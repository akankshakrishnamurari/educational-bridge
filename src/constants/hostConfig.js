// Production: frontend served from educationalbridge.com via the EC2 box
// (Nginx + Certbot, same host as the API) reverse-proxying to the Amplify
// app's default domain -- see infra/AWS_INFRA.md for why this bypasses
// Amplify's managed custom-domain/CloudFront flow (blocked by an AWS account
// verification gate on CreateDistribution). Backend is the same EC2 host at
// api.educationalbridge.com (HTTPS). Both origins must be HTTPS together or
// the browser blocks the API calls as mixed content.
export const currentHost = "https://api.educationalbridge.com/";
export const currentURLHost = "https://educationalbridge.com/";
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
