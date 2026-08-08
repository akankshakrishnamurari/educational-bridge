import React from 'react';
import { AiOutlineWarning } from 'react-icons/ai';
import Button from './Button';

// Shown when a request fails.
//
// Before this existed, a failed load left whatever the page used as its loading
// condition in place — usually a spinner — forever. The visitor had no way to
// tell a slow network from a broken one, and no way to retry short of reloading.
//
// `onRetry` is optional but strongly preferred: most failures here are transient
// (the API runs on a single EC2 host), so retrying in place is usually all that
// is needed.

const ErrorState = ({
    title = 'We couldn\u2019t load this',
    description = 'The connection may have dropped. This is usually temporary.',
    onRetry,
    retryLabel = 'Try again',
}) => (
    <div
        className="flex flex-col items-center justify-center text-center py-12 px-4"
        role="alert"
    >
        <div className="text-warning-500 mb-3">
            <AiOutlineWarning size={44} />
        </div>
        <div className="text-base font-semibold text-gray-800">{title}</div>
        {description && (
            <div className="text-sm text-gray-500 mt-1 max-w-sm">{description}</div>
        )}
        {onRetry && (
            <div className="mt-5">
                <Button variant="secondary" size="md" onClick={onRetry}>
                    {retryLabel}
                </Button>
            </div>
        )}
    </div>
);

export default ErrorState;
