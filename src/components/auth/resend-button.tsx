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
    <button className="button button-secondary" disabled={disabled || pending || seconds > 0} type="submit">
      {pending ? "Requesting code…" : seconds > 0 ? `Request another code in ${seconds}s` : "Send another code"}
    </button>
  );
}
