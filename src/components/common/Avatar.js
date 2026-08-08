import React from 'react';

// Person avatar with a graceful fallback.
//
// Contributor photos are added over time, so this never assumes an image
// exists: with no `src` (or if the file 404s) it renders the person's initials
// on a tinted surface instead of a broken-image icon or an empty circle. That
// means a contributor can be listed the moment they join and get a photo
// whenever they send one, with no code change.

const sizeClasses = {
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-24 h-24 text-2xl',
};

const getInitials = (name) => {
    if (!name) {
        return '?';
    }
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
};

class Avatar extends React.Component {

    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    render() {
        const { src, name, size = 'md', className = '' } = this.props;
        const dimension = sizeClasses[size] || sizeClasses.md;
        const shared = 'shrink-0 rounded-full overflow-hidden ' + dimension + ' ' + className;

        if (src && !this.state.failed) {
            return (
                <img
                    src={src}
                    alt={name}
                    className={shared + ' object-cover border border-gray-200 bg-gray-100'}
                    onError={() => this.setState({ failed: true })}
                    referrerPolicy="no-referrer"
                />
            );
        }

        return (
            <div
                className={shared + ' bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center font-bold tracking-tight'}
                aria-label={name}
                role="img"
            >
                {getInitials(name)}
            </div>
        );
    }
}

export default Avatar;
