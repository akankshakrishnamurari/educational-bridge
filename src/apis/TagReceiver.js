import { currentHost } from './../constants/hostConfig';
import { requestJson, postJson } from './httpClient';

// Tag API. Resolves with `{data}` on success, `null` on any failure.
//
// `upsertNewTag` previously did not await its fetch and returned "updated"
// unconditionally, so creating a tag reported success even when the request
// failed. Values were also concatenated raw into the query string, so a tag name
// containing & or # truncated the request.

const encode = (value) => encodeURIComponent(value === null || value === undefined ? '' : value);

class TagReceiver {

    static getSuggestedTags = async (tagSearchKey) => requestJson(
        'TagReceiver.getSuggestedTags',
        currentHost + 'suggestion/tags?tag_pattern=' + encode(tagSearchKey) + '&start_index=0&page_size=5'
    )

    static getUserResourceCreationTag = async (email) => requestJson(
        'TagReceiver.getUserResourceCreationTag',
        currentHost + 'tag/user/resource/creation?email=' + encode(email)
    )

    static upsertNewTag = async (tagData) => postJson(
        'TagReceiver.upsertNewTag',
        currentHost + 'tag?tag_name=' + encode(tagData && tagData.tagName)
            + '&tag_description=' + encode(tagData && tagData.tagDescription)
    )

}

export default TagReceiver;
