/**
 * Username validation utilities for Epic A
 */

const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'moderator', 'mod', 'system', 'api',
  'www', 'mail', 'ftp', 'email', 'support', 'help', 'info', 'contact',
  'news', 'blog', 'forum', 'chat', 'user', 'users', 'account', 'profile',
  'settings', 'config', 'login', 'signup', 'register', 'auth', 'security',
  'privacy', 'terms', 'about', 'null', 'undefined', 'true', 'false'
];

const OFFENSIVE_PATTERNS = [
  /fuck|shit|damn|hell|ass|bitch|crap/i,
  /nazi|hitler|isis|terrorist/i,
  /kill|murder|death|suicide/i
];

export interface UsernameValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validates username according to Epic A requirements:
 * - 3-20 characters
 * - Alphanumeric + underscore only
 * - No leading/trailing underscore
 * - Not reserved or offensive
 */
export function validateUsername(username: string): UsernameValidation {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }

  if (username.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 20) {
    return { isValid: false, error: "Username must be no more than 20 characters" };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  if (username.startsWith('_') || username.endsWith('_')) {
    return { isValid: false, error: "Username cannot start or end with underscore" };
  }

  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { isValid: false, error: "This username is reserved" };
  }

  for (const pattern of OFFENSIVE_PATTERNS) {
    if (pattern.test(username)) {
      return { isValid: false, error: "Username contains inappropriate content" };
    }
  }

  return { isValid: true };
}