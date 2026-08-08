import React from 'react';
import Button from './Button';

// Confirmation dialog for irreversible actions.
//
// Submitting a timed paper previously navigated away on a single click, with no
// summary and no way back. That is the least reversible thing a learner can do on
// this platform, and it sat behind the same affordance as "next question".
//
// Accessibility: role="dialog" + aria-modal, labelled by its own heading, Escape
// closes, focus is moved to the panel on open, and the backdrop is click-to-
// dismiss. Body scroll is locked while open so the page behind does not move.

class ConfirmDialog extends React.Component {

    constructor(props) {
        super(props);
        this.panelRef = React.createRef();
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown);
        this.lockScroll();
        if (this.panelRef.current) {
            this.panelRef.current.focus();
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
        this.unlockScroll();
    }

    lockScroll = () => {
        this.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }

    unlockScroll = () => {
        document.body.style.overflow = this.previousOverflow || '';
    }

    handleKeyDown = (event) => {
        if (event.key === 'Escape' && this.props.onCancel) {
            this.props.onCancel();
        }
    }

    render() {
        const {
            title,
            description = null,
            confirmLabel = 'Confirm',
            cancelLabel = 'Cancel',
            confirmVariant = 'primary',
            onConfirm,
            onCancel,
            isBusy = false,
            children = null,
        } = this.props;

        return (
            <div className="fixed inset-0 z-max flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-gray-900/50"
                    onClick={onCancel}
                    aria-hidden="true"
                />
                <div
                    ref={this.panelRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-dialog-title"
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-5 md:p-6 focus:outline-none"
                >
                    <h2 id="confirm-dialog-title" className="text-lg font-bold text-gray-900">
                        {title}
                    </h2>
                    {description &&
                        <p className="mt-1.5 text-sm text-gray-600">{description}</p>
                    }
                    {children &&
                        <div className="mt-4">{children}</div>
                    }
                    <div className="mt-5 flex items-center justify-end gap-2">
                        <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
                            {cancelLabel}
                        </Button>
                        <Button variant={confirmVariant} onClick={onConfirm} disabled={isBusy}>
                            {isBusy ? 'Submitting…' : confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ConfirmDialog;
