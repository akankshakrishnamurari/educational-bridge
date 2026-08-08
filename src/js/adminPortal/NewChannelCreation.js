import React from 'react';
import { connect } from 'react-redux';
import {updateNewChannelDetails} from '../../store/actions/solgressAction';
import ChannelReceiver from '../../apis/ChannelReceiver';
import notify from '../../utils/notify';
import Button from '../../components/common/Button';
import FormPage from '../../components/common/FormPage';
import FormField from '../../components/common/FormField';
import { currentURLHost } from '../../constants/hostConfig';

// Channel creation.
//
// Shares the FormPage/FormField shell with tag creation instead of repeating the
// page scaffold and the control class strings, which had already begun to diverge
// between the two.
//
// Adds what the form previously lacked: a required-name check before submitting, a
// disabled state while the request is in flight, a cleared form afterwards, and a
// link onward to the channel directory so creating one is not a dead end.

class NewChannelCreation extends React.Component {

    constructor(props) {
        super(props)
        this.state = { errors: {}, isSubmitting: false, createdName: null };
    }

    componentDidMount() {
        if (this.props.newChannelDetails === undefined) {
            this.initializeNewChannelDetails();
        }
    }

    initializeNewChannelDetails = () => {
        this.props.updateNewChannelDetails({
            "channelName" : "",
            "channelDescription" : ""
        });
    }

    updateField = (field, value) => {
        let payload = {...this.props.newChannelDetails}
        payload[field] = value;
        this.props.updateNewChannelDetails(payload);
        if (this.state.errors[field]) {
            this.setState({ errors: {...this.state.errors, [field]: null} });
        }
    }

    validate = () => {
        const errors = {};
        const name = (this.props.newChannelDetails.channelName || '').trim();
        if (name.length === 0) {
            errors.channelName = 'A channel name is required.';
        }
        this.setState({ errors });
        return Object.keys(errors).length === 0;
    }

    submitNewChannel = () => {
        if (!this.validate()) {
            return;
        }
        this.setState({ isSubmitting: true });
        const name = (this.props.newChannelDetails.channelName || '').trim();
        ChannelReceiver.upsertChannel({
            channelName: name,
            channelDescription: (this.props.newChannelDetails.channelDescription || '').trim(),
        }).then((result)=>{
            if (result == null) {
                notify.error('Could not create that channel. The name may already be taken.');
                this.setState({ isSubmitting: false });
                return;
            }
            notify.success('Channel "' + name + '" created.');
            this.props.updateNewChannelDetails({ channelName: '', channelDescription: '' });
            this.setState({ isSubmitting: false, createdName: name });
        });
    }

    render() {
        if(typeof window == `undefined` || this.props.newChannelDetails === undefined){
            return <div/>;
        }
        const details = this.props.newChannelDetails;
        return <FormPage
            title="Create a channel"
            description="Channels group questions by course, batch or creator. Learners can open a channel and practise only its questions."
            backTo="channels"
            backLabel="Back to channels"
            footer={this.state.createdName
                ? <div className="rounded-xl bg-success-50 border border-success-200 px-4 py-3">
                    <p className="text-sm text-success-800">
                        <span className="font-semibold">{this.state.createdName}</span> was created.
                    </p>
                    <a
                        href={currentURLHost + 'channels'}
                        className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-success-700 hover:text-success-800"
                    >
                        See it in the directory
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                </div>
                : null
            }
        >
            <div className="flex flex-col gap-5">
                <FormField
                    label="Channel name"
                    help="How learners will find it, for example a course, batch or your own name."
                    error={this.state.errors.channelName}
                    required
                >
                    {(fieldProps) => (
                        <input
                            {...fieldProps}
                            placeholder="Enter a channel name"
                            value={details.channelName}
                            onChange={(event) => this.updateField('channelName', event.target.value)}
                        />
                    )}
                </FormField>

                <FormField
                    label="Description"
                    help="Optional. Explain who this channel is for and what it covers."
                >
                    {(fieldProps) => (
                        <textarea
                            {...fieldProps}
                            className={fieldProps.className + ' resize-none'}
                            placeholder="What is this channel for?"
                            rows="4"
                            value={details.channelDescription}
                            onChange={(event) => this.updateField('channelDescription', event.target.value)}
                        />
                    )}
                </FormField>

                <div className="flex items-center gap-3 pt-1">
                    <Button
                        variant="primary"
                        onClick={this.submitNewChannel}
                        disabled={this.state.isSubmitting}
                    >
                        {this.state.isSubmitting ? 'Creating…' : 'Create channel'}
                    </Button>
                </div>
            </div>
        </FormPage>;
    }

}

const mapDispatchToProps = dispatch => ({
    updateNewChannelDetails: (payload) => dispatch(updateNewChannelDetails(payload))
})

const mapStateToProps = state => {
    return {
        newChannelDetails: state.solgressReducer.newChannelDetails
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewChannelCreation);
