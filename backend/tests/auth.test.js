import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupTestDB } from './helper.js';
import * as authService from '../src/services/auth.service.js';
import User from '../src/models/user.model.js';
import { redis } from '../src/config/redis.js';

describe('Auth Service Tests', () => {
  setupTestDB(before, after, afterEach);

  it('should register a new user successfully', async () => {
    const result = await authService.register(
      'Jane Doe',
      'jane@example.com',
      'password123'
    );

    assert.ok(result.user);
    assert.strictEqual(result.user.name, 'Jane Doe');
    assert.strictEqual(result.user.email, 'jane@example.com');
    assert.ok(result.tokens.accessToken);
    assert.ok(result.tokens.refreshToken);

    // Verify user is in MongoDB
    const userInDb = await User.findOne({ email: 'jane@example.com' });
    assert.ok(userInDb);
    assert.strictEqual(userInDb.name, 'Jane Doe');
  });

  it('should log in an existing user', async () => {
    // Pre-create user
    await authService.register('John Doe', 'john@example.com', 'securepass');

    const result = await authService.login('john@example.com', 'securepass');
    assert.ok(result.user);
    assert.strictEqual(result.user.email, 'john@example.com');
    assert.ok(result.tokens.accessToken);
  });

  it('should refresh tokens successfully using a valid refresh token', async () => {
    const reg = await authService.register('Alice', 'alice@example.com', 'password123');
    const refreshResult = await authService.refreshTokens(reg.tokens.refreshToken);

    assert.ok(refreshResult.accessToken);
    assert.ok(refreshResult.refreshToken);
  });

  it('should revoke refresh token upon logout', async () => {
    const reg = await authService.register('Bob', 'bob@example.com', 'password123');
    
    // Log out Bob
    await authService.logout(reg.tokens.refreshToken);

    // Try to refresh — should throw UnauthorizedError
    await assert.rejects(
      async () => {
        await authService.refreshTokens(reg.tokens.refreshToken);
      },
      /Invalid or expired refresh token/
    );
  });
});
