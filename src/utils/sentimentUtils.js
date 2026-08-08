export class sentimentUtils {

    static deriveSentimentTagsFromUserTextInput(sentiment) {
        let tags = [];
        sentiment = sentiment.toLowerCase();
        if(sentiment.includes('suicid')) {
            tags.push('SUICIDE');
        }
        if(sentiment.includes('frustrat')) {
            tags.push('FRUSTRATION');
        }
        if(sentiment.includes('pressure')) {
            tags.push('HIGH_EXPECTATIONS');
        }
        if(sentiment.includes('strain') || sentiment.includes('tension') || sentiment.includes('tensed')) {
            tags.push('HIGH_EXPECTATIONS');
        }
        if(sentiment.includes('study')) {
            tags.push('STUDENT');
        }
        if(sentiment.includes('10th')) {
            tags.push('AGE_GROUP_12-15');
        }
        if(sentiment.includes('tenth class')) {
            tags.push('AGE_GROUP_12-15');
        }
        if(sentiment.includes('marks')) {
            tags.push('STUDY');
        }
        if(sentiment.includes('grades')) {
            tags.push('STUDY');
        }
        if(sentiment.includes('feeling low')) {
            tags.push('FRUSTRATION');
            tags.push('FRUSTRATION');
        }
        if(sentiment.includes('not underst') || sentiment.includes('nervous') ) {
            tags.push('UNDER_DOUBT');
        }
        return tags;
    }
}