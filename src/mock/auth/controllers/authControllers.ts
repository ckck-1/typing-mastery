/**
 * mock/auth/authController.ts
 *
 * Simulates a full JWT-based authentication backend:
 *   POST /auth/signup
 *   POST /auth/signin
 *   POST /auth/signout
 *   GET  /auth/session   (validate token)
 *   POST /auth/refresh
 *
 * Token is stored in localStorage as a signed-style opaque string.
 * Session expiry is 7 days (configurable).
 */

import { db, mockHash, type User } from "../../db/schema";
import { generateId } from "../../utils/id";
import { conflict, unauthorized, validationError, type ApiResponse } from "../../transport";

const TOKEN_KEY = "typing-academy.auth-token";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Token helpers ────────────────────────────────────────────────────────────

function mintToken(userId: string): string {
  // Simulated signed JWT — three base64url segments: header.payload.signature
  const header    = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload   = btoa(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS }));
  const signature = btoa(`mock-sig-${userId}-${Date.now()}`);
  return `${header}.${payload}.${signature}`;
}

function parseToken(token: string): { sub: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export function saveTokenLocally(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function loadTokenLocally(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function clearTokenLocally() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

// ─── Mock Auth User type ──────────────────────────────────────────────────────

export type MockAuthUser = {
  id: string;
  email: string;
  role: User["role"];
};

export type MockSession = {
  user: MockAuthUser;
  token: string;
  expiresAt: string;
};

// ─── Controller ───────────────────────────────────────────────────────────────

export const authController = {
  /**
   * Sign up a new user.
   * Validates email uniqueness, creates User + Profile, returns session.
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    username: string,
  ): Promise<ApiResponse<MockSession>> {
    // Validation
    if (!email || !email.includes("@")) validationError("Invalid email address");
    if (!password || password.length < 6) validationError("Password must be at least 6 characters");
    if (!name || name.trim().length === 0) validationError("Name is required");
    if (!username || username.length < 3) validationError("Username must be at least 3 characters");
    if (!/^[a-z0-9_.]+$/i.test(username)) validationError("Username may only contain letters, numbers, _ and .");

    const emailLower = email.trim().toLowerCase();
    const usernameLower = username.trim().toLowerCase();

    // Uniqueness checks
    const existingEmail = db.find("users", (u) => u.email === emailLower);
    if (existingEmail) conflict("An account with this email already exists");

    const existingUsername = db.find("profiles", (p) => p.username === usernameLower);
    if (existingUsername) conflict("Username is already taken");

    // Create user
    const now = new Date().toISOString();
    const userId = generateId("u");

    const newUser: User = {
      id: userId,
      email: emailLower,
      passwordHash: mockHash(password),
      createdAt: now,
      updatedAt: now,
      emailVerified: true, // skip email verification in mock
      role: "user",
    };
    db.insert("users", newUser);

    // Create profile
    db.insert("profiles", {
      id: userId,
      name: name.trim(),
      username: usernameLower,
      avatarUrl: null,
      bio: null,
      joined_at: now,
      streakDays: 0,
      totalLessons: 7,
      lessonsCompleted: 0,
    });

    // Mint token
    const token = mintToken(userId);
    saveTokenLocally(token);

    const session: MockSession = {
      user: { id: userId, email: emailLower, role: "user" },
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    return { data: session, status: 201, ok: true };
  },

  /**
   * Sign in with email + password.
   */
  async signIn(email: string, password: string): Promise<ApiResponse<MockSession>> {
    if (!email || !password) validationError("Email and password are required");

    const emailLower = email.trim().toLowerCase();
    const user = db.find("users", (u) => u.email === emailLower);

    if (!user) unauthorized("Invalid email or password");

    // Simulate timing-safe comparison
    const expectedHash = mockHash(password);
    if (user!.passwordHash !== expectedHash) {
      // Small extra delay to simulate bcrypt
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
      unauthorized("Invalid email or password");
    }

    const token = mintToken(user!.id);
    saveTokenLocally(token);

    const session: MockSession = {
      user: { id: user!.id, email: user!.email, role: user!.role },
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    return { data: session, status: 200, ok: true };
  },

  /**
   * Validate an existing token and return the session.
   * Called on app boot to restore auth state.
   */
  getSession(): MockSession | null {
    const token = loadTokenLocally();
    if (!token) return null;

    const parsed = parseToken(token);
    if (!parsed) { clearTokenLocally(); return null; }
    if (parsed.exp < Date.now()) { clearTokenLocally(); return null; }

    const user = db.find("users", (u) => u.id === parsed.sub);
    if (!user) { clearTokenLocally(); return null; }

    return {
      user: { id: user.id, email: user.email, role: user.role },
      token,
      expiresAt: new Date(parsed.exp).toISOString(),
    };
  },

  /**
   * Sign out — revoke local token.
   */
  signOut(): void {
    clearTokenLocally();
  },

  /**
   * Refresh token (extend expiry).
   */
  refresh(): MockSession | null {
    const session = this.getSession();
    if (!session) return null;

    const newToken = mintToken(session.user.id);
    saveTokenLocally(newToken);

    return {
      ...session,
      token: newToken,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
  },
};