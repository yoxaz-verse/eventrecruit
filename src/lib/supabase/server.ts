import "server-only";
import { createAdminClient } from "./admin";

// Database transport only. Identity is resolved from app-owned sessions.
export async function createClient() {
  return createAdminClient();
}
