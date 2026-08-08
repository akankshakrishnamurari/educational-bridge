export class UserDetailsUtil {

    /**
     * Parsed session user, or null when nobody is signed in.
     *
     * Several pages previously did `JSON.parse(window.sessionStorage.userDetails)`
     * inline. When signed out that value is undefined and JSON.parse throws a
     * SyntaxError, which took down the whole page rather than showing a
     * sign-in prompt. Everything now goes through here.
     */
    static getUserDetails = () => {
        if (typeof window === 'undefined') {
            return null;
        }
        const raw = window.sessionStorage.userDetails;
        if (raw === "null" || raw === null || raw === undefined || raw === "") {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (err) {
            // Corrupt session payload is treated as signed out rather than fatal.
            return null;
        }
    }

    /**
     * Persist the signed-in user.
     *
     * Both headers used to inline this write, with the sign-in and sign-out paths
     * spelling the key and the "signed out" sentinel out by hand in four places.
     */
    static storeUserDetails = (userDetails) => {
        if (typeof window === 'undefined') {
            return;
        }
        window.sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
    }

    /**
     * Drop the session. Writes the string "null" rather than removing the key,
     * because that is the sentinel getUserDetails has always understood.
     */
    static clearUserDetails = () => {
        if (typeof window === 'undefined') {
            return;
        }
        window.sessionStorage.setItem('userDetails', 'null');
    }

    static getUserGoogleId = () => {
        const details = UserDetailsUtil.getUserDetails();
        return details == null ? null : (details.googleId || null);
    }

    static getUserEmail = () => {
        const details = UserDetailsUtil.getUserDetails();
        return details == null ? null : (details.email || null);
    }

    static isSignedIn = () => UserDetailsUtil.getUserDetails() != null;

}
