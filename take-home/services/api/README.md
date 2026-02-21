# API Service

Fastify API with ts-rest for type-safe API contracts.

## Development

```bash
# Install dependencies (from root)
pnpm install

# Run in development mode
pnpm --filter @repo/api dev

# Or with turbo
turbo run dev --filter=@repo/api
```

## Environment Variables

Create a `.env` file in this directory:

```
PORT=3001
```

## Build

```bash
pnpm --filter @repo/api build
```

## Start (Production)

```bash
pnpm --filter @repo/api start
```

## API Endpoints

The API implements the contract defined in `@repo/contracts`:

- `GET /users` - Get all users
- `GET /users/:id` - Get a user by ID
- `POST /users` - Create a new user

All endpoints are type-safe and validated using Zod schemas.

