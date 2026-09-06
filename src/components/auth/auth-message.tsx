const authMessages: Record<string, string> = {
  "configure-supabase":
    "This deployment is not connected to Supabase yet. Confirm the Supabase URL and anon key are set for this Vercel environment, then redeploy the project.",
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
