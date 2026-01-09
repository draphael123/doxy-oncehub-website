import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-emerald-500 to-teal-500 text-white
        hover:from-emerald-400 hover:to-teal-400
        focus:ring-emerald-500 shadow-lg shadow-emerald-500/20
      `,
      secondary: `
        bg-slate-700 text-slate-100 border border-slate-600
        hover:bg-slate-600 hover:border-slate-500
        focus:ring-slate-500
      `,
      ghost: `
        text-slate-300 hover:text-slate-100 hover:bg-slate-700/50
        focus:ring-slate-500
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-500
        focus:ring-red-500 shadow-lg shadow-red-500/20
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

