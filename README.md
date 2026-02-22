# Canals — Order Management API

A customer places an order with a shipping address and a list of products. The system geocodes the address, finds the nearest warehouse that has every requested item in stock (using PostGIS spatial queries), charges the customer's credit card, creates the order, and decrements inventory — all inside a single database transaction.

## Running the project

Requires **Node.js >= 18**, **pnpm >= 9** (`corepack enable`), and **Docker**.

```bash
pnpm install
pnpm start
```

`pnpm start` handles everything: starts a PostgreSQL + PostGIS container, runs migrations, seeds sample data (customers, products, warehouses with inventory), and launches both servers.

- **API** → http://localhost:3001
- **Web UI** → http://localhost:3000

## Using the frontend

Open http://localhost:3000. The **Orders** page lets you create orders through a form — select a customer, fill in a shipping address, pick products and quantities, and enter a credit card number. Created orders appear in the table above the form.

The **Inventory** page shows each warehouse's current stock. You can use it to verify that inventory decreases after placing an order.

**Mock payment rule:** credit card numbers ending in an **even digit succeed**, odd digits are **declined**. Use `4242424242424242` for success and `4242424242424243` for failure.

## Running tests

```bash
pnpm test
```

Integration tests run against `pg-mem` (an in-memory PostgreSQL emulator) so no running database is required. They cover order creation, error cases, inventory decrement, and response formatting. The PostGIS-dependent warehouse distance query is stubbed in tests since `pg-mem` doesn't support spatial extensions — that logic is validated against the real database during development.

## Technical decisions

**PostgreSQL + PostGIS** — Warehouse selection is a spatial problem: find the closest warehouse that stocks every item. Instead of fetching all warehouses and computing distances in Node, a single SQL query uses `ST_DISTANCE` on geography types (geodesic distance in meters), filters by inventory with `EXISTS` subqueries, and returns the nearest match. This scales well and pushes the work where it belongs.

**Request-scoped transactions** — Every request runs inside a Kysely transaction. A child TSyringe container is created per request with the transaction bound as the DB connection, so all services and repositories resolved in that request share it. If the payment mock throws, the order, address, and inventory changes roll back automatically.

**Prisma + Kysely** — Prisma manages the schema and migrations; Kysely handles runtime queries. Kysely's composable query builder supports raw SQL fragments (necessary for PostGIS), proper transaction handling, and type-safe dynamic `WHERE` clauses — things Prisma's query API doesn't handle well. The `prisma-kysely` generator bridges both: one schema, two tools for their strengths.

**TSyringe (dependency injection)** — Constructor injection makes services testable: in tests, the real DB is swapped for `pg-mem` and specific methods (like the PostGIS query) can be spied on without changing production code.

**Mock services** — Geocoding is a deterministic hash of the postal code (same code → same coordinates). Payment checks the credit card's last digit (even → success, odd → decline). Both are injectable services designed to be swapped for real implementations. In production, the payment would use the **outbox pattern** — writing a payment intent to a table and processing it asynchronously — since external side effects shouldn't live inside a DB transaction.

**ts-rest contracts** — The API contract is defined once in `packages/contracts` with Zod schemas and shared between backend (Fastify) and frontend (Next.js). Request/response types are enforced at compile time end-to-end.

**Money as integers** — All prices are stored in cents to avoid floating-point errors. Conversion to dollar strings happens at the API boundary.
