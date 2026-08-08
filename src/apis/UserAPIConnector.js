import { currentHost } from '../constants/hostConfig';
import { requestJson, postJson } from './httpClient';

// User API. Resolves with `{data}` on success, `null` on any failure.

const encode = (value) => encodeURIComponent(value === null || value === undefined ? '' : value);

class UserAPIConnector {

    /**
     * Record the signed-in user server-side.
     *
     * The fetch was previously not awaited and the method returned "updated"
     * regardless, so a failure here was invisible and produced an unhandled
     * promise rejection. Sign-in deliberately does not block on this — the
     * session is already stored locally by the caller — but the request is now
     * awaited so a failure is logged rather than lost.
     */
    static updateUserDetails = async (userDetails) => {
        if (userDetails === null || userDetails === undefined) {
            return null;
        }
        return postJson('UserAPIConnector.updateUserDetails', currentHost + 'user/login/details', {
            googleId: userDetails.googleId,
            picture: userDetails.imageUrl,
            email: userDetails.email,
            name: userDetails.name,
            familyName: userDetails.familyName,
            givenName: userDetails.givenName,
        });
    }

    static getSuggestedUsers = async (userKey) => requestJson(
        'UserAPIConnector.getSuggestedUsers',
        currentHost + 'suggestion/users?search_key=' + encode(userKey) + '&start_index=0&page_size=100'
    )

}

export default UserAPIConnector;
