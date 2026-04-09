'use client';

import { useMemo, useRef } from 'react';

export function OtpInput({ value, onChange, length = 6, label = 'One-time password' }) {
  const refs = useRef([]);
  const digits = useMemo(() => Array.from({ length }, (_, index) => value[index] || ''), [length, value]);

  function updateAt(index, nextValue) {
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    onChange(nextDigits.join(''));
  }

  function focusInput(index) {
    const target = refs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  }

  function handleChange(index, event) {
    const nextValue = event.target.value.replace(/\D/g, '').slice(-1);
    updateAt(index, nextValue);
    if (nextValue && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    onChange(pasted);
    focusInput(Math.min(pasted.length, length) - 1);
  }

  return (
    <div className="zlon-otp-block" aria-label={label} onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          className="zlon-otp-cell"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
