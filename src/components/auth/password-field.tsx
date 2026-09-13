"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { checkNewPassword, MIN_NEW_PASSWORD_LENGTH } from "@/lib/password-strength";

export function PasswordField({
  name = "password",
  label = "Password",
  autoComplete = "current-password",
  showStrength = false,
}: {
  name?: string;
  label?: string;
  autoComplete?: string;
  showStrength?: boolean;
}) {
  const id = useId();
  const feedbackId = `${id}-feedback`;
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState<ReturnType<typeof checkNewPassword> | null>(null);

  return (
    <div className="password-field">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          autoComplete={autoComplete}
          aria-describedby={showStrength ? feedbackId : undefined}
          className="input"
          id={id}
          minLength={showStrength ? MIN_NEW_PASSWORD_LENGTH : undefined}
          name={name}
          onChange={showStrength ? (event) => {
            const value = event.currentTarget.value;
            const result = value ? checkNewPassword(value) : null;
            setFeedback(result);
            event.currentTarget.setCustomValidity(result && !result.strong ? result.reason : "");
          } : undefined}
          required
          type={visible ? "text" : "password"}
        />
        <button
          aria-controls={id}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="password-visibility"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      </div>
      {showStrength ? (
        <div className="password-strength" id={feedbackId} aria-live="polite">
          <div
            aria-label="Password strength"
            className="password-strength-meter"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={feedback?.score ?? 0}
            aria-valuetext={feedback?.strong ? "Strong" : "Needs improvement"}
          >
            {[0, 1, 2, 3].map((segment) => (
              <span
                className={feedback && segment < (feedback.strong ? feedback.score : Math.max(1, feedback.score)) ? (feedback.strong ? "is-strong" : "is-weak") : ""}
                key={segment}
              />
            ))}
          </div>
          <p className={feedback?.strong ? "password-strength-good" : ""}>
            {feedback?.reason ?? `Use at least ${MIN_NEW_PASSWORD_LENGTH} characters and a hard-to-guess password or passphrase.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
