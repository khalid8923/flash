/* ═══════════════════════════════════════════════════════════
   AI Health Tracker — Circuit breaker per provider
   ═══════════════════════════════════════════════════════════ */

interface ProviderHealth {
  totalCalls: number;
  totalFailures: number;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastError: string | null;
}

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;

const healthMap = new Map<string, ProviderHealth>();

function getOrCreate(name: string): ProviderHealth {
  let h = healthMap.get(name);
  if (!h) {
    h = {
      totalCalls: 0,
      totalFailures: 0,
      consecutiveFailures: 0,
      cooldownUntil: 0,
      lastError: null,
    };
    healthMap.set(name, h);
  }
  return h;
}

export function isHealthy(name: string): boolean {
  const h = healthMap.get(name);
  if (!h) return true;
  return h.cooldownUntil <= Date.now();
}

export function recordSuccess(name: string): void {
  const h = getOrCreate(name);
  h.totalCalls++;
  h.consecutiveFailures = 0;
  h.lastError = null;
}

export function recordFailure(name: string, error: string): void {
  const h = getOrCreate(name);
  h.totalCalls++;
  h.totalFailures++;
  h.consecutiveFailures++;
  h.lastError = error.slice(0, 200);
  if (h.consecutiveFailures >= FAILURE_THRESHOLD) {
    h.cooldownUntil = Date.now() + COOLDOWN_MS;
  }
}

export function getHealthReport() {
  return Array.from(healthMap.entries()).map(([name, h]) => ({
    name,
    ...h,
    healthy: h.cooldownUntil <= Date.now(),
    cooldown_remaining_ms: Math.max(0, h.cooldownUntil - Date.now()),
  }));
}