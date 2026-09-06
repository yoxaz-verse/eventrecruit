function readEnv(name: string) {
  return process.env[name]?.trim();
}

export function getSupabaseServerConfig() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? readEnv("SUPABASE_ANON_KEY");

  return {
    anonKey,
    isConfigured: Boolean(url && anonKey),
    url,
  };
}

export function getAppUrl(requestOrigin?: string) {
  const explicitUrl = readEnv("NEXT_PUBLIC_APP_URL") ?? readEnv("APP_URL");
  const vercelUrl = readEnv("VERCEL_URL");

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return requestOrigin?.replace(/\/$/, "") ?? "http://localhost:3000";
}
