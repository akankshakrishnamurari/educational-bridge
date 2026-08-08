import { createStore } from 'redux';
import rootReducer from './reducers/rootReducer';

// Store setup.
//
// No middleware is installed, and that is deliberate: every creator in
// store/actions/solgressAction.js returns a plain object. If an async action is
// ever needed, apply redux-thunk here first — dispatching a function without it
// throws "Actions must be plain objects".
//
// WHAT WAS WRONG BEFORE
// ---------------------
// `redux-thunk` and `applyMiddleware` were both imported and neither was used,
// which read as if thunks were supported when they were not.
//
// The devtools hook was passed as createStore's SECOND argument. That slot is
// `preloadedState`; redux only treats it as the enhancer when the value is a
// function. The value passed was `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__()`, which
// returns a `compose` function, not a store enhancer — so redux called
// `compose(createStore)(reducer)`. That happened not to break only because
// compose with a single function returns that function unchanged, meaning the
// devtools never actually attached. `__REDUX_DEVTOOLS_EXTENSION__()` is the real
// enhancer, so it is used here instead.
//
// There was also a `initialState = {state: "hello"}` default parameter that was
// never read, since the argument was never forwarded to createStore.
export default function configureStore() {
    const devtoolsHook =
        typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__;

    return createStore(
        rootReducer,
        typeof devtoolsHook === 'function' ? devtoolsHook() : undefined
    );
}
