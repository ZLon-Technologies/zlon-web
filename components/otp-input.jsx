'use client';

import { cloneElement, useMemo, useRef } from 'react';

export function OtpInput({
  value,
  onChange,
  length = 6,
  numInputs,
  label = 'One-time password',
  className = 'zlon-otp-block',
  inputClassName = 'zlon-otp-cell',
  renderInput
}) {
  const inputCount = Number(numInputs) || length;
  const refs = useRef([]);
  const digits = useMemo(() => Array.from({ length: inputCount }, (_, index) => value[index] || ''), [inputCount, value]);

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
    if (nextValue && index < inputCount - 1) {
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

    if (event.key === 'ArrowRight' && index < inputCount - 1) {
      focusInput(index + 1);
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, inputCount);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    onChange(pasted);
    focusInput(Math.min(pasted.length, inputCount) - 1);
  }

  return (
    <div className={className} aria-label={label} onPaste={handlePaste}>
      {digits.map((digit, index) => (
        (() => {
          const inputProps = {
            ref: (node) => {
              refs.current[index] = node;
            },
            className: inputClassName,
            inputMode: 'numeric',
            autoComplete: index === 0 ? 'one-time-code' : 'off',
            maxLength: 1,
            value: digit,
            onChange: (event) => handleChange(index, event),
            onKeyDown: (event) => handleKeyDown(index, event),
            'aria-label': `OTP digit ${index + 1}`
          };

          if (!renderInput) {
            return <input key={index} {...inputProps} />;
          }

          return cloneElement(renderInput(inputProps), { key: index });
        })()
      ))}
    </div>
  );
}
