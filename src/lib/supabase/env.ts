function readEnv(name: string) {
  return process.env[name]?.trim();
}

export function getSupabaseServerConfig() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL");

  return {
    isConfigured: Boolean(url && readEnv("SUPABASE_SERVICE_ROLE_KEY") && readEnv("APP_AUTH_SECRET")),
    url,
  };
}

export function getSupabaseAdminConfig() {
  const { url } = getSupabaseServerConfig();
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    isConfigured: Boolean(url && serviceRoleKey),
    serviceRoleKey,
    url,
  };
}

export function getAppUrl(requestOrigin?: string) {
  const explicitUrl = readEnv("NEXT_PUBLIC_APP_URL") ?? readEnv("APP_URL");
  const candidate = explicitUrl ?? requestOrigin ?? "http://localhost:3000";
  const parsed = new URL(candidate);
  const isProduction = parsed.protocol === "https:" && parsed.hostname === "eventrecruit.vercel.app";
  const isLocal = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);

  if (!isProduction && !isLocal) {
    throw new Error("NEXT_PUBLIC_APP_URL must be expo sphere production or a local development URL.");
  }

  return parsed.origin;
}
