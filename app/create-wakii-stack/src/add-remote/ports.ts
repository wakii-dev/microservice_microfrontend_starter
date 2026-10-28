// ports — pick a dev-server port for the new remote that does not collide with
// any port already referenced by the stack's docker-compose.yml. Remotes live
// in the 4001/4002/... band (conventions/05 port table), so the scan starts at
// REMOTE_PORT_BASE (4003) — above tasks (4001) and activity (4002).

/** First candidate port for a new remote (4001/4002 are the template remotes). */
export const REMOTE_PORT_BASE = 4003;

export const PORT_MIN = 1024;
export const PORT_MAX = 65535;

/**
 * Collect every 4–5 digit port-like number in a compose file. Deliberately
 * over-inclusive (comments, healthcheck URLs, env defaults) — a false positive
 * only excludes a candidate; a false negative would emit a colliding port.
 * Lookarounds skip versions ("3.9.0") and longer numbers ("2097152").
 */
export function usedPorts(composeText: string): Set<number> {
  const used = new Set<number>();
  for (const match of composeText.matchAll(/(?<![\w.])(\d{4,5})(?!\d)/g)) {
    used.add(Number(match[1]));
  }
  return used;
}

/**
 * Smallest free port >= start that compose does not reference.
 * Throws when the whole range is exhausted (practically impossible — surfaced
 * as a clear error instead of an infinite loop).
 */
export function nextFreePort(composeText: string, start = REMOTE_PORT_BASE): number {
  const used = usedPorts(composeText);
  for (let port = start; port <= PORT_MAX; port += 1) {
    if (!used.has(port)) return port;
  }
  throw new Error(`No free port found starting at ${start} — compose references every candidate port`);
}

/** Validate a user-supplied port and make sure compose does not use it yet. */
export function assertPortFree(port: number, composeText: string): void {
  if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
    throw new Error(`Port must be an integer in [${PORT_MIN}, ${PORT_MAX}] — received: ${port}`);
  }
  if (usedPorts(composeText).has(port)) {
    throw new Error(
      `Port ${port} is already referenced in platform/docker-compose.yml — pick another with --port`,
    );
  }
}
