// FLASH - R05 Write Serialization Test
// 5 concurrent POST /sessions with the SAME client_session_id.
// Expected: 1x 201 accepted, 4x 200 already_accepted, 1 row in DB.

const BASE = "http://localhost:3000";
const SESSION_ID = crypto.randomUUID();

const body = {
  schema_version: 1,
  client_session_id: SESSION_ID,
  game_id: "seq-mem",
  domain_id: "memory",
  mode: "classic",
  seed: "test1234abcd5678",
  ticket_id: null,
  started_at: new Date(Date.now() - 120_000).toISOString(),
  ended_at: new Date().toISOString(),
  game_version: "1.0.0",
  scoring_version: 1,
  trials: [
    { index: 0, rt_ms: 2000, correct: true, is_practice: false, stimulus: {}, response: {} },
  ],
  config: { max_lives: 3 },
  client_meta: {
    user_agent: "test",
    viewport: { w: 1920, h: 1080 },
    device_id: "test",
    device_clock_skew_ms: null,
  },
  source: "live",
};

console.log("[TEST] R05 - 5 concurrent POST /sessions");
console.log("  client_session_id: " + SESSION_ID);

const start = Date.now();
const results = await Promise.all(
  Array.from({ length: 5 }, () =>
    fetch(BASE + "/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
  )
);
const elapsed = Date.now() - start;

const s201 = results.filter((r) => r.status === 201).length;
const s200 = results.filter((r) => r.status === 200).length;
const other = results.filter((r) => r.status !== 201 && r.status !== 200);

console.log("  Elapsed: " + elapsed + "ms");
console.log("  201 accepted:      " + s201);
console.log("  200 already_acc:   " + s200);
if (other.length > 0) {
  console.log("  Other statuses:");
  for (const r of other) console.log("    " + r.status + " " + JSON.stringify(r.body).slice(0, 120));
}

let fail = 0;
if (s201 === 1) console.log("  [PASS] exactly 1 new write");
else { console.log("  [FAIL] expected 1x 201, got " + s201); fail++; }

if (s200 === 4) console.log("  [PASS] exactly 4 duplicates");
else { console.log("  [FAIL] expected 4x 200, got " + s200); fail++; }

if (other.length === 0) console.log("  [PASS] no 5xx / unexpected");
else { console.log("  [FAIL] " + other.length + " unexpected responses"); fail++; }

console.log("");
console.log(fail === 0 ? "[ALL PASS]" : "[" + fail + " FAILED]");