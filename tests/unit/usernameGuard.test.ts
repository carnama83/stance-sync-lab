import { validateUsername } from '@/lib/validations/username';

describe('Username Validation', () => {
  test('should accept valid usernames', () => {
    const validUsernames = [
      'user123',
      'valid_username',
      'User_Name_123',
      'abc',
      'a_b_c_d_e_f_g_h_i_j_k'
    ];

    validUsernames.forEach(username => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  test('should reject usernames that are too short', () => {
    const result = validateUsername('ab');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least 3 characters');
  });

  test('should reject usernames that are too long', () => {
    const result = validateUsername('a'.repeat(21));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('no more than 20 characters');
  });

  test('should reject usernames with invalid characters', () => {
    const invalidUsernames = [
      'user-name',
      'user@name',
      'user.name',
      'user name',
      'user+name',
      'user#name'
    ];

    invalidUsernames.forEach(username => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('letters, numbers, and underscores');
    });
  });

  test('should reject usernames starting or ending with underscore', () => {
    const invalidUsernames = ['_username', 'username_', '_username_'];

    invalidUsernames.forEach(username => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot start or end with underscore');
    });
  });

  test('should reject reserved usernames', () => {
    const reservedUsernames = [
      'admin',
      'ADMIN',
      'Admin',
      'root',
      'moderator',
      'system',
      'null',
      'undefined'
    ];

    reservedUsernames.forEach(username => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('reserved');
    });
  });

  test('should reject offensive usernames', () => {
    const offensiveUsernames = [
      'damn123',
      'fuckthis',
      'hellno',
      'nazi_user',
      'kill_me'
    ];

    offensiveUsernames.forEach(username => {
      const result = validateUsername(username);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('inappropriate content');
    });
  });

  test('should reject empty username', () => {
    const result = validateUsername('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });
});