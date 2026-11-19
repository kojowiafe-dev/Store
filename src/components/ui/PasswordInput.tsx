'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  autoComplete?: string;
  id?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  minLength,
  required = true,
  autoComplete,
  id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs sm:text-sm pl-3.5 pr-20 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-neutral-600 hover:text-ug-navy bg-neutral-100/90 hover:bg-neutral-200/70 transition-colors cursor-pointer select-none"
      >
        {visible ? (
          <>
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span>Show</span>
          </>
        )}
      </button>
    </div>
  );
}
