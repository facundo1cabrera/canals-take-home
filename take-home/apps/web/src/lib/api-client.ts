'use client';

import { initQueryClient } from '@ts-rest/react-query';
import { contract } from '@repo/contracts';
import { env } from '@/env';

export const apiClient = initQueryClient(contract, {
  baseUrl: env.NEXT_PUBLIC_API_URL,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  api: async (args) => {
    const url = `${args.path}`;
    console.log('url', url);
    const response = await fetch(url, {
      method: args.method,
      headers: args.headers as Record<string, string>,
      body: args.body,
    });

    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  },
});
