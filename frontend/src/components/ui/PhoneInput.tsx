import { useState, useEffect, useId } from 'react';
import { cn } from '../../utils/cn';

interface PhoneInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    className?: string;
}

export const PhoneInput = ({ label, value, onChange, placeholder, required, error, className }: PhoneInputProps) => {
    const countryCodeId = useId();
    const phoneId = useId();

    // Initialize country code and local number
    const [countryCode, setCountryCode] = useState('+91');
    const [localNumber, setLocalNumber] = useState('');

    // Synchronize internal state with external value prop
    useEffect(() => {
        if (value) {
            const parts = value.split(' ');
            if (parts.length >= 2) {
                setCountryCode(parts[0]);
                setLocalNumber(parts.slice(1).join(' '));
            } else if (value.startsWith('+')) {
                // If it's just +91 without a space yet
                setCountryCode(value.substring(0, 3));
                setLocalNumber(value.substring(3));
            } else {
                setLocalNumber(value);
            }
        }
    }, [value]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        onChange(`${newCode} ${localNumber}`.trim());
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value;
        setLocalNumber(newNumber);
        onChange(`${countryCode} ${newNumber}`.trim());
    };

    return (
        <div className={cn("flex flex-col gap-1.5 w-full", className)}>
            {label && (
                <label htmlFor={phoneId} className="text-sm font-semibold text-slate-700 ml-1">
                    {label}
                </label>
            )}
            <div className="flex gap-2 w-full min-w-0">
                <input
                    type="text"
                    id={countryCodeId}
                    value={countryCode}
                    onChange={handleCodeChange}
                    aria-label="Country Code"
                    className="w-16 min-w-[4rem] px-2 py-2.5 rounded-xl border border-slate-200 bg-white text-center font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 transition-all"
                    placeholder="+91"
                />
                <input
                    type="tel"
                    id={phoneId}
                    value={localNumber}
                    onChange={handleNumberChange}
                    aria-label="Phone Number"
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 bg-white placeholder:text-slate-500 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder={placeholder || "9876543210"}
                    required={required}
                />
            </div>
            {error && <span className="text-xs text-red-500 ml-1 mt-0.5 font-medium">{error}</span>}
        </div>
    );
};
