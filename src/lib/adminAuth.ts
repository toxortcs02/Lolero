export const ADMIN_COOKIE_NAME = "lolero_admin";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Token stored in the admin cookie: a hash of password+secret, so the
 * cookie itself never carries the plaintext password and can't be reused
 * if only the secret or only the password leaks.
 */
export async function computeAdminToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!password || !secret) return null;
  return sha256Hex(`${password}:${secret}`);
}

export async function isValidAdminPassword(candidate: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && candidate === password;
}
