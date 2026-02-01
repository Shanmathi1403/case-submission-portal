// Set test environment before importing
process.env.DATABASE_PATH = ':memory:';

const usersRepository = require('../src/users/users.repository');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Users Repository', () => {
  beforeAll(() => {
    usersRepository.initDb();
  });

  describe('insertUser', () => {
    it('should insert a new user', async () => {
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('password123', 10);

      await usersRepository.insertUser({
        id: userId,
        username: 'newuser',
        passwordHash
      });

      const user = await usersRepository.getUserByUsername('newuser');
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.username).toBe('newuser');
      expect(user.password_hash).toBe(passwordHash);
    });

    it('should have created_at timestamp', async () => {
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('password123', 10);

      await usersRepository.insertUser({
        id: userId,
        username: 'timestampuser',
        passwordHash
      });

      const user = await usersRepository.getUserByUsername('timestampuser');
      expect(user.created_at).toBeDefined();
    });
  });

  describe('getUserByUsername', () => {
    beforeAll(async () => {
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('testpass', 10);
      await usersRepository.insertUser({
        id: userId,
        username: 'findme',
        passwordHash
      });
    });

    it('should find existing user', async () => {
      const user = await usersRepository.getUserByUsername('findme');
      expect(user).toBeDefined();
      expect(user.username).toBe('findme');
    });

    it('should return undefined for non-existent user', async () => {
      const user = await usersRepository.getUserByUsername('nonexistent');
      expect(user).toBeUndefined();
    });

    it('should be case-sensitive', async () => {
      const user = await usersRepository.getUserByUsername('FINDME');
      expect(user).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    let testUserId;

    beforeAll(async () => {
      testUserId = uuidv4();
      const passwordHash = await bcrypt.hash('testpass', 10);
      await usersRepository.insertUser({
        id: testUserId,
        username: 'findbyid',
        passwordHash
      });
    });

    it('should find user by ID', async () => {
      const user = await usersRepository.getUserById(testUserId);
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.username).toBe('findbyid');
    });

    it('should return undefined for non-existent ID', async () => {
      const user = await usersRepository.getUserById(uuidv4());
      expect(user).toBeUndefined();
    });
  });
});
