export const AUTH_BOOTSTRAP_TIMEOUT_MS = 30000

const VALID_AUTH_STEPS = new Set(['phone', 'phone-otp', 'email', 'email-otp']);

export function getSafeAuthStep(step) {
  return VALID_AUTH_STEPS.has(step) ? step : 'phone';
}

export function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

export function withTimeout(promise, timeoutMs, message) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
