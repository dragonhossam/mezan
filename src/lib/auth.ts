import bcrypt from "bcryptjs";
import { User } from "../types";

/**
 * Checks if a string is a valid bcrypt hash.
 */
export function isBcryptHash(str: string): boolean {
  if (!str) return false;
  return (
    (str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$")) &&
    str.length === 60
  );
}

/**
 * Hashes a plain-text password using bcryptjs with 10 salt rounds.
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  // If it's already a bcrypt hash, return it as-is
  if (isBcryptHash(password)) return password;
  return bcrypt.hashSync(password, 10);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 */
export function comparePassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  
  // If the stored hash is actually a plain text password (pre-migration)
  if (!isBcryptHash(hash)) {
    return password.trim() === hash.trim();
  }
  
  try {
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    console.error("Error comparing passwords:", err);
    return false;
  }
}

/**
 * Validates a password against the security policy.
 * - At least 8 characters.
 * - Not equal to the username/email.
 * - Not on a common-password blocklist.
 */
export function validatePasswordPolicy(password: string, usernameOrEmail: string): { isValid: boolean; error?: string } {
  const p = password ? password.trim() : "";
  if (p.length < 8) {
    return { isValid: false, error: "كلمة المرور يجب أن لا تقل عن 8 خانات" };
  }

  const identity = usernameOrEmail ? usernameOrEmail.trim().toLowerCase() : "";
  const pLower = p.toLowerCase();

  if (identity && (pLower === identity || identity.includes(pLower) || pLower.includes(identity))) {
    return { isValid: false, error: "كلمة المرور لا يمكن أن تكون مطابقة أو مشابهة لاسم المستخدم أو البريد الإلكتروني" };
  }

  // Check email prefix if it's an email
  if (identity.includes("@")) {
    const prefix = identity.split("@")[0];
    if (prefix && (pLower === prefix || prefix.includes(pLower) || pLower.includes(prefix))) {
      return { isValid: false, error: "كلمة المرور لا يمكن أن تكون مشابهة للبريد الإلكتروني أو اسم الحساب" };
    }
  }

  const blocklist = ["admin", "1234", "password", "123456", "12345678", "123456789", "qwerty", "12345"];
  if (blocklist.some(weak => pLower.includes(weak) || weak.includes(pLower))) {
    return { isValid: false, error: "كلمة المرور سهلة التخمين وشائعة الاستخدام، يرجى اختيار كلمة مرور أكثر تعقيداً" };
  }

  return { isValid: true };
}

/**
 * Checks if a password matches a weak default password.
 */
export function isWeakDefaultPassword(password: string): boolean {
  if (!password) return false;
  const trimmed = password.trim();
  return trimmed === "admin" || trimmed === "1234";
}
