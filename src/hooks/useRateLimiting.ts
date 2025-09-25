import { useRef } from 'react';

export const useRateLimiting = () => {
  // Rate limit toast: allow up to 2 toasts per minute
  const toastTimestampsRef = useRef<number[]>([]);
  
  // Per-user submission rate limiting: allow max 5 posts per minute
  const submissionTimestampsRef = useRef<number[]>([]);

  const canShowToast = () => {
    const now = Date.now();
    toastTimestampsRef.current = toastTimestampsRef.current.filter(
      (t) => now - t < 60_000
    );
    if (toastTimestampsRef.current.length >= 2) {
      return false;
    }
    toastTimestampsRef.current.push(now);
    return true;
  };

  const canSubmitQuestion = () => {
    const now = Date.now();
    submissionTimestampsRef.current = submissionTimestampsRef.current.filter(
      (t) => now - t < 60_000
    );
    if (submissionTimestampsRef.current.length >= 5) {
      return false;
    }
    submissionTimestampsRef.current.push(now);
    return true;
  };

  return {
    canShowToast,
    canSubmitQuestion,
  };
};
