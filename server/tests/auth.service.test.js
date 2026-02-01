// Set test environment before importing
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';

const authService = require('../src/auth/auth.service');
const usersRepository = require('../src/users/users.repository');

describe('Auth Service', () => {
  beforeAll(() => {
    usersRepository.initDb();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register('testuser1', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('username');
      expect(result.username).toBe('testuser1');
      expect(typeof result.token).toBe('string');
    });

    it('should hash the password', async () => {
      await authService.register('testuser2', 'mypassword');
      const user = await usersRepository.getUserByUsername('testuser2');

      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('mypassword');
      expect(user.password_hash.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should reject duplicate username', async () => {
      await authService.register('duplicate', 'password123');

      await expect(
        authService.register('duplicate', 'password456')
      ).rejects.toThrow('Username already exists');
    });

    it('should reject short password', async () => {
      await expect(
        authService.register('shortpass', '12345')
      ).rejects.toThrow('at least 6 characters');
    });

    it('should generate unique user IDs', async () => {
      const result1 = await authService.register('user1', 'password123');
      const result2 = await authService.register('user2', 'password123');

      expect(result1.userId).not.toBe(result2.userId);
    });
  });

  describe('login', () => {
    beforeAll(async () => {
      await authService.register('logintest', 'correctpassword');
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login('logintest', 'correctpassword');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('userId');
      expect(result.username).toBe('logintest');
    });

    it('should reject incorrect password', async () => {
      await expect(
        authService.login('logintest', 'wrongpassword')
      ).rejects.toThrow('Invalid username or password');
    });

    it('should reject non-existent user', async () => {
      await expect(
        authService.login('nonexistent', 'password123')
      ).rejects.toThrow('Invalid username or password');
    });

    it('should generate valid JWT token', async () => {
      const result = await authService.login('logintest', 'correctpassword');
      const decoded = authService.verifyToken(result.token);

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('logintest');
    });
  });

  describe('verifyToken', () => {
    let validToken;

    beforeAll(async () => {
      const result = await authService.register('tokentest', 'password123');
      validToken = result.token;
    });

    it('should verify valid token', () => {
      const decoded = authService.verifyToken(validToken);

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('tokentest');
    });

    it('should reject invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should reject malformed token', () => {
      expect(() => {
        authService.verifyToken('not-even-a-jwt');
      }).toThrow('Invalid or expired token');
    });
  });
});
