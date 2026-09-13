"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function ResendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <button className="button button-secondary" data-pending={pending || undefined} disabled={disabled || seconds > 0} aria-disabled={disabled || pending || seconds > 0} onClick={pending ? (event) => event.preventDefault() : undefined} type="submit">
      {pending ? <><span className="button-spinner" aria-hidden="true" /><span role="status">Requesting code…</span></> : seconds > 0 ? `Request another code in ${seconds}s` : "Send another code"}
    </button>
  );
}
