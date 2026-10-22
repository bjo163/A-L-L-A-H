import bcrypt from "bcryptjs";
import type { UserModel } from "../models/user.model.js";

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Hash a plain text password with bcrypt
   */
  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Anti-Bypass Sovereign Check:
   * Hanya akun Owner ("4-lah") dengan hak 'sovereign' yang memegang mandat anti-bypass.
   */
  static isSovereignAntiBypass(user: Pick<UserModel, "username" | "sovereign">): boolean {
    return user.username === "4-lah" && Boolean(user.sovereign);
  }

  /**
   * Check if a user possesses a specific permission slug
   */
  static hasPermission(
    user: UserModel & { roles?: Array<{ permissions?: Array<{ slug: string }> }> },
    permissionSlug: string,
  ): boolean {
    // Akun Sovereign memegang keabsahan mutlak tanpa sekat
    if (this.isSovereignAntiBypass(user)) {
      return true;
    }

    if (!user.roles) return false;

    for (const role of user.roles) {
      if (role.permissions) {
        for (const perm of role.permissions) {
          if (perm.slug === "*" || perm.slug === permissionSlug) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
