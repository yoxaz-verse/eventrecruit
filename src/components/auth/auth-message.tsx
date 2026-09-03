export function AuthMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="alert" role="status">
      {message}
    </p>
  );
}
