import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App';
import configureStore from './store/store';
import route from './route';

// This file was the stock Create React App test — it rendered <App/> with no Router
// and asserted on a "learn react" link that this app has never contained. Both
// halves were wrong, so it had failed since the project was scaffolded: App renders
// <Routes>, and react-router throws "useRoutes() may be used only in the context of
// a <Router>" the moment it mounts outside one. A permanently red suite is the same
// as no suite, because nobody reads the output.
//
// Replaced with assertions about things that are actually true of the routing shell,
// since routing is all App does.

const renderAt = (path) => render(
    <Provider store={configureStore()}>
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>
    </Provider>
);

describe('App routing shell', () => {
    it('renders the route matching the current location', () => {
        const { container } = renderAt('/');
        // The shell contributes only the wrapper div, so anything inside it was
        // produced by the matched route.
        const shell = container.querySelector('.App');
        expect(shell).not.toBeNull();
        expect(shell.childElementCount).toBeGreaterThan(0);
    });

    it('shows the not-found page for an address that matches nothing', () => {
        renderAt('/no-such-page-exists');
        expect(screen.getByText(/couldn.t find that page/i)).toBeInTheDocument();
    });

    it('does not let the catch-all shadow a real route', () => {
        // React Router v6 ranks "*" below every concrete path, so declaration order
        // does not matter — but that is a property of the router, not of this file, so
        // it is worth pinning: a regression here would 404 the whole site.
        renderAt('/aboutus');
        expect(screen.queryByText(/couldn.t find that page/i)).toBeNull();
    });

    it('declares a unique path for every route', () => {
        // App keys routes by `path`. Duplicates would collide onto one React key and
        // the later declaration would silently win.
        const paths = route.map((entry) => entry.path);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it('gives every route both a path and an element', () => {
        route.forEach((entry) => {
            expect(typeof entry.path).toBe('string');
            expect(entry.path.length).toBeGreaterThan(0);
            expect(entry.element).toBeTruthy();
        });
    });
});
