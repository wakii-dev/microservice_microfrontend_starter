// Tests naming — remote-name validation + identifier variants.
import { describe, expect, it } from 'vitest';
import { remoteNames, validateRemoteName } from './naming.js';

describe('validateRemoteName', () => {
  it('accepts kebab-case names', () => {
    for (const name of ['inventory', 'a', 'user-profile', 'shop2', 'v2-analytics']) {
      expect(validateRemoteName(name)).toBeNull();
    }
  });

  it('rejects empty / uppercase / underscores / bad dashes / leading digits', () => {
    for (const name of ['', 'Inventory', 'user_profile', '-lead', 'trail-', 'dou--ble', '9lives']) {
      expect(validateRemoteName(name)).toMatch(/Invalid remote name|required/);
    }
  });
});

describe('remoteNames — identifier variants', () => {
  it('single word: inventory', () => {
    const n = remoteNames('inventory');
    expect(n.pascal).toBe('Inventory');
    expect(n.upper).toBe('INVENTORY');
    expect(n.envPort).toBe('REMOTE_INVENTORY_PORT');
    expect(n.envUrl).toBe('REMOTE_INVENTORY_URL');
    expect(n.pkgName).toBe('@wakii/remote-inventory');
    expect(n.exposeKey).toBe('./InventoryPage');
    expect(n.pageComponent).toBe('InventoryPage');
  });

  it('multi word: user-profile', () => {
    const n = remoteNames('user-profile');
    expect(n.pascal).toBe('UserProfile');
    expect(n.upper).toBe('USER_PROFILE');
    expect(n.envPort).toBe('REMOTE_USER_PROFILE_PORT');
    expect(n.pageComponent).toBe('UserProfilePage');
  });
});
