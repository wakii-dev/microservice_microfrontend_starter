// Tests ports — free-port scan against a docker-compose text.
import { describe, expect, it } from 'vitest';
import { assertPortFree, nextFreePort, usedPorts } from './ports.js';

const COMPOSE = `services:
  postgres:
    ports:
      - "5432:5432"
  gateway:
    ports:
      - "\${GATEWAY_PORT:-8080}:8080"
  remote-tasks:
    ports:
      - "\${REMOTE_TASKS_PORT:-4001}:4001"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:4001/remoteEntry.js"]
  remote-activity:
    ports:
      - "\${REMOTE_ACTIVITY_PORT:-4002}:4002"
`;

describe('usedPorts', () => {
  it('collects mapping defaults, literals and healthcheck URLs', () => {
    const used = usedPorts(COMPOSE);
    for (const port of [4001, 4002, 5432, 8080]) {
      expect(used.has(port)).toBe(true);
    }
  });

  it('ignores version numbers and long numbers (lookarounds)', () => {
    const used = usedPorts('image: apache/kafka:3.9.0\nimage: nginx:1.27-alpine\nmaxRequestBodyBytes: 2097152\n');
    expect(used.size).toBe(0);
  });
});

describe('nextFreePort', () => {
  it('starts at 4003 (above the template remotes 4001/4002)', () => {
    expect(nextFreePort(COMPOSE)).toBe(4003);
  });

  it('skips ports the compose already references', () => {
    expect(nextFreePort(`${COMPOSE}  remote-inventory:\n    ports:\n      - "4003:4003"\n`)).toBe(4004);
  });

  it('picks 4003 even when 4002 is free (activity pruned — base stays 4003)', () => {
    const tasksOnly = COMPOSE.slice(0, COMPOSE.indexOf('  remote-activity:'));
    expect(nextFreePort(tasksOnly)).toBe(4003);
  });
});

describe('assertPortFree', () => {
  it('accepts an unused explicit port', () => {
    expect(() => assertPortFree(4100, COMPOSE)).not.toThrow();
  });

  it('throws on a port compose already uses, and on out-of-range values', () => {
    expect(() => assertPortFree(4001, COMPOSE)).toThrow(/already referenced/);
    expect(() => assertPortFree(80, COMPOSE)).toThrow(/integer in \[/);
    expect(() => assertPortFree(70000, COMPOSE)).toThrow(/integer in \[/);
    expect(() => assertPortFree(4003.5, COMPOSE)).toThrow(/integer in \[/);
  });
});
