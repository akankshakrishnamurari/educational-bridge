// Production: frontend on Amplify (its own domain, HTTPS), backend on EC2 behind
// Nginx + Certbot at api.educationalbridge.com (HTTPS). Both origins must be
// HTTPS together or the browser blocks the API calls as mixed content.
export const currentHost = "https://api.educationalbridge.com/";
export const currentURLHost = "https://www.educationalbridge.com/";
export const currentGoogleLoginAPIKey = "507751144675-ohhj1kuot7abh3kuagobek74anhk016l.apps.googleusercontent.com";

// Local dev (frontend + backend both running on localhost). Swap the block
// above for this one when developing locally.
// export const currentHost = "http://localhost:8080/";
// export const currentURLHost = "http://localhost:3000/";
// export const currentGoogleLoginAPIKey = "507751144675-ohhj1kuot7abh3kuagobek74anhk016l.apps.googleusercontent.com";
