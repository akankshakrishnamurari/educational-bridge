import React from 'react';

// Form field wrapper plus the shared control class strings.
//
// The same ~200 character input class string was pasted into every form on the
// platform (tag creation, channel creation, question authoring, paper authoring),
// which is why the controls had already begun to drift apart. Exporting the class
// strings means a change to focus rings or border colour happens once.
//
// Labels are wired to their control with htmlFor/id, so clicking the label focuses
// the field and screen readers announce the pair. None of the existing forms did
// this. Errors are linked through aria-describedby and aria-invalid rather than
// being colour-only.

export const controlBase =
    'w-full border rounded-lg px-3 py-2 text-sm shadow-sm text-gray-800 placeholder-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';

export const controlNeutral = 'border-gray-300 bg-white';
export const controlInvalid = 'border-danger-400 bg-danger-50';

/**
 * @param {boolean} hasError picks the border/background treatment
 */
export const controlClasses = (hasError = false) =>
    controlBase + ' ' + (hasError ? controlInvalid : controlNeutral);

let autoId = 0;
const nextId = () => {
    autoId += 1;
    return 'field-' + autoId;
};

class FormField extends React.Component {

    constructor(props) {
        super(props);
        // Generated once per instance so the label/control association is stable
        // across re-renders.
        this.fieldId = props.id || nextId();
    }

    render() {
        const {
            label,
            help = null,
            error = null,
            required = false,
            children,
            className = '',
        } = this.props;

        const describedBy = [];
        if (help) {
            describedBy.push(this.fieldId + '-help');
        }
        if (error) {
            describedBy.push(this.fieldId + '-error');
        }

        return (
            <div className={['flex flex-col gap-1.5', className].filter(Boolean).join(' ')}>
                <label
                    htmlFor={this.fieldId}
                    className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                >
                    {label}
                    {required &&
                        <span className="text-danger-600 ml-0.5" aria-hidden="true">*</span>
                    }
                </label>
                {help &&
                    <p id={this.fieldId + '-help'} className="text-xs text-gray-500 leading-relaxed">
                        {help}
                    </p>
                }
                {/* The control is supplied by the caller so this wrapper works for
                    input, textarea, select and richer editors alike. */}
                {typeof children === 'function'
                    ? children({
                        id: this.fieldId,
                        'aria-invalid': error ? 'true' : undefined,
                        'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
                        className: controlClasses(Boolean(error)),
                    })
                    : children
                }
                {error &&
                    <p id={this.fieldId + '-error'} className="text-xs font-medium text-danger-700">
                        {error}
                    </p>
                }
            </div>
        );
    }
}

export default FormField;
