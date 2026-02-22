# Contracts Package

Shared API contracts using ts-rest and Zod for type-safe API communication between frontend and backend.

## Usage in Backend

```typescript
import { initServer } from '@ts-rest/fastify';
import { contract } from '@repo/contracts';

const s = initServer();

const router = s.router(contract, {
  getUsers: async () => {
    // Implementation
    return { status: 200, body: users };
  },
});
```

## Usage in Frontend

### With React Query (Recommended)

```typescript
import { initQueryClient } from '@ts-rest/react-query';
import { contract } from '@repo/contracts';

export const client = initQueryClient(contract, {
  baseUrl: 'http://localhost:3001',
});

// In a component
function UsersPage() {
  const { data } = client.getUsers.useQuery(['users']);
  // data is fully typed!
}
```

### With Core Client

```typescript
import { initClient } from '@ts-rest/core';
import { contract } from '@repo/contracts';

const client = initClient(contract, {
  baseUrl: 'http://localhost:3001',
});

const { status, body } = await client.getUsers();
// Fully type-safe!
```

## Adding New Endpoints

1. Define your Zod schema
2. Add the endpoint to the contract
3. Implement it in the backend
4. Use it in the frontend with full type safety

