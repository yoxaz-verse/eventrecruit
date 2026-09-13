const authMessages: Record<string, string> = {
  "configure-supabase":
    "Authentication is not configured. Confirm the server database credentials and app auth secret, then redeploy.",
};

export function resolveAuthMessage(message?: string, options?: { supabaseConfigured?: boolean }) {
  if (message === "configure-supabase" && options?.supabaseConfigured) {
    return undefined;
  }

  return message;
}

export function AuthMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  const displayMessage = authMessages[message] ?? message;

  return (
    <p className="alert" role="status">
      {displayMessage}
    </p>
  );
}
