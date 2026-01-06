import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={inputId} className="text-sm font-semibold text-slate-700 ml-1">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    "w-full min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 bg-white placeholder:text-slate-500 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500",
                    error && "border-red-500 focus:ring-red-500/10 focus:border-red-500",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-red-500 ml-1 mt-0.5 font-medium">{error}</span>}
        </div>
    );
};
