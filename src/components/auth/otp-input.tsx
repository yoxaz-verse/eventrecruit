export function OtpInput() {
  return (
    <label className="label">
      OTP code
      <input
        autoComplete="one-time-code"
        className="input otp-input"
        inputMode="numeric"
        maxLength={6}
        minLength={6}
        name="token"
        pattern="[0-9]{6}"
        placeholder="000000"
        required
      />
    </label>
  );
}
