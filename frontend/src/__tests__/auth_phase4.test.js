// Unit & Integration Test for Phase 4: Frontend Auth & Protected Utilities
import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node environment
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

global.localStorage = new MockLocalStorage();

// Import auth module
const {
    parseJwt,
    isTokenExpired,
    normalizeRole,
    getAuthToken,
    setAuthSession,
    clearAuthSession,
    isAuthenticated,
    getLoginPath
} = await import('../utils/auth.js');

test('FE-01 & FE-02: normalizeRole correctly normalizes all role aliases', () => {
    assert.equal(normalizeRole('alien'), 'alien');
    assert.equal(normalizeRole('titan'), 'titan');
    assert.equal(normalizeRole('boardroom'), 'titan');
    assert.equal(normalizeRole('company'), 'titan');
    assert.equal(normalizeRole('admin'), 'admin');
    assert.equal(normalizeRole('thinking_engine'), 'admin');
    assert.equal(normalizeRole('volcano'), 'admin');
    assert.equal(normalizeRole(null), 'alien');
});

test('FE-02: parseJwt and isTokenExpired work accurately', () => {
    // Generate valid mock JWT payload (exp: now + 3600)
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const validPayload = Buffer.from(JSON.stringify({ sub: 'user_123', exp: validExp })).toString('base64url');
    const validToken = `header.${validPayload}.signature`;

    const parsed = parseJwt(validToken);
    assert.equal(parsed.sub, 'user_123');
    assert.equal(parsed.exp, validExp);
    assert.equal(isTokenExpired(validToken), false);

    // Generate expired mock JWT payload (exp: now - 3600)
    const expiredExp = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = Buffer.from(JSON.stringify({ sub: 'user_123', exp: expiredExp })).toString('base64url');
    const expiredToken = `header.${expiredPayload}.signature`;

    assert.equal(isTokenExpired(expiredToken), true);
    assert.equal(isTokenExpired(null), true);
    assert.equal(isTokenExpired('invalid-token'), true);
});

test('FE-02: setAuthSession and getAuthToken manage session lifecycle correctly', () => {
    global.localStorage.clear();

    const futureExp = Math.floor(Date.now() / 1000) + 7200;
    const payload = Buffer.from(JSON.stringify({ sub: 'alien_1', exp: futureExp })).toString('base64url');
    const token = `header.${payload}.sig`;

    // 1. Alien Role
    assert.equal(isAuthenticated('alien'), false);
    setAuthSession('alien', {
        access_token: token,
        refresh_token: 'refresh_123',
        user_info: { id: 1, name: 'Alien Pilot' }
    });

    assert.equal(isAuthenticated('alien'), true);
    assert.equal(getAuthToken('alien'), token);

    clearAuthSession('alien');
    assert.equal(isAuthenticated('alien'), false);
    assert.equal(getAuthToken('alien'), null);

    // 2. Titan Role
    const titanPayload = Buffer.from(JSON.stringify({ sub: 'titan_1', exp: futureExp })).toString('base64url');
    const titanToken = `header.${titanPayload}.sig`;

    setAuthSession('titan', {
        access_token: titanToken,
        refresh_token: 'titan_ref',
        user_info: { id: 2, company_name: 'Acme Corp' }
    });

    assert.equal(isAuthenticated('titan'), true);
    assert.equal(getAuthToken('titan'), titanToken);

    clearAuthSession('titan');
    assert.equal(isAuthenticated('titan'), false);

    // 3. Admin Role
    const adminPayload = Buffer.from(JSON.stringify({ sub: 'admin', exp: futureExp })).toString('base64url');
    const adminToken = `header.${adminPayload}.sig`;

    setAuthSession('admin', {
        access_token: adminToken,
        user_info: { username: 'admin' }
    });

    assert.equal(isAuthenticated('admin'), true);
    assert.equal(getAuthToken('admin'), adminToken);

    clearAuthSession('admin');
    assert.equal(isAuthenticated('admin'), false);
});

test('FE-03: getLoginPath resolves correct destination for unauthenticated users', () => {
    assert.equal(getLoginPath('alien'), '/login/alien');
    assert.equal(getLoginPath('titan'), '/login/boardroom');
    assert.equal(getLoginPath('boardroom'), '/login/boardroom');
    assert.equal(getLoginPath('admin'), '/thinking-engine/login');
    assert.equal(getLoginPath('thinking_engine'), '/thinking-engine/login');
});

test('FE-02: expired token triggers auto session clearance', () => {
    global.localStorage.clear();

    const expiredExp = Math.floor(Date.now() / 1000) - 100;
    const payload = Buffer.from(JSON.stringify({ sub: 'expired_user', exp: expiredExp })).toString('base64url');
    const expiredToken = `header.${payload}.sig`;

    global.localStorage.setItem('alien_token', expiredToken);
    global.localStorage.setItem('alien_user', JSON.stringify({ name: 'Expired Alien' }));

    // getAuthToken should detect expired token, purge session, and return null
    const resultToken = getAuthToken('alien');
    assert.equal(resultToken, null);
    assert.equal(global.localStorage.getItem('alien_token'), null);
    assert.equal(global.localStorage.getItem('alien_user'), null);
    assert.equal(isAuthenticated('alien'), false);
});
