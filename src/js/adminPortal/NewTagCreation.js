import React from 'react';
import { connect } from 'react-redux';
import {updateNewTagDetails } from '../../store/actions/solgressAction';
import TagReceiver from '../../apis/TagReceiver';
import { tagPrefixPairMap } from '../../constants/tagPrefixPairMap';
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import FormPage from '../../components/common/FormPage';
import FormField, { controlClasses } from '../../components/common/FormField';

// Tag creation.
//
// Tags are how every question on the platform is classified -- subject, chapter,
// topic, difficulty, year -- so the stored name has to follow the
// "<Prefix> : <Value>" convention exactly or the question will not appear under
// any filter. The form now shows the full name that will be saved as you type,
// because getting that convention wrong is silent and only discovered later when
// nothing matches.
//
// BUG FIXED
// ---------
// `submitNewTag` used to do `payload.tagName = payload.tagPrefix + payload.tagName`
// and then dispatch that mutated value back into the store. The prefix was
// therefore re-applied to the already-prefixed value on every subsequent submit,
// producing "Subject : Subject : Physics" the second time and worse thereafter.
// The composed name is now derived at submit time and never written back to the
// field state.

class NewTagCreation extends React.Component {

    constructor(props) {
        super(props)
        this.state = { errors: {}, isSubmitting: false }
    }

    componentDidMount() {
        if (this.props.newTagDetails === undefined) {
            this.initializeNewTagDetails();
        }
    }

    initializeNewTagDetails = () => {
        this.props.updateNewTagDetails({
            "tagName" : "",
            "tagDescription" : "",
            "tagPrefix" : "Subject : "
        })
    }

    updateField = (field, value) => {
        let payload = {...this.props.newTagDetails}
        payload[field] = value
        this.props.updateNewTagDetails(payload)
        if (this.state.errors[field]) {
            this.setState({ errors: {...this.state.errors, [field]: null} })
        }
    }

    /** Full name as it will be stored. Derived, never persisted into the field. */
    getComposedTagName = () => {
        const details = this.props.newTagDetails
        const prefix = details.tagPrefix || ''
        const value = (details.tagName || '').trim()
        return value.length === 0 ? '' : prefix + value
    }

    validate = () => {
        const details = this.props.newTagDetails
        const errors = {}
        const value = (details.tagName || '').trim()
        if (value.length === 0) {
            errors.tagName = 'A tag name is required.'
        } else if (value.includes(' : ')) {
            // The separator is structural. Allowing it inside the value would
            // create a tag that parses into the wrong dimension.
            errors.tagName = 'Remove the " : " separator; the tag type above supplies it.'
        }
        this.setState({ errors })
        return Object.keys(errors).length === 0
    }

    submitNewTag = () => {
        if (!this.validate()) {
            return
        }
        this.setState({ isSubmitting: true })
        const request = {
            ...this.props.newTagDetails,
            tagName: this.getComposedTagName(),
        }
        TagReceiver.upsertNewTag(request).then(()=>{
            notify.success('Tag "' + request.tagName + '" created.')
            // Cleared so the next tag starts from a clean field rather than the
            // previous value, which is what invited the double-prefix bug.
            this.props.updateNewTagDetails({
                tagName: '',
                tagDescription: '',
                tagPrefix: this.props.newTagDetails.tagPrefix,
            })
            this.setState({ isSubmitting: false })
        }).catch(()=>{
            notify.error('Could not create that tag. It may already exist.')
            this.setState({ isSubmitting: false })
        })
    }

    render() {
        if(typeof window == `undefined` || this.props.newTagDetails === undefined){
            return <div/>
        }
        const details = this.props.newTagDetails
        const composed = this.getComposedTagName()
        return <FormPage
            title="Create a tag"
            description="Tags classify questions so learners can filter by subject, chapter, topic, difficulty or year. Pick the type, then give the value on its own."
            backTo="questions"
            backLabel="Back to questions"
        >
            <div className="flex flex-col gap-5">
                <FormField
                    label="Tag type"
                    help="Determines which filter this tag will appear under."
                    required
                >
                    {(fieldProps) => (
                        <select
                            {...fieldProps}
                            className={controlClasses(false) + ' w-auto'}
                            value={details.tagPrefix}
                            onChange={(event) => this.updateField('tagPrefix', event.target.value)}
                        >
                            {tagPrefixPairMap.map((option) => (
                                <option key={option.prefix} value={option.prefix}>
                                    {option.inputPlaceholder}
                                </option>
                            ))}
                        </select>
                    )}
                </FormField>

                <FormField
                    label="Value"
                    help='Just the value, for example "Mathematics" or "Kinematics".'
                    error={this.state.errors.tagName}
                    required
                >
                    {(fieldProps) => (
                        <input
                            {...fieldProps}
                            placeholder="Enter the value"
                            value={details.tagName}
                            onChange={(event) => this.updateField('tagName', event.target.value)}
                        />
                    )}
                </FormField>

                {/* Live preview of the stored name. The convention is invisible and
                    unforgiving, so it is shown rather than explained. */}
                {composed.length > 0 &&
                    <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Will be saved as
                        </p>
                        <p className="mt-1 text-sm font-mono text-gray-800 break-words">{composed}</p>
                    </div>
                }

                <FormField
                    label="Description"
                    help="Optional. Helps other contributors use this tag consistently."
                >
                    {(fieldProps) => (
                        <textarea
                            {...fieldProps}
                            className={fieldProps.className + ' resize-none'}
                            placeholder="What does this tag mean?"
                            rows="4"
                            value={details.tagDescription}
                            onChange={(event) => this.updateField('tagDescription', event.target.value)}
                        />
                    )}
                </FormField>

                <div className="flex items-center gap-3 pt-1">
                    <Button
                        variant="primary"
                        onClick={this.submitNewTag}
                        disabled={this.state.isSubmitting}
                    >
                        {this.state.isSubmitting ? 'Creating…' : 'Create tag'}
                    </Button>
                </div>
            </div>
        </FormPage>
    }

}

const mapDispatchToProps = dispatch => ({
    updateNewTagDetails: (payload) => dispatch(updateNewTagDetails(payload))
})

const mapStateToProps = state => {
    return {
        newTagDetails: state.solgressReducer.newTagDetails
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewTagCreation);
