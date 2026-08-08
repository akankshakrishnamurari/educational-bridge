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
export const currentGoogleLoginAPIKey = "507751144675-ohhj1kuot7abh3kuagobek74anhk016l.apps.googleusercontent.com";

// Local dev (frontend + backend both running on localhost). Swap the block
// above for this one when developing locally.
// export const currentHost = "http://localhost:8080/";
// export const currentURLHost = "http://localhost:3000/";
// export const currentGoogleLoginAPIKey = "507751144675-ohhj1kuot7abh3kuagobek74anhk016l.apps.googleusercontent.com";
