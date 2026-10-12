# FLASH Backend Tests

## Run

    npm test              # watch mode
    npm run test:run      # single run
    npm run test:coverage # with coverage

## Structure

- `test/unit/` — pure functions (no DB, no network)
- `test/integration/` — with test DB (future)
- `test/fixtures/` — sample payloads

## Adding tests

1. Unit tests: import from `../../src/...`
2. Integration tests: use a test database (separate DATABASE_URL)
3. Never hit production APIs