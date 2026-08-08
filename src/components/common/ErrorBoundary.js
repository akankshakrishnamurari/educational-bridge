import React from 'react';
import { logError } from '../../utils/logger';
import { typography, layout } from '../../constants/designTokens';
import Button from './Button';

// Catches render-time exceptions so one broken component cannot blank the app.
//
// WHY THIS EXISTS
// ---------------
// There was no error boundary anywhere in the tree. In React, an exception thrown
// during render, in a lifecycle method, or in a constructor unmounts the whole
// tree — so a single bad field in one API response produced a completely white
// page with nothing but a console message the visitor will never see.
//
// That was not a hypothetical: several of the crashes fixed elsewhere in this
// codebase (reading `.data` off a failed request, `.questions` off an undefined
// slice, a tag id with no matching tag) all reached the user as a blank screen,
// which is indistinguishable from the site being down.
//
// Error boundaries only catch errors thrown during rendering. They do NOT catch
// errors in event handlers or in async callbacks — those need try/catch at the
// call site, which is what apis/httpClient.js provides.
class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // componentStack is the React tree at the point of the throw, which is far
        // more useful than the JS stack for locating the offending component.
        logError('ErrorBoundary', error, {
            componentStack: errorInfo && errorInfo.componentStack,
        });
    }

    reload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError !== true) {
            return this.props.children;
        }
        // Deliberately no error text, stack or component name: the visitor cannot
        // act on any of it, and a stack trace on screen leaks internals. The detail
        // goes to the logger instead.
        return <div className='bg-gray-50 min-h-screen flex items-center justify-center'>
            <div className={layout.reading + ' py-16 text-center'}>
                <h1 className={typography.h1}>Something went wrong on this page</h1>
                <p className='mt-3 text-sm text-gray-500'>
                    The rest of the site is unaffected. Reloading usually clears it.
                </p>
                <div className='mt-6 flex items-center justify-center gap-3'>
                    <Button variant="primary" onClick={this.reload}>
                        Reload this page
                    </Button>
                    <Button variant="secondary" onClick={() => { window.location.href = '/'; }}>
                        Go to home
                    </Button>
                </div>
            </div>
        </div>;
    }

}

export default ErrorBoundary;
