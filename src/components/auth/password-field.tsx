export function PasswordField({
  name = "password",
  label = "Password",
  autoComplete = "current-password",
}: {
  name?: string;
  label?: string;
  autoComplete?: string;
}) {
  return (
    <label className="label">
      {label}
      <input
        autoComplete={autoComplete}
        className="input"
        minLength={8}
        name={name}
        required
        type="password"
      />
    </label>
  );
}
