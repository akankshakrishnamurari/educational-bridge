import React from 'react';

// Shared button primitive. Wraps plain <button> (not MUI Button) so it can be
// dropped into existing Tailwind-styled layouts without pulling in MUI's own
// spacing/elevation assumptions. Variants map to the design tokens in
// src/constants/designTokens.js.

const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500 border border-transparent',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 border border-transparent',
};

const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
};

const Button = ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    children,
    onClick,
    type = 'button',
    ...rest
}) => {
    const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors ' +
        'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const classes = [base, variantClasses[variant] || variantClasses.primary, sizeClasses[size] || sizeClasses.md, className]
        .filter(Boolean)
        .join(' ');
    return (
        <button type={type} className={classes} disabled={disabled} onClick={onClick} {...rest}>
            {children}
        </button>
    );
};

export default Button;
